import { useState, useCallback, useEffect, useRef } from "react";
import type { KeyframeData, AnimatableProperty } from "@canvasos/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FpsOption = 12 | 24 | 30 | 60;

export interface LayerTrack {
  layerId: string;
  layerName: string;
  property: AnimatableProperty;
  keyframes: KeyframeData[];
}

interface AnimatePanelProps {
  /** Total duration in frames */
  duration?: number;
  /** Initial FPS */
  fps?: FpsOption;
  /** Layer tracks to render in the timeline */
  tracks?: LayerTrack[];
  /** Current playhead frame (controlled) */
  currentFrame?: number;
  onFrameChange?: (frame: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onFpsChange?: (fps: FpsOption) => void;
  onExport?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRACK_HEIGHT = 28;
const HEADER_WIDTH = 100;
const PIXELS_PER_FRAME = 8;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function IconButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: "4px",
        border: "1px solid #444",
        background: active ? "rgba(99,102,241,0.3)" : "transparent",
        color: "#ccc",
        cursor: "pointer",
        fontSize: "13px",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Timeline ruler
// ---------------------------------------------------------------------------

function TimelineRuler({
  duration,
  fps,
  scrollLeft: _scrollLeft,
}: {
  duration: number;
  fps: number;
  scrollLeft: number; // used for future scroll sync
}) {
  const marks: number[] = [];
  const interval = fps >= 30 ? fps : fps; // mark every second
  for (let f = 0; f <= duration; f += interval) {
    marks.push(f);
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        height: "20px",
        marginLeft: `${HEADER_WIDTH}px`,
        overflow: "hidden",
        borderBottom: "1px solid #333",
      }}
    >
      <div style={{ position: "relative", width: `${duration * PIXELS_PER_FRAME}px` }}>
        {marks.map((f) => (
          <span
            key={f}
            style={{
              position: "absolute",
              left: `${f * PIXELS_PER_FRAME}px`,
              fontSize: "9px",
              color: "#555",
              userSelect: "none",
              transform: "translateX(-50%)",
            }}
          >
            {Math.round(f / fps)}s
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyframe diamond
// ---------------------------------------------------------------------------

function KeyframeDiamond({ x }: { x: number }) {
  return (
    <div
      aria-label="Keyframe"
      style={{
        position: "absolute",
        left: `${x - 5}px`,
        top: "50%",
        transform: "translateY(-50%) rotate(45deg)",
        width: "9px",
        height: "9px",
        background: "#a5b4fc",
        border: "1px solid #6366f1",
        cursor: "pointer",
        zIndex: 1,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Track row
// ---------------------------------------------------------------------------

function TrackRow({ track, duration }: { track: LayerTrack; duration: number }) {
  return (
    <div
      role="row"
      aria-label={`Track: ${track.layerName} ${track.property}`}
      style={{
        display: "flex",
        height: `${TRACK_HEIGHT}px`,
        borderBottom: "1px solid #2a2a2a",
      }}
    >
      {/* Layer label */}
      <div
        role="rowheader"
        style={{
          width: `${HEADER_WIDTH}px`,
          flexShrink: 0,
          fontSize: "10px",
          color: "#888",
          padding: "0 8px",
          display: "flex",
          alignItems: "center",
          borderRight: "1px solid #333",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={`${track.layerName} / ${track.property}`}
      >
        {track.layerName}
        <span style={{ color: "#555", marginLeft: "4px" }}>{track.property}</span>
      </div>

      {/* Keyframe area */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${duration * PIXELS_PER_FRAME}px`,
            height: "100%",
          }}
        >
          {track.keyframes.map((kf) => (
            <KeyframeDiamond key={kf.time} x={kf.time * PIXELS_PER_FRAME} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AnimatePanel({
  duration = 120,
  fps: fpsProp = 24,
  tracks = [],
  currentFrame = 0,
  onFrameChange,
  onPlay,
  onPause,
  onStop,
  onFpsChange,
  onExport,
}: AnimatePanelProps) {
  const [fps, setFps] = useState<FpsOption>(fpsProp);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if focus is on an input element
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) {
          setIsPlaying(false);
          onPause?.();
        } else {
          setIsPlaying(true);
          onPlay?.();
        }
      }

      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setIsPlaying(false);
        onStop?.();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, onPlay, onPause, onStop]);

  // -------------------------------------------------------------------------
  // Transport
  // -------------------------------------------------------------------------

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    onStop?.();
    onFrameChange?.(0);
  }, [onStop, onFrameChange]);

  // -------------------------------------------------------------------------
  // FPS selector
  // -------------------------------------------------------------------------

  const handleFpsChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value) as FpsOption;
      setFps(value);
      onFpsChange?.(value);
    },
    [onFpsChange],
  );

  // -------------------------------------------------------------------------
  // Playhead drag
  // -------------------------------------------------------------------------

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - HEADER_WIDTH + scrollLeft;
      const frame = Math.max(0, Math.min(duration, Math.round(x / PIXELS_PER_FRAME)));
      onFrameChange?.(frame);
    },
    [duration, scrollLeft, onFrameChange],
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft((e.currentTarget as HTMLDivElement).scrollLeft);
  }, []);

  // -------------------------------------------------------------------------
  // Playhead pixel position
  // -------------------------------------------------------------------------
  const playheadX = HEADER_WIDTH + currentFrame * PIXELS_PER_FRAME - scrollLeft;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      role="region"
      aria-label="Animation timeline panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#1a1a1a",
        color: "#ccc",
        userSelect: "none",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Transport bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        aria-label="Playback controls"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 8px",
          borderBottom: "1px solid #333",
          flexShrink: 0,
        }}
      >
        {isPlaying ? (
          <IconButton label="Pause (Space)" onClick={handlePause}>
            ⏸
          </IconButton>
        ) : (
          <IconButton label="Play (Space)" onClick={handlePlay}>
            ▶
          </IconButton>
        )}

        <IconButton label="Stop (K)" onClick={handleStop}>
          ■
        </IconButton>

        <span style={{ fontSize: "11px", color: "#888", marginLeft: "8px" }}>
          Frame <strong style={{ color: "#ccc" }}>{currentFrame}</strong>
          {" / "}
          {duration}
        </span>

        <div style={{ flex: 1 }} />

        {/* FPS selector */}
        <label htmlFor="fps-select" style={{ fontSize: "11px", color: "#888" }}>
          FPS
        </label>
        <select
          id="fps-select"
          aria-label="Frames per second"
          value={fps}
          onChange={handleFpsChange}
          style={{
            background: "#2a2a2a",
            color: "#ccc",
            border: "1px solid #444",
            borderRadius: "4px",
            padding: "2px 4px",
            fontSize: "11px",
          }}
        >
          {([12, 24, 30, 60] as FpsOption[]).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {/* Export button */}
        <button
          aria-label="Export animation"
          onClick={() => onExport?.()}
          style={{
            padding: "4px 10px",
            borderRadius: "4px",
            border: "1px solid #444",
            background: "transparent",
            color: "#ccc",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          Export
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Timeline                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={timelineRef}
        role="grid"
        aria-label="Keyframe timeline"
        style={{ flex: 1, overflowX: "auto", overflowY: "auto", position: "relative" }}
        onScroll={handleScroll}
        onClick={handleTimelineClick}
      >
        {/* Ruler */}
        <TimelineRuler duration={duration} fps={fps} scrollLeft={scrollLeft} />

        {/* Tracks */}
        {tracks.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#555",
              fontSize: "12px",
            }}
          >
            No animated layers
          </div>
        ) : (
          tracks.map((track) => (
            <TrackRow
              key={`${track.layerId}:${track.property}`}
              track={track}
              duration={duration}
            />
          ))
        )}

        {/* Playhead */}
        {playheadX >= HEADER_WIDTH && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: `${playheadX}px`,
              width: "1px",
              height: "100%",
              background: "#ef4444",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
}
