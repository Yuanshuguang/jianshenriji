import { Hono } from "hono";

const WORKOUTX_BASE_URL = "https://api.workoutxapp.com/v1/exercises";
const WORKOUTX_REQUEST_TIMEOUT_MS = 8_000;
const MAX_OFFSET = 5_000;
const allowedBodyParts = new Set([
  "Chest",
  "Back",
  "Upper Arms",
  "Lower Arms",
  "Shoulders",
  "Waist",
  "Upper Legs",
  "Lower Legs",
  "Cardio",
  "Neck"
]);

export const exercisesRoute = new Hono().get("/", async (context) => {
  const apiKey = process.env.WORKOUTX_API_KEY;
  if (!apiKey) {
    return context.json({ error: "WorkoutX proxy is not configured" }, 503);
  }

  const upstreamUrl = new URL(WORKOUTX_BASE_URL);
  const offset = context.req.query("offset");
  const bodyPart = context.req.query("bodyPart");
  if (offset) {
    const parsedOffset = Number(offset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0 || parsedOffset > MAX_OFFSET) {
      return context.json({ error: "Invalid exercise offset" }, 400);
    }
    upstreamUrl.searchParams.set("offset", String(parsedOffset));
  }
  if (bodyPart && bodyPart !== "all") {
    if (!allowedBodyParts.has(bodyPart)) {
      return context.json({ error: "Invalid exercise bodyPart" }, 400);
    }
    upstreamUrl.searchParams.set("bodyPart", bodyPart);
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), WORKOUTX_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        "X-WorkoutX-Key": apiKey
      },
      signal: abortController.signal
    });

    const body = await response.text();
    const headers = new Headers({
      "content-type": response.headers.get("content-type") ?? "application/json"
    });
    if (response.ok) {
      headers.set("cache-control", "public, max-age=3600");
    }

    return new Response(body, {
      status: response.status,
      headers
    });
  } catch {
    return context.json({ error: "WorkoutX proxy request failed" }, 502);
  } finally {
    clearTimeout(timeout);
  }
});
