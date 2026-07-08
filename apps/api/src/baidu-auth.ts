import type { Context } from "hono";

type BaiduTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

const BAIDU_TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
const TOKEN_SAFETY_WINDOW_MS = 60_000;

/** 百度上游 API 请求超时：15 秒 */
export const BAIDU_FETCH_TIMEOUT_MS = 15_000;

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

/** 从环境变量读取百度 API 凭据，凭据缺失返回 null */
export function getBaiduCredentials(): { apiKey: string; secretKey: string } | null {
  const apiKey = process.env.BAIDU_AI_API_KEY ?? process.env.BAIDU_AK;
  const secretKey = process.env.BAIDU_AI_SECRET_KEY ?? process.env.BAIDU_SK;
  if (!apiKey || !secretKey) return null;
  return { apiKey, secretKey };
}

/** 获取（且缓存）百度 Access Token */
export async function getBaiduAccessToken(apiKey: string, secretKey: string): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now) {
    return cachedAccessToken;
  }

  const tokenUrl = new URL(BAIDU_TOKEN_URL);
  tokenUrl.searchParams.set("grant_type", "client_credentials");
  tokenUrl.searchParams.set("client_id", apiKey);
  tokenUrl.searchParams.set("client_secret", secretKey);

  const response = await fetch(tokenUrl, { signal: AbortSignal.timeout(BAIDU_FETCH_TIMEOUT_MS) });
  const payload = (await response.json().catch(() => null)) as BaiduTokenResponse | null;
  if (!response.ok || !payload?.access_token) {
    return null;
  }

  const expiresIn = Number(payload.expires_in ?? 0);
  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = now + Math.max(0, expiresIn * 1000 - TOKEN_SAFETY_WINDOW_MS);
  return cachedAccessToken;
}

/** 用超时控制发起到百度的 fetch 请求 */
export async function baiduFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BAIDU_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
