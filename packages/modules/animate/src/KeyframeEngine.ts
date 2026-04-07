import type { KeyframeData, EasingType, AnimatableProperty } from "@canvasos/core";

// Re-export the imported types so consumers can use them from this module.
export type { KeyframeData, EasingType, AnimatableProperty };

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

function easingLinear(t: number): number {
  return t;
}

function easingInQuad(t: number): number {
  return t * t;
}

function easingOutQuad(t: number): number {
  return t * (2 - t);
}

function easingInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easingInCubic(t: number): number {
  return t * t * t;
}

function easingOutCubic(t: number): number {
  const u = t - 1;
  return u * u * u + 1;
}

function easingInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

function easingIn(t: number): number {
  // Generic ease-in (same as ease-in-cubic for smooth feel)
  return easingInCubic(t);
}

function easingOut(t: number): number {
  return easingOutCubic(t);
}

function easingInOut(t: number): number {
  return easingInOutCubic(t);
}

// ---------------------------------------------------------------------------
// Custom cubic Bézier easing
// Handles [x1,y1,x2,y2] control points (same convention as CSS cubic-bezier)
// Uses Newton-Raphson iteration to solve for t given x, then returns y(t).
// ---------------------------------------------------------------------------

function sampleCubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function customBezierEasing(progress: number, handles: [number, number, number, number]): number {
  const [x1, y1, x2, y2] = handles;

  // Clamp
  const x = Math.max(0, Math.min(1, progress));

  // Newton-Raphson to find t where bezierX(t) == x
  let t = x;
  for (let i = 0; i < 8; i++) {
    const bx = sampleCubicBezier(t, 0, x1, x2, 1) - x;
    const dbx = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(dbx) < 1e-8) break;
    t -= bx / dbx;
  }

  return sampleCubicBezier(t, 0, y1, y2, 1);
}

// ---------------------------------------------------------------------------
// Spring (critically damped)
// ---------------------------------------------------------------------------

/**
 * Simulate one step of a critically damped spring.
 *
 * @param from       Start value.
 * @param to         Target value.
 * @param velocity   Current velocity (units/frame).  Pass 0 for the first call.
 * @param stiffness  Spring stiffness constant (default 170).
 * @param damping    Damping coefficient (default 26 for critical damping at stiffness=170).
 * @returns          New position on this step's response curve (0→1 normalised).
 */
export function springInterpolate(
  from: number,
  to: number,
  velocity: number,
  stiffness = 170,
  damping = 26,
): number {
  const dt = 1 / 60; // assume 60 fps integration step
  const displacement = from - to;
  const springForce = -stiffness * displacement;
  const dampingForce = -damping * velocity;
  const acceleration = springForce + dampingForce;
  const newVelocity = velocity + acceleration * dt;
  return from + newVelocity * dt;
}

// ---------------------------------------------------------------------------
// Apply easing
// ---------------------------------------------------------------------------

function applyEasing(
  t: number,
  easing: EasingType,
  bezierHandles?: [number, number, number, number],
): number {
  switch (easing) {
    case "linear":
      return easingLinear(t);
    case "ease-in":
      return easingIn(t);
    case "ease-out":
      return easingOut(t);
    case "ease-in-out":
      return easingInOut(t);
    case "ease-in-quad":
      return easingInQuad(t);
    case "ease-out-quad":
      return easingOutQuad(t);
    case "ease-in-out-quad":
      return easingInOutQuad(t);
    case "ease-in-cubic":
      return easingInCubic(t);
    case "ease-out-cubic":
      return easingOutCubic(t);
    case "ease-in-out-cubic":
      return easingInOutCubic(t);
    case "spring":
      // Spring easing is stateful; use springInterpolate for true physics.
      // For single-value interpolation we approximate with ease-out-cubic.
      return easingOutCubic(t);
    case "custom-bezier":
      if (bezierHandles) {
        return customBezierEasing(t, bezierHandles);
      }
      return easingLinear(t);
    default:
      return easingLinear(t);
  }
}

// ---------------------------------------------------------------------------
// Main interpolation function
// ---------------------------------------------------------------------------

/**
 * Compute the interpolated value of a property at a given frame time.
 *
 * @param _property  The animatable property name (unused in computation but
 *                   included for future per-property clamping).
 * @param keyframes  Sorted (ascending by time) array of keyframe data.
 * @param time       Current frame time.
 * @returns          Interpolated numeric value.
 */
export function interpolate(
  _property: AnimatableProperty,
  keyframes: KeyframeData[],
  time: number,
): number {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0]!.value;

  // Sort defensively
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0]!.time) return sorted[0]!.value;

  // After last keyframe
  if (time >= sorted[sorted.length - 1]!.time) {
    return sorted[sorted.length - 1]!.value;
  }

  // Find the surrounding pair
  let lo = sorted[0]!;
  let hi = sorted[1]!;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i]!.time <= time && sorted[i + 1]!.time >= time) {
      lo = sorted[i]!;
      hi = sorted[i + 1]!;
      break;
    }
  }

  const span = hi.time - lo.time;
  if (span === 0) return lo.value;

  // Normalised t ∈ [0, 1]
  const rawT = (time - lo.time) / span;

  // Apply easing from the lo keyframe's easing type
  const easedT = applyEasing(rawT, lo.easing, lo.bezierHandles);

  return lo.value + easedT * (hi.value - lo.value);
}

// ---------------------------------------------------------------------------
// KeyframeEngine class — manages a map of property → keyframes
// ---------------------------------------------------------------------------

export class KeyframeEngine {
  private tracks: Map<string, KeyframeData[]> = new Map();

  /** Add or replace a keyframe for a layer+property at a given frame. */
  setKeyframe(layerId: string, property: AnimatableProperty, keyframe: KeyframeData): void {
    const key = `${layerId}:${property}`;
    const existing = this.tracks.get(key) ?? [];
    // Replace existing keyframe at same time, or add new
    const idx = existing.findIndex((k) => k.time === keyframe.time);
    if (idx !== -1) {
      existing[idx] = keyframe;
    } else {
      existing.push(keyframe);
      existing.sort((a, b) => a.time - b.time);
    }
    this.tracks.set(key, existing);
  }

  /** Remove all keyframes for a property track. */
  clearTrack(layerId: string, property: AnimatableProperty): void {
    this.tracks.delete(`${layerId}:${property}`);
  }

  /** Get the interpolated value for a property at a given frame time. */
  getValue(layerId: string, property: AnimatableProperty, time: number): number {
    const key = `${layerId}:${property}`;
    const keyframes = this.tracks.get(key) ?? [];
    return interpolate(property, keyframes, time);
  }

  /** Return all keyframes for a property track (sorted by time). */
  getKeyframes(layerId: string, property: AnimatableProperty): KeyframeData[] {
    const key = `${layerId}:${property}`;
    return [...(this.tracks.get(key) ?? [])];
  }
}
