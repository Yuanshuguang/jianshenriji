import { Hono } from "hono";
import { cors } from "hono/cors";
import { exercisesRoute } from "./routes/exercises.js";
import { baiduDishRoute } from "./routes/baidu-dish.js";
import { bodyReportRoute } from "./routes/body-report.js";
import { healthRoute } from "./routes/health.js";
import { nutritionLabelRoute } from "./routes/nutrition-label.js";
import { createAiRateLimitMiddleware, resolveCorsOrigin } from "./ai-security.js";

export function createApp() {
  const app = new Hono();

  app.use("/api/*", cors({
    origin: (origin) => resolveCorsOrigin(origin) ?? "",
    allowHeaders: ["content-type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }));
  app.use("/api/ai/*", createAiRateLimitMiddleware());

  app.route("/api/health", healthRoute);
  app.route("/api/exercises", exercisesRoute);
  app.route("/api/ai/dish-recognition", baiduDishRoute);
  app.route("/api/ai/body-report-recognition", bodyReportRoute);
  app.route("/api/ai/nutrition-label-recognition", nutritionLabelRoute);

  return app;
}
