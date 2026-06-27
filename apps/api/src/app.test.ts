import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "./app.js";

test("health route reports service status", async () => {
  const app = createApp();
  const response = await app.request("/api/health");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "fitness-calendar-api");
});

test("exercise proxy fails closed when server secret is missing", async () => {
  const previousKey = process.env.WORKOUTX_API_KEY;
  delete process.env.WORKOUTX_API_KEY;
  const app = createApp();

  try {
    const response = await app.request("/api/exercises");
    assert.equal(response.status, 503);
  } finally {
    if (previousKey) {
      process.env.WORKOUTX_API_KEY = previousKey;
    }
  }
});

test("exercise proxy rejects invalid query parameters before upstream fetch", async () => {
  const previousKey = process.env.WORKOUTX_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.WORKOUTX_API_KEY = "test-workoutx-key";
  globalThis.fetch = (() => {
    throw new Error("fetch should not be called for invalid requests");
  }) as typeof fetch;
  const app = createApp();

  try {
    const badOffset = await app.request("/api/exercises?offset=-1");
    const badBodyPart = await app.request("/api/exercises?bodyPart=Unknown");

    assert.equal(badOffset.status, 400);
    assert.equal(badBodyPart.status, 400);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey) {
      process.env.WORKOUTX_API_KEY = previousKey;
    } else {
      delete process.env.WORKOUTX_API_KEY;
    }
  }
});

test("exercise proxy forwards allowlisted parameters with server-side key", async () => {
  const previousKey = process.env.WORKOUTX_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.WORKOUTX_API_KEY = "test-workoutx-key";
  let requestedUrl = "";
  let requestKey = "";
  globalThis.fetch = ((input, init) => {
    requestedUrl = String(input);
    requestKey = new Headers(init?.headers).get("X-WorkoutX-Key") ?? "";
    return Promise.resolve(new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    }));
  }) as typeof fetch;
  const app = createApp();

  try {
    const response = await app.request("/api/exercises?offset=24&bodyPart=Chest");

    assert.equal(response.status, 200);
    assert.equal(requestKey, "test-workoutx-key");
    assert.match(requestedUrl, /offset=24/);
    assert.match(requestedUrl, /bodyPart=Chest/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey) {
      process.env.WORKOUTX_API_KEY = previousKey;
    } else {
      delete process.env.WORKOUTX_API_KEY;
    }
  }
});
