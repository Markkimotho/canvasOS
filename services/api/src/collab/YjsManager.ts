import * as Y from "yjs";
import type { WebSocket } from "ws";
import { projectsPool } from "../routes/projects.js";

interface Room {
  doc: Y.Doc;
  clients: Set<WebSocket>;
  projectId: string;
  lastPersist: number;
}

/**
 * YjsManager — manages Yjs document rooms keyed by project ID.
 * Max 20 collaborators per room.
 * Persists Y.Doc snapshot to PostgreSQL every 30 seconds.
 */
export class YjsManager {
  private rooms: Map<string, Room> = new Map();
  private persistFn: ((projectId: string, update: Uint8Array) => Promise<void>) | null = null;
  private persistInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Persist snapshots every 30 seconds
    this.persistInterval = setInterval(() => this.persistAll(), 30_000);
  }

  onPersist(fn: (projectId: string, update: Uint8Array) => Promise<void>): void {
    this.persistFn = fn;
  }

  getOrCreateRoom(projectId: string, initialState?: Uint8Array): Room {
    let room = this.rooms.get(projectId);
    if (!room) {
      const doc = new Y.Doc();
      if (initialState) Y.applyUpdate(doc, initialState);
      room = { doc, clients: new Set(), projectId, lastPersist: Date.now() };
      this.rooms.set(projectId, room);
    }
    return room;
  }

  addClient(projectId: string, ws: WebSocket): boolean {
    const room = this.getOrCreateRoom(projectId);
    if (room.clients.size >= 20) return false;

    room.clients.add(ws);

    // Send current doc state to new client
    const state = Y.encodeStateAsUpdate(room.doc);
    this.send(ws, { type: "sync", update: Array.from(state) });

    // Handle incoming messages
    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as { type: string; update?: number[] };
        if (msg.type === "update" && msg.update) {
          const update = new Uint8Array(msg.update);
          Y.applyUpdate(room!.doc, update);
          // Broadcast to other clients
          for (const client of room!.clients) {
            if (client !== ws && client.readyState === 1) {
              this.send(client, { type: "update", update: msg.update });
            }
          }
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      room!.clients.delete(ws);
      if (room!.clients.size === 0) {
        // Room is empty; persist and clean up after 5 minutes
        setTimeout(
          () => {
            if (room!.clients.size === 0) {
              this.persistRoom(room!);
              this.rooms.delete(projectId);
            }
          },
          5 * 60 * 1000,
        );
      }
    });

    return true;
  }

  private send(ws: WebSocket, msg: unknown): void {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(msg));
    }
  }

  private async persistRoom(room: Room): Promise<void> {
    const update = Y.encodeStateAsUpdate(room.doc);
    await this.persistToDatabase(room.projectId, update).catch(console.error);
    if (this.persistFn) {
      await this.persistFn(room.projectId, update).catch(console.error);
    }
    room.lastPersist = Date.now();
  }

  private async persistAll(): Promise<void> {
    for (const room of this.rooms.values()) {
      await this.persistRoom(room);
    }
  }

  private async persistToDatabase(projectId: string, update: Uint8Array): Promise<void> {
    await projectsPool.query(
      `UPDATE projects SET yjs_state = $1, updated_at = NOW() WHERE id = $2`,
      [Buffer.from(update), projectId],
    );
  }

  getRoomInfo(projectId: string) {
    const room = this.rooms.get(projectId);
    if (!room) return null;
    return {
      projectId,
      collaborators: room.clients.size,
      lastPersist: room.lastPersist,
    };
  }

  destroy(): void {
    clearInterval(this.persistInterval);
    for (const room of this.rooms.values()) {
      room.doc.destroy();
    }
    this.rooms.clear();
  }
}

export const yjsManager = new YjsManager();
