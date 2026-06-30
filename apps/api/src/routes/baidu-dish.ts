import { Hono } from "hono";
import { parseImageRecognitionRequest } from "../ai-security.js";

type BaiduTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type BaiduDishRecognitionRawItem = {
  name?: string;
  calorie?: string | number;
  calories?: string | number;
  probability?: string | number;
  score?: string | number;
  has_calorie?: string | number | boolean;
};

type BaiduDishRecognitionRawResponse = {
  log_id?: number;
  error_code?: number;
  error_msg?: string;
  result?: BaiduDishRecognitionRawItem[];
};

export type BaiduDishRecognitionCandidate = {
  name: string;
  calories?: number;
  confidence?: number;
  hasCalorie?: boolean;
  source: "baidu-dish-image";
};

const BAIDU_TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
const BAIDU_DISH_URL = "https://aip.baidubce.com/rest/2.0/image-classify/v2/dish";
const DEFAULT_TOP_NUM = 5;
const TOKEN_SAFETY_WINDOW_MS = 60_000;

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

export const baiduDishRoute = new Hono().post("/", async (context) => {
  const credentials = getBaiduCredentials();
  if (!credentials) {
    return context.json({ error: "Baidu dish recognition is not configured" }, 503);
  }

  const parsedRequest = await parseImageRecognitionRequest(context);
  if (!parsedRequest.ok) return parsedRequest.response;
  const body = parsedRequest.body;

  const topNum = normalizeTopNum(body.topNum);
  const accessToken = await getBaiduAccessToken(credentials.apiKey, credentials.secretKey);
  if (!accessToken) {
    return context.json({ error: "Failed to obtain Baidu access token" }, 502);
  }

  const upstream = await fetch(`${BAIDU_DISH_URL}?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      image: body.imageBase64,
      top_num: String(topNum),
      baike_num: "0",
    }),
  });

  const payload = (await upstream.json().catch(() => null)) as BaiduDishRecognitionRawResponse | null;
  if (!upstream.ok || !payload) {
    return context.json({
      error: "Baidu dish recognition request failed",
      upstreamStatus: upstream.status,
    }, 502);
  }

  if (payload.error_code) {
    return context.json({
      error: payload.error_msg ?? "Baidu dish recognition returned an error",
      upstreamStatus: upstream.status,
      errorCode: payload.error_code,
    }, 502);
  }

  return context.json({
    candidates: normalizeBaiduDishRecognitionResponse(payload),
  });
});

export function normalizeBaiduDishRecognitionResponse(response: BaiduDishRecognitionRawResponse): BaiduDishRecognitionCandidate[] {
  return (response.result ?? [])
    .map((item) => ({
      name: item.name?.trim() ?? "",
      calories: parseOptionalNumber(item.calorie ?? item.calories),
      confidence: parseOptionalNumber(item.probability ?? item.score),
      hasCalorie: parseOptionalBoolean(item.has_calorie),
      source: "baidu-dish-image" as const,
    }))
    .filter((item) => item.name.length > 0)
    .sort((left, right) => (right.confidence ?? 0) - (left.confidence ?? 0));
}

function getBaiduCredentials() {
  const apiKey = process.env.BAIDU_AI_API_KEY ?? process.env.BAIDU_AK;
  const secretKey = process.env.BAIDU_AI_SECRET_KEY ?? process.env.BAIDU_SK;
  if (!apiKey || !secretKey) return null;
  return { apiKey, secretKey };
}

async function getBaiduAccessToken(apiKey: string, secretKey: string): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now) {
    return cachedAccessToken;
  }

  const tokenUrl = new URL(BAIDU_TOKEN_URL);
  tokenUrl.searchParams.set("grant_type", "client_credentials");
  tokenUrl.searchParams.set("client_id", apiKey);
  tokenUrl.searchParams.set("client_secret", secretKey);

  const response = await fetch(tokenUrl);
  const payload = (await response.json().catch(() => null)) as BaiduTokenResponse | null;
  if (!response.ok || !payload?.access_token) {
    return null;
  }

  const expiresIn = Number(payload.expires_in ?? 0);
  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = now + Math.max(0, expiresIn * 1000 - TOKEN_SAFETY_WINDOW_MS);
  return cachedAccessToken;
}

function normalizeTopNum(value: number | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return DEFAULT_TOP_NUM;
  const normalized = Math.max(1, Math.min(5, Math.round(value ?? DEFAULT_TOP_NUM)));
  return normalized;
}

function parseOptionalNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalBoolean(value: string | number | boolean | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (value === "1" || value.toLowerCase() === "true") return true;
  if (value === "0" || value.toLowerCase() === "false") return false;
  return undefined;
}
