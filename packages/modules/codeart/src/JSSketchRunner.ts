/**
 * JSSketchRunner
 *
 * Runs user-supplied JavaScript sketches (with optional p5.js) inside a
 * sandboxed <iframe> using postMessage for communication. The iframe exposes
 * a `canvasOS` global with { width, height, frame, captureFrame() }.
 *
 * Execution is debounced 300 ms after the most recent run() call so that rapid
 * code edits don't hammer the renderer.
 */

const P5_CDN = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.3/p5.min.js";

function buildIframeHTML(width: number, height: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; width: ${width}px; height: ${height}px; }
    canvas { display: block; }
  </style>
  <script src="${P5_CDN}"><\/script>
</head>
<body>
<script>
(function() {
  var _frameCount = 0;
  var _running = false;
  var _animId = null;
  var _userSetup = null;
  var _userDraw = null;
  var _canvas = null;
  var _ctx = null;

  var canvasOS = {
    width: ${width},
    height: ${height},
    get frame() { return _frameCount; },
    captureFrame: function() {
      if (!_canvas) return null;
      return _canvas.toDataURL('image/png');
    }
  };

  window.canvasOS = canvasOS;

  function getMainCanvas() {
    // For p5.js, the canvas is created dynamically
    return document.querySelector('canvas') || _canvas;
  }

  function sendFrame() {
    var c = getMainCanvas();
    if (!c) return;
    var dataUrl = c.toDataURL('image/png');
    window.parent.postMessage({ type: 'frame', dataUrl: dataUrl, frame: _frameCount }, '*');
    _frameCount++;
  }

  function loop() {
    if (!_running) return;
    if (typeof _userDraw === 'function') {
      try { _userDraw(); } catch(e) {
        window.parent.postMessage({ type: 'error', message: String(e) }, '*');
        _running = false;
        return;
      }
    }
    sendFrame();
    _animId = requestAnimationFrame(loop);
  }

  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || msg.type !== 'run') return;

    // Stop previous run
    _running = false;
    if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
    _frameCount = 0;

    // Remove any p5 instance or old canvas
    var existing = document.querySelector('canvas');
    if (existing) existing.remove();

    // Create a plain canvas
    _canvas = document.createElement('canvas');
    _canvas.width = ${width};
    _canvas.height = ${height};
    document.body.appendChild(_canvas);
    _ctx = _canvas.getContext('2d');

    // Expose conveniences
    window.canvas = _canvas;
    window.ctx = _ctx;
    window.width = ${width};
    window.height = ${height};

    var userCode = msg.code;

    try {
      // If the code references setup/draw, treat it as p5.js-style
      var isP5 = /\\bfunction\\s+setup\\s*\\(/.test(userCode) ||
                 /\\bfunction\\s+draw\\s*\\(/.test(userCode);

      if (isP5) {
        // Let p5 manage the canvas
        _canvas.remove();
        _canvas = null;
        _ctx = null;
        new Function('canvasOS', userCode)(canvasOS);
        // p5 creates its own canvas; start sending frames
        _running = true;
        requestAnimationFrame(function waitForCanvas() {
          var c = document.querySelector('canvas');
          if (c) {
            _running = true;
            loop();
          } else {
            requestAnimationFrame(waitForCanvas);
          }
        });
      } else {
        // Plain JS: run once as setup, then loop draw if draw() is defined
        var fn = new Function(
          'canvas', 'ctx', 'width', 'height', 'canvasOS',
          userCode + '\\n' +
          'if (typeof setup === "function") setup();\\n' +
          'if (typeof draw === "function") { _userDraw = draw; }\\n' +
          'return { draw: typeof draw === "function" ? draw : null };'
        );
        var result = fn(_canvas, _ctx, ${width}, ${height}, canvasOS);
        _userDraw = result && result.draw ? result.draw : null;
        _running = true;
        if (_userDraw) {
          loop();
        } else {
          sendFrame();
        }
      }
    } catch(e) {
      window.parent.postMessage({ type: 'error', message: String(e) }, '*');
    }
  });

  window.parent.postMessage({ type: 'ready' }, '*');
})();
<\/script>
</body>
</html>`;
}

type FrameCallback = (imageData: ImageData) => void;

export class JSSketchRunner {
  private iframe: HTMLIFrameElement | null = null;
  private frameCallbacks: Set<FrameCallback> = new Set();
  private pendingCode: string | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private ready = false;
  private width: number;
  private height: number;
  private messageHandler: ((e: MessageEvent) => void) | null = null;

  constructor(width = 512, height = 512) {
    this.width = width;
    this.height = height;
  }

  /** Attach the runner to the DOM (call before run()). */
  mount(container: HTMLElement): void {
    if (this.iframe) this.destroy();

    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.cssText =
      `width:${this.width}px;height:${this.height}px;border:none;` +
      "position:absolute;left:-9999px;top:-9999px;";
    container.appendChild(iframe);
    this.iframe = iframe;

    this.messageHandler = (e: MessageEvent) => this.handleMessage(e);
    window.addEventListener("message", this.messageHandler);

    iframe.srcdoc = buildIframeHTML(this.width, this.height);
  }

  private handleMessage(e: MessageEvent): void {
    const msg = e.data as Record<string, unknown>;
    if (!msg || typeof msg !== "object") return;

    if (msg["type"] === "ready") {
      this.ready = true;
      if (this.pendingCode !== null) {
        this.dispatchCode(this.pendingCode);
        this.pendingCode = null;
      }
      return;
    }

    if (msg["type"] === "frame") {
      const dataUrl = msg["dataUrl"] as string | undefined;
      if (dataUrl) {
        void this.dataUrlToImageData(dataUrl).then((imageData) => {
          for (const cb of this.frameCallbacks) cb(imageData);
        });
      }
      return;
    }

    if (msg["type"] === "error") {
      console.error("[JSSketchRunner] Sketch error:", msg["message"]);
    }
  }

  private dispatchCode(code: string): void {
    this.iframe?.contentWindow?.postMessage({ type: "run", code }, "*");
  }

  /**
   * Run the provided code. If called within 300 ms of a previous call,
   * the previous call is cancelled (debounce).
   */
  run(code: string): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.ready) {
        this.dispatchCode(code);
      } else {
        this.pendingCode = code;
      }
    }, 300);
  }

  /** Stop the running sketch. */
  stop(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    // Send an empty no-op to stop the animation loop
    if (this.ready) {
      this.iframe?.contentWindow?.postMessage({ type: "run", code: "// stopped" }, "*");
    }
  }

  /** Register a callback to receive each rendered frame as ImageData. */
  onFrame(callback: FrameCallback): () => void {
    this.frameCallbacks.add(callback);
    return () => this.frameCallbacks.delete(callback);
  }

  /** Clean up the iframe and event listener. */
  destroy(): void {
    this.stop();
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    this.iframe?.remove();
    this.iframe = null;
    this.ready = false;
    this.frameCallbacks.clear();
  }

  private async dataUrlToImageData(dataUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Cannot get 2D context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.onerror = () => reject(new Error("Failed to load frame image"));
      img.src = dataUrl;
    });
  }
}
