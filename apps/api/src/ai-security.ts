import type { Context, Next } from "hono";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
];

const DEFAULT_AI_RATE_LIMIT_MAX = 20;
const DEFAULT_AI_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type ImageRecognitionRequest = {
  imageBase64?: string;
  imageName?: string;
  imageMimeType?: string;
  topNum?: number;
};

export type ParsedImageRecognitionRequest = ImageRecognitionRequest & {
  imageBase64: string;
  imageMimeType: string;
  imageBytes: number;
};

export function resolveCorsOrigin(origin: string | undefined): string | null {
  if (!origin) return null;

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.has(origin) ? origin : null;
}

export function createAiRateLimitMiddleware() {
  const buckets = new Map<string, RateLimitBucket>();
  const maxRequests = readPositiveInteger(process.env.AI_RATE_LIMIT_MAX, DEFAULT_AI_RATE_LIMIT_MAX);
  const windowMs = readPositiveInteger(process.env.AI_RATE_LIMIT_WINDOW_MS, DEFAULT_AI_RATE_LIMIT_WINDOW_MS);

  // 定期清理过期桶，防止内存泄漏
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, windowMs);

  // 允许 Node 进程在 cleanupInterval 未 clear 时仍然正常退出
  if (cleanupInterval.unref) cleanupInterval.unref();

  return async (context: Context, next: Next) => {
    const now = Date.now();
    const key = getClientKey(context);
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      context.header("retry-after", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return context.json({ error: "Too many AI recognition requests" }, 429);
    }

    await next();
  };
}

export async function parseImageRecognitionRequest(context: Context): Promise<
  | { ok: true; body: ParsedImageRecognitionRequest }
  | { ok: false; response: Response }
> {
  let body: ImageRecognitionRequest;
  try {
    body = await context.req.json();
  } catch {
    return { ok: false, response: context.json({ error: "Invalid JSON body" }, 400) };
  }

  const parsed = normalizeImagePayload(body.imageBase64, body.imageMimeType);
  if (!parsed) {
    return { ok: false, response: context.json({ error: "imageBase64 is required" }, 400) };
  }

  if (!allowedImageMimeTypes.has(parsed.mimeType)) {
    return { ok: false, response: context.json({ error: "Unsupported image type" }, 415) };
  }

  const maxBytes = readPositiveInteger(process.env.AI_IMAGE_MAX_BYTES, DEFAULT_MAX_IMAGE_BYTES);
  if (parsed.bytes > maxBytes) {
    return { ok: false, response: context.json({ error: "Image is too large" }, 413) };
  }

  return {
    ok: true,
    body: {
      ...body,
      imageBase64: parsed.base64,
      imageMimeType: parsed.mimeType,
      imageBytes: parsed.bytes,
    },
  };
}

function getAllowedOrigins(): Set<string> {
  const configured = process.env.API_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configured && configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function getClientKey(context: Context): string {
  const forwardedFor = context.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = context.req.header("x-real-ip")?.trim();
  const origin = context.req.header("origin")?.trim();
  return forwardedFor || realIp || origin || "local";
}

function normalizeImagePayload(value?: string, explicitMimeType?: string) {
  if (!value) return null;

  const trimmed = value.trim();
  const dataUrlMatch = trimmed.match(/^data:([^;,]+);base64,(.+)$/i);
  const mimeType = (dataUrlMatch?.[1] ?? explicitMimeType ?? "image/jpeg").toLowerCase();
  const base64 = dataUrlMatch?.[2] ?? trimmed;
  const compactBase64 = base64.replace(/\s+/g, "");

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compactBase64)) {
    return null;
  }

  return {
    base64: compactBase64,
    mimeType,
    bytes: calculateBase64Bytes(compactBase64),
  };
}

function calculateBase64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

/** 可选 API Key 校验中间件。环境变量 API_REQUIRED_KEY 设置后才启用。 */
export function apiKeyAuth() {
  return async (context: Context, next: Next) => {
    const requiredKey = process.env.API_REQUIRED_KEY;
    // 未设置 API_REQUIRED_KEY 时跳过校验，本地开发默认不启用
    if (!requiredKey) {
      return await next();
    }
    const provided = context.req.header("x-api-key")?.trim();
    if (!provided || provided !== requiredKey) {
      return context.json({ error: "Unauthorized" }, 401);
    }
    return await next();
  };
}
