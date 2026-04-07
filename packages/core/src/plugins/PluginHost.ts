import type { Layer, PluginManifest, PluginPermission } from "../types/index.js";

export interface PluginAPI {
  canvas: {
    getLayers(): Promise<Layer[]>;
    insertLayer(layer: Layer): Promise<string>;
    getPixels(layerId: string, rect: DOMRect): Promise<ImageData>;
    putPixels(layerId: string, imageData: ImageData, rect: DOMRect): Promise<void>;
  };
  ui: {
    showPanel(html: string): void;
  };
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
  };
}

type PluginMessage =
  | { type: "api-call"; method: string; args: unknown[]; callId: string }
  | { type: "api-result"; callId: string; result: unknown }
  | { type: "api-error"; callId: string; error: string };

/**
 * PluginHost — loads plugin bundles into a Web Worker sandbox.
 * Uses postMessage (Comlink-style async proxy) for all API calls.
 * Permissions gate which API methods the plugin can invoke.
 */
export class PluginHost {
  private worker: Worker | null = null;
  private manifest: PluginManifest;
  private pendingCalls = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private api: PluginAPI;

  constructor(manifest: PluginManifest, api: PluginAPI) {
    this.manifest = manifest;
    this.api = api;
  }

  async load(pluginBundle: string): Promise<void> {
    const blob = new Blob(
      [
        `
// CanvasOS Plugin Sandbox
const __permissions = ${JSON.stringify(this.manifest.permissions)};
function hasPermission(p) { return __permissions.includes(p); }

self.canvasOS = new Proxy({}, {
  get(_, ns) {
    return new Proxy({}, {
      get(_, method) {
        return (...args) => new Promise((resolve, reject) => {
          const callId = Math.random().toString(36).slice(2);
          self.postMessage({ type: 'api-call', method: ns + '.' + method, args, callId });
          self.__pending = self.__pending || {};
          self.__pending[callId] = { resolve, reject };
        });
      }
    });
  }
});

self.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === 'api-result' && self.__pending?.[msg.callId]) {
    self.__pending[msg.callId].resolve(msg.result);
    delete self.__pending[msg.callId];
  } else if (msg.type === 'api-error' && self.__pending?.[msg.callId]) {
    self.__pending[msg.callId].reject(new Error(msg.error));
    delete self.__pending[msg.callId];
  }
};

// Plugin code:
${pluginBundle}
      `,
      ],
      { type: "application/javascript" },
    );

    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url, { type: "classic" });
    this.worker.onmessage = this.handleMessage;
    URL.revokeObjectURL(url);
  }

  private handleMessage = async (e: MessageEvent<PluginMessage>) => {
    const msg = e.data;
    if (msg.type !== "api-call") return;

    const { method, args, callId } = msg;
    const [ns, fn] = method.split(".");

    try {
      this.checkPermission(ns as string, fn as string);
      const result = await this.invokeAPI(ns as string, fn as string, args);
      this.worker?.postMessage({ type: "api-result", callId, result });
    } catch (err) {
      this.worker?.postMessage({
        type: "api-error",
        callId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  private checkPermission(ns: string, _fn: string): void {
    const permMap: Record<string, PluginPermission> = {
      canvas: "canvas.read",
      ui: "ui.panel",
      storage: "storage.read",
    };
    const required = permMap[ns];
    if (required && !this.manifest.permissions.includes(required)) {
      throw new Error(`Plugin does not have permission: ${required}`);
    }
  }

  private async invokeAPI(ns: string, fn: string, args: unknown[]): Promise<unknown> {
    const apiNs = this.api[ns as keyof PluginAPI];
    if (!apiNs || typeof (apiNs as Record<string, unknown>)[fn] !== "function") {
      throw new Error(`Unknown API method: ${ns}.${fn}`);
    }
    return (apiNs as Record<string, (...a: unknown[]) => Promise<unknown>>)[fn]!(...args);
  }

  unload(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pendingCalls.clear();
  }
}
