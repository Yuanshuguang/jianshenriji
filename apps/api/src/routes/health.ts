import { Hono } from "hono";

export const healthRoute = new Hono().get("/", (context) => {
  return context.json({
    ok: true,
    service: "fitness-calendar-api"
  });
});
