import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { yjsManager } from "../collab/YjsManager.js";

export async function collabRoutes(app: FastifyInstance) {
  // WebSocket endpoint: /api/v1/collab/:projectId
  app.get("/:projectId", { websocket: true }, (socket: WebSocket, request) => {
    const { projectId } = request.params as { projectId: string };

    if (!projectId || !/^[a-zA-Z0-9_-]{1,64}$/.test(projectId)) {
      socket.close(1008, "Invalid project ID");
      return;
    }

    const accepted = yjsManager.addClient(projectId, socket);
    if (!accepted) {
      socket.close(1013, "Room is full (max 20 collaborators)");
      return;
    }

    app.log.info({ projectId }, "Collaborator joined");
  });

  // REST: get room info
  app.get("/:projectId/info", async (request) => {
    const { projectId } = request.params as { projectId: string };
    const info = yjsManager.getRoomInfo(projectId);
    if (!info) return { projectId, collaborators: 0 };
    return info;
  });
}
