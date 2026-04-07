import type { FastifyInstance } from "fastify";
import { z } from "zod";

// In production this would come from a PostgreSQL database.
// For now, a static registry of example plugins.
const PLUGINS = [
  {
    id: "example-color-palette",
    name: "Auto Color Palette",
    description: "Extracts a color palette from the active layer",
    author: "CanvasOS Team",
    version: "1.0.0",
    category: "color",
    installUrl: "/plugins/example-color-palette/index.js",
    icon: null,
    downloads: 1200,
  },
  {
    id: "example-noise-generator",
    name: "Noise Generator",
    description: "Generates Perlin/Simplex noise layers",
    author: "CanvasOS Team",
    version: "1.2.0",
    category: "generation",
    installUrl: "/plugins/example-noise-generator/index.js",
    icon: null,
    downloads: 980,
  },
];

const QuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function pluginRoutes(app: FastifyInstance) {
  // GET /api/v1/plugins
  app.get("/", async (request) => {
    const query = QuerySchema.safeParse(request.query);
    if (!query.success) {
      return { plugins: [], total: 0 };
    }
    const { search, category, page, limit } = query.data;

    let filtered = PLUGINS;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    const start = (page - 1) * limit;
    return {
      plugins: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
    };
  });

  // GET /api/v1/plugins/:id
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const plugin = PLUGINS.find((p) => p.id === id);
    if (!plugin) return reply.status(404).send({ error: "Plugin not found" });
    return plugin;
  });
}
