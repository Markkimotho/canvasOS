import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { collabRoutes } from "./routes/collab.js";
import { pluginRoutes } from "./routes/plugins.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";

const app = Fastify({
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
  },
});

// ── Security ──────────────────────────────────
await app.register(helmet, {
  contentSecurityPolicy: false, // managed by the web app
});
await app.register(cors, {
  origin: process.env["CORS_ORIGIN"]?.split(",") ?? ["http://localhost:3000"],
  credentials: true,
});
await app.register(rateLimit, {
  max: 200,
  timeWindow: "1 minute",
});

// ── WebSocket (Yjs collaboration) ─────────────
await app.register(websocket);

// ── Routes ────────────────────────────────────
await app.register(healthRoutes);
await app.register(collabRoutes, { prefix: "/api/v1/collab" });
await app.register(pluginRoutes, { prefix: "/api/v1/plugins" });
await app.register(projectRoutes, { prefix: "/api/v1/projects" });

// ── Start ─────────────────────────────────────
const port = parseInt(process.env["PORT"] ?? "3001", 10);
const host = process.env["HOST"] ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  console.debug(`CanvasOS API server listening at http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
