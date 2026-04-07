export interface PhotoAdjustmentParams {
  exposure: number; // -5 to 5, default 0
  contrast: number; // -100 to 100, default 0
  highlights: number; // -100 to 100, default 0
  shadows: number; // -100 to 100, default 0
  whites: number; // -100 to 100, default 0
  blacks: number; // -100 to 100, default 0
  clarity: number; // -100 to 100, default 0
  vibrance: number; // -100 to 100, default 0
  saturation: number; // -100 to 100, default 0
  temperature: number; // -100 to 100, default 0
  tint: number; // -100 to 100, default 0
}

const DEFAULT_PARAMS: PhotoAdjustmentParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  clarity: 0,
  vibrance: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
};

const FRAGMENT_SHADER_SRC = `
precision highp float;

uniform sampler2D u_image;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_whites;
uniform float u_blacks;
uniform float u_clarity;
uniform float u_vibrance;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_tint;

varying vec2 v_texCoord;

// Convert linear to sRGB
float linearToSRGB(float c) {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}

// Convert sRGB to linear
float sRGBToLinear(float c) {
  if (c <= 0.04045) return c / 12.92;
  return pow((c + 0.055) / 1.055, 2.4);
}

vec3 sRGBToLinearVec(vec3 c) {
  return vec3(sRGBToLinear(c.r), sRGBToLinear(c.g), sRGBToLinear(c.b));
}

vec3 linearToSRGBVec(vec3 c) {
  return vec3(linearToSRGB(c.r), linearToSRGB(c.g), linearToSRGB(c.b));
}

// RGB to HSL
vec3 rgbToHSL(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float delta = maxC - minC;
  float l = (maxC + minC) * 0.5;
  float s = 0.0;
  float h = 0.0;

  if (delta > 0.0001) {
    s = delta / (1.0 - abs(2.0 * l - 1.0));
    if (maxC == c.r) {
      h = mod((c.g - c.b) / delta, 6.0);
    } else if (maxC == c.g) {
      h = (c.b - c.r) / delta + 2.0;
    } else {
      h = (c.r - c.g) / delta + 4.0;
    }
    h /= 6.0;
    if (h < 0.0) h += 1.0;
  }

  return vec3(h, s, l);
}

float hueToRGB(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hslToRGB(vec3 hsl) {
  float h = hsl.x;
  float s = hsl.y;
  float l = hsl.z;

  if (s < 0.0001) {
    return vec3(l);
  }

  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;

  return vec3(
    hueToRGB(p, q, h + 1.0/3.0),
    hueToRGB(p, q, h),
    hueToRGB(p, q, h - 1.0/3.0)
  );
}

// Luminance
float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec4 texColor = texture2D(u_image, v_texCoord);
  vec3 color = texColor.rgb;

  // Convert to linear light
  color = sRGBToLinearVec(color);

  // Exposure: multiply by 2^exposure
  color *= pow(2.0, u_exposure);

  // Highlights / Shadows / Whites / Blacks
  float lum = luminance(color);

  // Highlights: affect bright areas
  float hlMask = smoothstep(0.5, 1.0, lum);
  color += color * hlMask * (u_highlights / 100.0) * 0.5;

  // Shadows: affect dark areas
  float shMask = 1.0 - smoothstep(0.0, 0.5, lum);
  color += color * shMask * (u_shadows / 100.0) * 0.5;

  // Whites: push near-white values
  float wMask = smoothstep(0.8, 1.0, lum);
  color += wMask * (u_whites / 100.0) * 0.3;

  // Blacks: pull near-black values
  float bMask = 1.0 - smoothstep(0.0, 0.2, lum);
  color += bMask * (u_blacks / 100.0) * 0.15;

  // Contrast: S-curve around midpoint 0.18 in linear light
  float contrast = u_contrast / 100.0;
  color = ((color - 0.18) * (1.0 + contrast)) + 0.18;

  // Convert back to sRGB for saturation / clarity / color temp operations
  color = linearToSRGBVec(max(color, vec3(0.0)));

  // Temperature: shift red/blue channels
  float temp = u_temperature / 100.0;
  color.r += temp * 0.1;
  color.b -= temp * 0.1;

  // Tint: shift green/magenta
  float tint = u_tint / 100.0;
  color.g += tint * 0.05;
  color.r -= tint * 0.025;
  color.b -= tint * 0.025;

  // Work in HSL for saturation, vibrance, clarity
  vec3 hsl = rgbToHSL(clamp(color, vec3(0.0), vec3(1.0)));

  // Saturation
  hsl.y = hsl.y * (1.0 + u_saturation / 100.0);
  hsl.y = clamp(hsl.y, 0.0, 1.0);

  // Vibrance: boost less-saturated colors more
  float vibranceFactor = (u_vibrance / 100.0) * (1.0 - hsl.y);
  hsl.y = hsl.y + vibranceFactor * 0.5;
  hsl.y = clamp(hsl.y, 0.0, 1.0);

  color = hslToRGB(hsl);

  // Clarity: local contrast enhancement via luminance shift
  // Approximate with a global mild S-curve on luminance
  float clarityVal = u_clarity / 100.0;
  float lumC = luminance(color);
  float clarityBoost = sin(lumC * 3.14159) * clarityVal * 0.15;
  color = color + vec3(clarityBoost);

  color = clamp(color, vec3(0.0), vec3(1.0));

  gl_FragColor = vec4(color, texColor.a);
}
`;

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export class PhotoLayer {
  private params: PhotoAdjustmentParams;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private canvas: OffscreenCanvas | null = null;

  constructor(initialParams?: Partial<PhotoAdjustmentParams>) {
    this.params = { ...DEFAULT_PARAMS, ...initialParams };
  }

  setParams(params: Partial<PhotoAdjustmentParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): PhotoAdjustmentParams {
    return { ...this.params };
  }

  private initWebGL(width: number, height: number): WebGLRenderingContext {
    if (this.canvas && this.gl && this.canvas.width === width && this.canvas.height === height) {
      return this.gl;
    }

    this.canvas = new OffscreenCanvas(width, height);
    const gl = this.canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL not available in this environment");

    this.gl = gl;
    this.program = this.createProgram(gl);
    return gl;
  }

  private createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Failed to create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info ?? "unknown"}`);
    }
    return shader;
  }

  private createProgram(gl: WebGLRenderingContext): WebGLProgram {
    const vert = this.createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = this.createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create WebGL program");
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error(`Program link error: ${info ?? "unknown"}`);
    }
    return program;
  }

  applyAdjustments(imageData: ImageData, params: PhotoAdjustmentParams): ImageData {
    const { width, height } = imageData;
    const gl = this.initWebGL(width, height);
    const program = this.program!;

    gl.useProgram(program);
    gl.viewport(0, 0, width, height);

    // Upload texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

    // Fullscreen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const aTex = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    const setUniform = (name: string, value: number) => {
      const loc = gl.getUniformLocation(program, name);
      if (loc !== null) gl.uniform1f(loc, value);
    };

    const imageLoc = gl.getUniformLocation(program, "u_image");
    if (imageLoc !== null) gl.uniform1i(imageLoc, 0);

    setUniform("u_exposure", params.exposure);
    setUniform("u_contrast", params.contrast);
    setUniform("u_highlights", params.highlights);
    setUniform("u_shadows", params.shadows);
    setUniform("u_whites", params.whites);
    setUniform("u_blacks", params.blacks);
    setUniform("u_clarity", params.clarity);
    setUniform("u_vibrance", params.vibrance);
    setUniform("u_saturation", params.saturation);
    setUniform("u_temperature", params.temperature);
    setUniform("u_tint", params.tint);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Read pixels
    const pixels = new Uint8ClampedArray(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // WebGL reads bottom-to-top; flip vertically
    const flipped = new Uint8ClampedArray(width * height * 4);
    for (let row = 0; row < height; row++) {
      const src = (height - 1 - row) * width * 4;
      const dst = row * width * 4;
      flipped.set(pixels.subarray(src, src + width * 4), dst);
    }

    // Clean up
    gl.deleteTexture(texture);
    gl.deleteBuffer(posBuffer);
    gl.deleteBuffer(texBuffer);

    return new ImageData(flipped, width, height);
  }

  async processImageData(input: ImageData): Promise<ImageData> {
    return this.applyAdjustments(input, this.params);
  }
}
