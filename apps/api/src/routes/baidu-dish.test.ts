import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import { normalizeBaiduDishRecognitionResponse } from "./baidu-dish.js";

test("baidu dish proxy normalizes response candidates by confidence", () => {
  const candidates = normalizeBaiduDishRecognitionResponse({
    result: [
      { name: "  螺蛳粉  ", calorie: "520", probability: "0.81", has_calorie: 1 },
      { name: "米线", calorie: 420, probability: 0.52, has_calorie: "0" },
      { name: "", calorie: 1, probability: 1 },
    ],
  });

  assert.deepEqual(candidates, [
    { name: "螺蛳粉", calories: 520, confidence: 0.81, hasCalorie: true, source: "baidu-dish-image" },
    { name: "米线", calories: 420, confidence: 0.52, hasCalorie: false, source: "baidu-dish-image" },
  ]);
});

test("baidu dish proxy fails closed when credentials are missing", async () => {
  const previousApiKey = process.env.BAIDU_AI_API_KEY;
  const previousSecret = process.env.BAIDU_AI_SECRET_KEY;
  delete process.env.BAIDU_AI_API_KEY;
  delete process.env.BAIDU_AI_SECRET_KEY;

  try {
    const app = createApp();
    const response = await app.request("/api/ai/dish-recognition", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "abc" }),
      headers: { "content-type": "application/json" },
    });

    assert.equal(response.status, 503);
  } finally {
    if (previousApiKey) process.env.BAIDU_AI_API_KEY = previousApiKey;
    else delete process.env.BAIDU_AI_API_KEY;
    if (previousSecret) process.env.BAIDU_AI_SECRET_KEY = previousSecret;
    else delete process.env.BAIDU_AI_SECRET_KEY;
  }
});

test("baidu dish proxy sends image to upstream token and recognition endpoints", async () => {
  const previousApiKey = process.env.BAIDU_AI_API_KEY;
  const previousSecret = process.env.BAIDU_AI_SECRET_KEY;
  const previousFetch = globalThis.fetch;
  process.env.BAIDU_AI_API_KEY = "test-ak";
  process.env.BAIDU_AI_SECRET_KEY = "test-sk";

  const requestedUrls: string[] = [];
  const requestedBodies: string[] = [];
  globalThis.fetch = (async (input, init) => {
    requestedUrls.push(String(input));
    if (String(input).includes("/oauth/2.0/token")) {
      return new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (String(input).includes("/image-classify/v2/dish")) {
      requestedBodies.push(String(init?.body ?? ""));
      return new Response(JSON.stringify({
        result: [{ name: "螺蛳粉", calorie: 520, probability: 0.81 }],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    throw new Error(`Unexpected fetch url: ${String(input)}`);
  }) as typeof fetch;

  try {
    const app = createApp();
    const response = await app.request("/api/ai/dish-recognition", {
      method: "POST",
      body: JSON.stringify({ imageBase64: "data:image/jpeg;base64,AAAA", topNum: 3 }),
      headers: { "content-type": "application/json" },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(requestedUrls.length, 2);
    assert.match(requestedUrls[0] ?? "", /oauth\/2\.0\/token/);
    assert.match(requestedUrls[1] ?? "", /image-classify\/v2\/dish/);
    assert.match(requestedBodies[0] ?? "", /image=AAAA/);
    assert.match(requestedBodies[0] ?? "", /top_num=3/);
    assert.deepEqual(payload.candidates[0], {
      name: "螺蛳粉",
      calories: 520,
      confidence: 0.81,
      source: "baidu-dish-image",
    });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey) process.env.BAIDU_AI_API_KEY = previousApiKey;
    else delete process.env.BAIDU_AI_API_KEY;
    if (previousSecret) process.env.BAIDU_AI_SECRET_KEY = previousSecret;
    else delete process.env.BAIDU_AI_SECRET_KEY;
  }
});
