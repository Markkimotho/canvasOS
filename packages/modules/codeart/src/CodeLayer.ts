/**
 * CodeLayer holds the user's code (JS or GLSL), the rendered output ImageData,
 * and orchestrates hot-reload with a 300 ms debounce.
 */

export type CodeLanguage = "js" | "glsl";

export type CodeChangeListener = (code: string, language: CodeLanguage) => void;

export class CodeLayer {
  private code = "";
  private language: CodeLanguage = "glsl";
  private output: ImageData | null = null;
  private changeListeners: Set<CodeChangeListener> = new Set();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;

  constructor(debounceMs = 300) {
    this.debounceMs = debounceMs;
  }

  /**
   * Update the stored code and language. Fires registered change listeners
   * after a 300 ms debounce to support hot-reload.
   */
  setCode(code: string, language: CodeLanguage): void {
    this.code = code;
    this.language = language;

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      for (const listener of this.changeListeners) {
        listener(this.code, this.language);
      }
    }, this.debounceMs);
  }

  getCode(): string {
    return this.code;
  }

  getLanguage(): CodeLanguage {
    return this.language;
  }

  /**
   * Store the latest rendered output. Called by the renderer (GLSLRenderer or
   * JSSketchRunner) after it produces a new frame.
   */
  setOutput(imageData: ImageData): void {
    this.output = imageData;
  }

  getOutput(): ImageData | null {
    return this.output;
  }

  /**
   * Register a listener that is called with (code, language) whenever the
   * debounced code change fires. Returns an unsubscribe function.
   */
  onCodeChange(listener: CodeChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /** Cancel any pending debounced fire and clear listeners. */
  dispose(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.changeListeners.clear();
  }
}
