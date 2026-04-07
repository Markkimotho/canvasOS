import React, { Component, useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { CodeLayer } from "../CodeLayer.js";
import type { CodeLanguage } from "../CodeLayer.js";
import { GLSLRenderer } from "../GLSLRenderer.js";
import type { CompileResult } from "../GLSLRenderer.js";
import { JSSketchRunner } from "../JSSketchRunner.js";

// ---------------------------------------------------------------------------
// Error boundary for Monaco
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class MonacoErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex items-center justify-center h-full bg-zinc-900 text-red-400 p-4 text-sm"
        >
          <p>
            <strong>Editor failed to load:</strong> {this.state.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Default starter code
// ---------------------------------------------------------------------------

const DEFAULT_GLSL = `precision mediump float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_mouse;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

const DEFAULT_JS = `// canvasOS sketch
// Available: canvas, ctx, width, height, canvasOS.frame

ctx.fillStyle = '#111';
ctx.fillRect(0, 0, width, height);

function draw() {
  ctx.fillStyle = 'rgba(17,17,17,0.1)';
  ctx.fillRect(0, 0, width, height);

  const t = canvasOS.frame * 0.02;
  const cx = width / 2 + Math.cos(t) * 100;
  const cy = height / 2 + Math.sin(t * 0.7) * 100;

  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = \`hsl(\${(t * 30) % 360}, 80%, 60%)\`;
  ctx.fill();
}
`;

// ---------------------------------------------------------------------------
// Status bar component
// ---------------------------------------------------------------------------

interface StatusBarProps {
  language: CodeLanguage;
  compileResult: CompileResult | null;
  running: boolean;
}

function StatusBar({ language, compileResult, running }: StatusBarProps) {
  const langLabel = language === "glsl" ? "GLSL" : "JavaScript";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Code execution status bar"
      className="flex items-center gap-3 px-3 py-1 bg-zinc-950 border-t border-zinc-800 text-xs select-none"
    >
      <span className="text-zinc-500">{langLabel}</span>
      <span className="text-zinc-700">|</span>
      {compileResult === null ? (
        <span className="text-zinc-500">No output yet</span>
      ) : compileResult.success ? (
        <span aria-label="Sketch is running successfully" className="text-green-400 font-medium">
          {running ? "Running" : "Ready"}
        </span>
      ) : (
        <span
          aria-label={`Compile error: ${compileResult.error ?? "unknown error"}`}
          className="text-red-400 font-medium truncate max-w-xs"
          title={compileResult.error}
        >
          {compileResult.error ?? "Compile error"}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CodeArtPanel component
// ---------------------------------------------------------------------------

export interface CodeArtPanelProps {
  width?: number;
  height?: number;
  onOutputChange?: (imageData: ImageData) => void;
}

export function CodeArtPanel({ width = 512, height = 512, onOutputChange }: CodeArtPanelProps) {
  const [language, setLanguage] = useState<CodeLanguage>("glsl");
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [running, setRunning] = useState(false);

  const codeLayer = useRef<CodeLayer>(new CodeLayer(300));
  const glslRenderer = useRef<GLSLRenderer | null>(null);
  const jsRunner = useRef<JSSketchRunner | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const jsUnsubRef = useRef<(() => void) | null>(null);

  // Initialise GLSL renderer once
  useEffect(() => {
    glslRenderer.current = new GLSLRenderer(width, height);
  }, [width, height]);

  // Mount JS runner iframe
  useEffect(() => {
    if (iframeContainerRef.current && !jsRunner.current) {
      const runner = new JSSketchRunner(width, height);
      runner.mount(iframeContainerRef.current);
      jsRunner.current = runner;
    }
    return () => {
      jsRunner.current?.destroy();
      jsRunner.current = null;
    };
  }, [width, height]);

  // GLSL animation loop
  const startGLSLLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;

    const tick = () => {
      const renderer = glslRenderer.current;
      if (!renderer) return;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      try {
        const imageData = renderer.render(elapsed, mouseRef.current.x, mouseRef.current.y);
        onOutputChange?.(imageData);
        codeLayer.current.setOutput(imageData);
      } catch {
        // Ignore render errors
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    setRunning(true);
  }, [onOutputChange]);

  const stopGLSLLoop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setRunning(false);
  }, []);

  // Handle code changes from CodeLayer (debounced)
  useEffect(() => {
    unsubscribeRef.current?.();

    const unsub = codeLayer.current.onCodeChange((code, lang) => {
      if (lang === "glsl") {
        stopGLSLLoop();
        const renderer = glslRenderer.current;
        if (!renderer) return;
        const result = renderer.compile(code);
        setCompileResult(result);
        if (result.success) {
          startTimeRef.current = performance.now();
          startGLSLLoop();
        }
      } else {
        // JS: hand off to JSSketchRunner
        stopGLSLLoop();
        setCompileResult({ success: true });
        setRunning(true);
        jsRunner.current?.run(code);
      }
    });

    unsubscribeRef.current = unsub;
    return () => unsub();
  }, [startGLSLLoop, stopGLSLLoop]);

  // Subscribe to JS frame output
  useEffect(() => {
    jsUnsubRef.current?.();

    const unsub = jsRunner.current?.onFrame((imageData) => {
      onOutputChange?.(imageData);
      codeLayer.current.setOutput(imageData);
    });

    jsUnsubRef.current = unsub ?? null;
    return () => jsUnsubRef.current?.();
  }, [onOutputChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGLSLLoop();
      codeLayer.current.dispose();
    };
  }, [stopGLSLLoop]);

  // When language tab changes, reset to starter code
  const handleLanguageChange = useCallback(
    (lang: CodeLanguage) => {
      setLanguage(lang);
      stopGLSLLoop();
      jsRunner.current?.stop();
      setCompileResult(null);
      setRunning(false);
      const defaultCode = lang === "glsl" ? DEFAULT_GLSL : DEFAULT_JS;
      codeLayer.current.setCode(defaultCode, lang);
    },
    [stopGLSLLoop],
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      codeLayer.current.setCode(value ?? "", language);
    },
    [language],
  );

  const monacoLanguage = language === "glsl" ? "glsl" : "javascript";

  return (
    <div
      aria-label="Code art editor panel"
      className="flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden"
    >
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Code language and controls toolbar"
        className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800 shrink-0"
      >
        <span className="text-xs text-zinc-500 font-medium mr-1">Language</span>
        {(["glsl", "js"] as CodeLanguage[]).map((lang) => (
          <button
            key={lang}
            aria-label={`Switch to ${lang === "glsl" ? "GLSL shader" : "JavaScript sketch"} mode`}
            aria-pressed={language === lang}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              language === lang
                ? "bg-sky-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
            onClick={() => handleLanguageChange(lang)}
          >
            {lang === "glsl" ? "GLSL" : "JS"}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0" role="main" aria-label="Code editor">
        <MonacoErrorBoundary>
          <Editor
            height="100%"
            language={monacoLanguage}
            defaultValue={language === "glsl" ? DEFAULT_GLSL : DEFAULT_JS}
            theme="vs-dark"
            aria-label={`${language === "glsl" ? "GLSL" : "JavaScript"} code editor`}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 8, bottom: 8 },
            }}
            onChange={handleEditorChange}
          />
        </MonacoErrorBoundary>
      </div>

      {/* Status bar */}
      <StatusBar language={language} compileResult={compileResult} running={running} />

      {/* Hidden iframe container for JS runner */}
      <div
        ref={iframeContainerRef}
        aria-hidden="true"
        style={{ position: "absolute", pointerEvents: "none", opacity: 0 }}
      />
    </div>
  );
}
