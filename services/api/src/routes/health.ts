import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return { status: "ok", version: "1.0.0", timestamp: new Date().toISOString() };
  });
}
