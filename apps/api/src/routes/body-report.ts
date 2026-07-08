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

export type BodyReportRecognitionMetrics = {
  bmi?: number;
  bodyFatPercent?: number;
  skeletalMuscleKg?: number;
  waterPercent?: number;
  basalMetabolismKcal?: number;
};

export type BodyReportRecognitionResponse = {
  mode: "report";
  rawText: string;
  lines: string[];
  metrics: BodyReportRecognitionMetrics;
};

const BAIDU_OCR_URL = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic";

export const bodyReportRoute = new Hono().post("/", async (context) => {
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
  const metrics = extractBodyReportMetrics(rawText);

  return context.json({
    mode: "report",
    rawText,
    lines,
    metrics,
  } satisfies BodyReportRecognitionResponse);
});

export function extractBodyReportMetrics(text: string): BodyReportRecognitionMetrics {
  const normalizedText = normalizeReportText(text);
  return {
    bmi: extractMetric(normalizedText, /(?:BMI|体重指数)\s*[:：]?\s*(\d+(?:\.\d+)?)/i),
    bodyFatPercent: extractMetric(normalizedText, /(?:体脂率|脂肪率|体脂)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*%?/i),
    skeletalMuscleKg: extractMetric(normalizedText, /(?:骨骼肌(?:量)?|肌肉量)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:kg|千克|公斤)?/i),
    waterPercent: extractMetric(normalizedText, /(?:身体水分|水分)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*%?/i),
    basalMetabolismKcal: extractMetric(normalizedText, /(?:基础代谢(?:率)?|基础代谢)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:kcal|千卡|大卡)?/i),
  };
}

function normalizeReportText(text: string): string {
  return text
    .replace(/[，,]/g, " ")
    .replace(/[：:]/g, ":")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMetric(text: string, pattern: RegExp, fallback?: number): number | undefined {
  const match = text.match(pattern);
  if (!match?.[1]) return fallback;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}
