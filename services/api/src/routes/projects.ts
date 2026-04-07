import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import pg from "pg";
import crypto from "crypto";

const { Pool } = pg;

export const projectsPool = new Pool({
  connectionString: process.env["DATABASE_URL"],
});

// ── Validation Schemas ─────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  metadata: z.record(z.unknown()).optional().default({}),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
  yjs_state_base64: z.string().optional(),
});

// ── Routes ─────────────────────────────────────────────────────────────────

export const projectRoutes: FastifyPluginAsync = async (app) => {
  // GET / — list projects
  app.get("/", async (_request, reply) => {
    try {
      const result = await projectsPool.query<{
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date;
        metadata: Record<string, unknown>;
      }>(
        `SELECT id, name, created_at, updated_at, metadata
         FROM projects
         ORDER BY updated_at DESC
         LIMIT 100`,
      );
      return reply.send(result.rows);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /:id — get single project
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await projectsPool.query<{
        id: string;
        name: string;
        owner_id: string | null;
        created_at: Date;
        updated_at: Date;
        yjs_state: Buffer | null;
        metadata: Record<string, unknown>;
      }>(
        `SELECT id, name, owner_id, created_at, updated_at, yjs_state, metadata
         FROM projects
         WHERE id = $1`,
        [id],
      );

      if (result.rowCount === 0) {
        return reply.status(404).send({ error: "Project not found" });
      }

      const row = result.rows[0]!;
      return reply.send({
        ...row,
        yjs_state: row.yjs_state ? (row.yjs_state as Buffer).toString("base64") : null,
      });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // POST / — create project
  app.post("/", async (request, reply) => {
    const parsed = CreateProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { name, metadata } = parsed.data;
    const id = crypto.randomUUID();

    try {
      const result = await projectsPool.query<{
        id: string;
        name: string;
        owner_id: string | null;
        created_at: Date;
        updated_at: Date;
        metadata: Record<string, unknown>;
      }>(
        `INSERT INTO projects (id, name, metadata)
         VALUES ($1, $2, $3)
         RETURNING id, name, owner_id, created_at, updated_at, metadata`,
        [id, name, JSON.stringify(metadata)],
      );

      return reply.status(201).send(result.rows[0]);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // PUT /:id — update project
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const parsed = UpdateProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { name, metadata, yjs_state_base64 } = parsed.data;

    // Build dynamic SET clause
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (name !== undefined) {
      setClauses.push(`name = $${paramIdx}`);
      values.push(name);
      paramIdx++;
    }
    if (metadata !== undefined) {
      setClauses.push(`metadata = $${paramIdx}`);
      values.push(JSON.stringify(metadata));
      paramIdx++;
    }
    if (yjs_state_base64 !== undefined) {
      setClauses.push(`yjs_state = $${paramIdx}`);
      values.push(Buffer.from(yjs_state_base64, "base64"));
      paramIdx++;
    }

    values.push(id); // final param for WHERE

    try {
      const result = await projectsPool.query<{
        id: string;
        name: string;
        owner_id: string | null;
        created_at: Date;
        updated_at: Date;
        metadata: Record<string, unknown>;
      }>(
        `UPDATE projects
         SET ${setClauses.join(", ")}
         WHERE id = $${paramIdx}
         RETURNING id, name, owner_id, created_at, updated_at, metadata`,
        values,
      );

      if (result.rowCount === 0) {
        return reply.status(404).send({ error: "Project not found" });
      }

      return reply.send(result.rows[0]);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // DELETE /:id — delete project
  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await projectsPool.query(`DELETE FROM projects WHERE id = $1`, [id]);

      if (result.rowCount === 0) {
        return reply.status(404).send({ error: "Project not found" });
      }

      return reply.status(204).send();
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
};
