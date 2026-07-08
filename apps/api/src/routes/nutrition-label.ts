import { Hono } from "hono";
import { parseImageRecognitionRequest } from "../ai-security.js";
import { getBaiduCredentials, getBaiduAccessToken, baiduFetch } from "../baidu-auth.js";

type BaiduOcrRawWord = {
  words?: string;
};

type BaiduOcrRawResponse = {
  error_code?: number;
  error_msg?: string;
  words_result?: BaiduOcrRawWord[];
};

export type NutritionLabelMetrics = {
  name?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  defaultUnitGram?: number;
};

export type NutritionLabelRecognitionResponse = {
  mode: "nutrition-label";
  rawText: string;
  lines: string[];
  metrics: NutritionLabelMetrics;
};

const BAIDU_OCR_URL = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic";

export const nutritionLabelRoute = new Hono().post("/", async (context) => {
  const credentials = getBaiduCredentials();
  if (!credentials) {
    return context.json({ error: "Baidu OCR is not configured" }, 503);
  }

  const parsedRequest = await parseImageRecognitionRequest(context);
  if (!parsedRequest.ok) return parsedRequest.response;
  const body = parsedRequest.body;

  const accessToken = await getBaiduAccessToken(credentials.apiKey, credentials.secretKey);
  if (!accessToken) {
    return context.json({ error: "Failed to obtain Baidu access token" }, 502);
  }

  const upstream = await baiduFetch(`${BAIDU_OCR_URL}?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      image: body.imageBase64,
      language_type: "CHN_ENG",
      detect_direction: "true",
      paragraph: "true",
    }),
  });

  const payload = (await upstream.json().catch(() => null)) as BaiduOcrRawResponse | null;
  if (!upstream.ok || !payload) {
    return context.json({
      error: "Baidu OCR request failed",
      upstreamStatus: upstream.status,
    }, 502);
  }

  if (payload.error_code) {
    return context.json({
      error: payload.error_msg ?? "Baidu OCR returned an error",
      upstreamStatus: upstream.status,
      errorCode: payload.error_code,
    }, 502);
  }

  const lines = (payload.words_result ?? []).map((item) => item.words?.trim() ?? "").filter(Boolean);
  const rawText = lines.join("\n");

  return context.json({
    mode: "nutrition-label",
    rawText,
    lines,
    metrics: extractNutritionLabelMetrics(rawText, body.imageName),
  } satisfies NutritionLabelRecognitionResponse);
});

export function extractNutritionLabelMetrics(text: string, imageName?: string): NutritionLabelMetrics {
  const normalized = normalizeText(text);
  const energy = extractEnergyKcal(normalized);
  const protein = extractGramMetric(normalized, /蛋白质\s*(\d+(?:\.\d+)?)\s*(?:g|克)?/i);
  const fat = extractGramMetric(normalized, /脂肪\s*(\d+(?:\.\d+)?)\s*(?:g|克)?/i);
  const carbs = extractGramMetric(normalized, /碳水(?:化合物)?\s*(\d+(?:\.\d+)?)\s*(?:g|克)?/i);
  const serving = extractServingGram(normalized);

  return {
    name: inferName(text, imageName),
    caloriesPer100g: energy,
    proteinPer100g: protein,
    fatPer100g: fat,
    carbsPer100g: carbs,
    defaultUnitGram: serving,
  };
}

function normalizeText(text: string): string {
  return text
    .replace(/[，,]/g, " ")
    .replace(/[：:]/g, ":")
    .replace(/[千仟]焦/g, "kJ")
    .replace(/大卡|千卡/g, "kcal")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEnergyKcal(text: string): number | undefined {
  const kcal = text.match(/(?:能量|热量)\s*(\d+(?:\.\d+)?)\s*(?:kcal|kcal\/100g)/i);
  if (kcal?.[1]) return roundOne(Number(kcal[1]));

  const kj = text.match(/(?:能量|热量)\s*(\d+(?:\.\d+)?)\s*(?:kJ|KJ)/i);
  if (kj?.[1]) return roundOne(Number(kj[1]) / 4.184);

  return undefined;
}

function extractGramMetric(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  if (!match?.[1]) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? roundOne(parsed) : undefined;
}

function extractServingGram(text: string): number | undefined {
  const match = text.match(/(?:净含量|规格|每份|一份|每袋|每包)\s*(\d+(?:\.\d+)?)\s*(?:g|克)/i);
  if (!match?.[1]) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : undefined;
}

function inferName(text: string, imageName?: string): string | undefined {
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => /(?:品名|名称|产品名称)/.test(item));
  const productName = line?.match(/(?:品名|名称|产品名称)\s*[:：]?\s*([\u4e00-\u9fa5A-Za-z0-9（）()·\- ]{2,24})/);
  const fromText = productName?.[1]?.trim().replace(/\s+/g, " ");
  if (fromText) return fromText;

  const fromFile = imageName?.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return fromFile || undefined;
}

function roundOne(value: number): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return Math.round(value * 10) / 10;
}
