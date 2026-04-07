export interface CompileResult {
  success: boolean;
  error?: string;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Minimal passthrough shader shown when no user shader is compiled
const FALLBACK_FRAGMENT_SRC = `
precision mediump float;
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

export class GLSLRenderer {
  private canvas: OffscreenCanvas;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private posBuffer: WebGLBuffer;
  private width: number;
  private height: number;

  constructor(width = 512, height = 512) {
    this.width = width;
    this.height = height;
    this.canvas = new OffscreenCanvas(width, height);

    const gl = this.canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL is not available in this environment");
    this.gl = gl;

    // Create and upload the fullscreen quad once
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    if (!buf) throw new Error("Failed to create position buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    this.posBuffer = buf;

    // Compile fallback so render() always works before user calls compile()
    this.compileInternal(FALLBACK_FRAGMENT_SRC);
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private getShaderError(type: number, source: string): string | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) return "Failed to create shader object";
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? "Unknown compile error";
      gl.deleteShader(shader);
      return log;
    }
    gl.deleteShader(shader);
    return null;
  }

  private compileInternal(fragmentSrc: string): boolean {
    const gl = this.gl;

    const vert = this.createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = this.createShader(gl.FRAGMENT_SHADER, fragmentSrc);

    if (!vert || !frag) {
      if (vert) gl.deleteShader(vert);
      if (frag) gl.deleteShader(frag);
      return false;
    }

    const prog = gl.createProgram();
    if (!prog) return false;

    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      return false;
    }

    // Replace old program
    if (this.program) gl.deleteProgram(this.program);
    this.program = prog;

    gl.deleteShader(vert);
    gl.deleteShader(frag);
    return true;
  }

  /**
   * Attempt to compile a new fragment shader.
   * The vertex shader provides a fullscreen quad; the fragment shader receives:
   *   uniform float u_time
   *   uniform vec2  u_resolution
   *   uniform vec2  u_mouse
   *   uniform sampler2D u_texture
   */
  compile(fragmentSrc: string): CompileResult {
    // Validate fragment shader first so we can return a useful error message
    const fragErr = this.getShaderError(this.gl.FRAGMENT_SHADER, fragmentSrc);
    if (fragErr) {
      return { success: false, error: fragErr };
    }

    const ok = this.compileInternal(fragmentSrc);
    if (!ok) {
      return { success: false, error: "Program link failed" };
    }

    return { success: true };
  }

  /**
   * Render one frame and return the resulting ImageData.
   */
  render(time: number, mouseX: number, mouseY: number, inputTexture?: ImageData): ImageData {
    const gl = this.gl;
    const prog = this.program;
    if (!prog) throw new Error("No compiled program available");

    gl.useProgram(prog);
    gl.viewport(0, 0, this.width, this.height);

    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    const setF = (name: string, v: number) => {
      const loc = gl.getUniformLocation(prog, name);
      if (loc !== null) gl.uniform1f(loc, v);
    };
    const setV2 = (name: string, x: number, y: number) => {
      const loc = gl.getUniformLocation(prog, name);
      if (loc !== null) gl.uniform2f(loc, x, y);
    };

    setF("u_time", time);
    setV2("u_resolution", this.width, this.height);
    setV2("u_mouse", mouseX, mouseY);

    // Upload optional input texture
    if (inputTexture) {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inputTexture);
      const texLoc = gl.getUniformLocation(prog, "u_texture");
      if (texLoc !== null) gl.uniform1i(texLoc, 0);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read back pixels (WebGL origin is bottom-left; flip to image convention)
    const raw = new Uint8ClampedArray(this.width * this.height * 4);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, raw);

    const flipped = new Uint8ClampedArray(this.width * this.height * 4);
    for (let row = 0; row < this.height; row++) {
      const src = (this.height - 1 - row) * this.width * 4;
      const dst = row * this.width * 4;
      flipped.set(raw.subarray(src, src + this.width * 4), dst);
    }

    return new ImageData(flipped, this.width, this.height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas = new OffscreenCanvas(width, height);
    const gl = this.canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL not available");
    this.gl = gl;
    this.program = null;

    // Re-upload position buffer
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    if (!buf) throw new Error("Failed to create position buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    this.posBuffer = buf;

    this.compileInternal(FALLBACK_FRAGMENT_SRC);
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
