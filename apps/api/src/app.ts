import { Hono } from "hono";
import { exercisesRoute } from "./routes/exercises.js";
import { healthRoute } from "./routes/health.js";

export function createApp() {
  const app = new Hono();

  app.route("/api/health", healthRoute);
  app.route("/api/exercises", exercisesRoute);

  return app;
}
