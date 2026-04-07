import type { TimelineState, AnimatableProperty, KeyframeData } from "@canvasos/core";
import { KeyframeEngine } from "./KeyframeEngine.js";

export type PlaybackCallback = (frame: number) => void;
export type PlaybackEndCallback = () => void;

/**
 * TimelineUI manages playback state and drives the KeyframeEngine.
 *
 * It is intentionally decoupled from React — the AnimatePanel component reads
 * from this class and subscribes via callbacks. This allows the same engine to
 * run in a Web Worker or headless test environment.
 */
export class TimelineUI {
  private state: TimelineState;
  private engine: KeyframeEngine;
  private rafHandle: number | null = null;
  private lastTimestamp: number | null = null;
  private frameAccumulator = 0;

  // Subscribers
  private onFrameCallbacks: PlaybackCallback[] = [];
  private onEndCallbacks: PlaybackEndCallback[] = [];

  constructor(initialState?: Partial<TimelineState>) {
    this.state = {
      fps: 24,
      duration: 120,
      currentFrame: 0,
      playing: false,
      looping: true,
      animations: [],
      ...initialState,
    };
    this.engine = new KeyframeEngine();

    // Load existing animations into engine
    for (const anim of this.state.animations) {
      for (const kf of anim.keyframes) {
        this.engine.setKeyframe(anim.layerId, anim.property, kf);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Subscriptions
  // -------------------------------------------------------------------------

  onFrame(cb: PlaybackCallback): () => void {
    this.onFrameCallbacks.push(cb);
    return () => {
      this.onFrameCallbacks = this.onFrameCallbacks.filter((f) => f !== cb);
    };
  }

  onEnd(cb: PlaybackEndCallback): () => void {
    this.onEndCallbacks.push(cb);
    return () => {
      this.onEndCallbacks = this.onEndCallbacks.filter((f) => f !== cb);
    };
  }

  // -------------------------------------------------------------------------
  // Playback
  // -------------------------------------------------------------------------

  play(): void {
    if (this.state.playing) return;
    this.state.playing = true;
    this.lastTimestamp = null;
    this.frameAccumulator = 0;
    this.rafHandle = requestAnimationFrame((ts) => this.tick(ts));
  }

  pause(): void {
    this.state.playing = false;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  stop(): void {
    this.pause();
    this.seekToFrame(0);
  }

  seekToFrame(frame: number): void {
    this.state.currentFrame = Math.max(0, Math.min(this.state.duration, frame));
    this.notifyFrame(this.state.currentFrame);
  }

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  setFps(fps: number): void {
    this.state.fps = fps;
  }

  setDuration(frames: number): void {
    this.state.duration = frames;
  }

  setLooping(looping: boolean): void {
    this.state.looping = looping;
  }

  // -------------------------------------------------------------------------
  // Keyframe management
  // -------------------------------------------------------------------------

  setKeyframe(layerId: string, property: AnimatableProperty, keyframe: KeyframeData): void {
    this.engine.setKeyframe(layerId, property, keyframe);
  }

  getValue(layerId: string, property: AnimatableProperty): number {
    return this.engine.getValue(layerId, property, this.state.currentFrame);
  }

  getKeyframes(layerId: string, property: AnimatableProperty): KeyframeData[] {
    return this.engine.getKeyframes(layerId, property);
  }

  // -------------------------------------------------------------------------
  // State accessors
  // -------------------------------------------------------------------------

  getState(): Readonly<TimelineState> {
    return this.state;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private tick(timestamp: number): void {
    if (!this.state.playing) return;

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }

    const elapsed = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.frameAccumulator += elapsed * (this.state.fps / 1000);

    while (this.frameAccumulator >= 1) {
      this.frameAccumulator -= 1;
      this.state.currentFrame += 1;

      if (this.state.currentFrame > this.state.duration) {
        if (this.state.looping) {
          this.state.currentFrame = 0;
        } else {
          this.state.currentFrame = this.state.duration;
          this.state.playing = false;
          this.notifyFrame(this.state.currentFrame);
          this.notifyEnd();
          return;
        }
      }

      this.notifyFrame(this.state.currentFrame);
    }

    this.rafHandle = requestAnimationFrame((ts) => this.tick(ts));
  }

  private notifyFrame(frame: number): void {
    for (const cb of this.onFrameCallbacks) cb(frame);
  }

  private notifyEnd(): void {
    for (const cb of this.onEndCallbacks) cb();
  }
}
