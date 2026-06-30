import { Hono } from "hono";
import { cors } from "hono/cors";
import { exercisesRoute } from "./routes/exercises.js";
import { baiduDishRoute } from "./routes/baidu-dish.js";
import { healthRoute } from "./routes/health.js";

export function createApp() {
  const app = new Hono();

  app.use("/api/*", cors({
    origin: "*",
    allowHeaders: ["content-type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  }));

  app.route("/api/health", healthRoute);
  app.route("/api/exercises", exercisesRoute);
  app.route("/api/ai/dish-recognition", baiduDishRoute);

  return app;
}
