import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "./app.js";
import { resolveCorsOrigin } from "./ai-security.js";

test("AI CORS allows only configured or local development origins", () => {
  const previousOrigins = process.env.API_ALLOWED_ORIGINS;
  delete process.env.API_ALLOWED_ORIGINS;

  try {
    assert.equal(resolveCorsOrigin("http://localhost:8081"), "http://localhost:8081");
    assert.equal(resolveCorsOrigin("https://evil.example"), null);
  } finally {
    if (previousOrigins) process.env.API_ALLOWED_ORIGINS = previousOrigins;
    else delete process.env.API_ALLOWED_ORIGINS;
  }
});

test("AI image routes reject unsupported image types before upstream calls", async () => {
  const previousApiKey = process.env.BAIDU_AI_API_KEY;
  const previousSecret = process.env.BAIDU_AI_SECRET_KEY;
  const previousFetch = globalThis.fetch;
  process.env.BAIDU_AI_API_KEY = "test-ak";
  process.env.BAIDU_AI_SECRET_KEY = "test-sk";
  globalThis.fetch = (() => {
    throw new Error("fetch should not be called for invalid images");
  }) as typeof fetch;

  try {
    const app = createApp();
    const response = await app.request("/api/ai/dish-recognition", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "data:text/plain;base64,AAAA" }),
      headers: { "content-type": "application/json" },
    });

    assert.equal(response.status, 415);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey) process.env.BAIDU_AI_API_KEY = previousApiKey;
    else delete process.env.BAIDU_AI_API_KEY;
    if (previousSecret) process.env.BAIDU_AI_SECRET_KEY = previousSecret;
    else delete process.env.BAIDU_AI_SECRET_KEY;
  }
});

test("AI image routes reject oversized images before upstream calls", async () => {
  const previousApiKey = process.env.BAIDU_AI_API_KEY;
  const previousSecret = process.env.BAIDU_AI_SECRET_KEY;
  const previousMaxBytes = process.env.AI_IMAGE_MAX_BYTES;
  const previousFetch = globalThis.fetch;
  process.env.BAIDU_AI_API_KEY = "test-ak";
  process.env.BAIDU_AI_SECRET_KEY = "test-sk";
  process.env.AI_IMAGE_MAX_BYTES = "2";
  globalThis.fetch = (() => {
    throw new Error("fetch should not be called for oversized images");
  }) as typeof fetch;

  try {
    const app = createApp();
    const response = await app.request("/api/ai/body-report-recognition", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "data:image/jpeg;base64,AAAA" }),
      headers: { "content-type": "application/json" },
    });

    assert.equal(response.status, 413);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey) process.env.BAIDU_AI_API_KEY = previousApiKey;
    else delete process.env.BAIDU_AI_API_KEY;
    if (previousSecret) process.env.BAIDU_AI_SECRET_KEY = previousSecret;
    else delete process.env.BAIDU_AI_SECRET_KEY;
    if (previousMaxBytes) process.env.AI_IMAGE_MAX_BYTES = previousMaxBytes;
    else delete process.env.AI_IMAGE_MAX_BYTES;
  }
});

test("AI image routes rate-limit repeated requests", async () => {
  const previousApiKey = process.env.BAIDU_AI_API_KEY;
  const previousSecret = process.env.BAIDU_AI_SECRET_KEY;
  const previousRateLimit = process.env.AI_RATE_LIMIT_MAX;
  const previousFetch = globalThis.fetch;
  process.env.BAIDU_AI_API_KEY = "test-ak";
  process.env.BAIDU_AI_SECRET_KEY = "test-sk";
  process.env.AI_RATE_LIMIT_MAX = "1";
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), {
    status: 200,
    headers: { "content-type": "application/json" },
  }))) as typeof fetch;

  try {
    const app = createApp();
    const request = {
      method: "POST",
      body: JSON.stringify({ imageBase64: "data:image/jpeg;base64,AAAA" }),
      headers: { "content-type": "application/json", "x-real-ip": "203.0.113.10" },
    };

    await app.request("/api/ai/nutrition-label-recognition", request);
    const second = await app.request("/api/ai/nutrition-label-recognition", request);

    assert.equal(second.status, 429);
    assert.equal(second.headers.has("retry-after"), true);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey) process.env.BAIDU_AI_API_KEY = previousApiKey;
    else delete process.env.BAIDU_AI_API_KEY;
    if (previousSecret) process.env.BAIDU_AI_SECRET_KEY = previousSecret;
    else delete process.env.BAIDU_AI_SECRET_KEY;
    if (previousRateLimit) process.env.AI_RATE_LIMIT_MAX = previousRateLimit;
    else delete process.env.AI_RATE_LIMIT_MAX;
  }
});
