import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { healthRoute } from "./routes/health.js";

const app = new Hono();

app.route("/api/health", healthRoute);

const port = Number(process.env.PORT ?? 8787);

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`);
  }
);
