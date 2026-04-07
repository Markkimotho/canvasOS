import * as Tone from "tone";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STEP_COUNT = 16;
export const ROW_COUNT = 8;

export type DrumInstrument =
  | "kick"
  | "snare"
  | "hihat-closed"
  | "hihat-open"
  | "clap"
  | "tom"
  | "crash"
  | "ride";

export const DRUM_INSTRUMENTS: DrumInstrument[] = [
  "kick",
  "snare",
  "hihat-closed",
  "hihat-open",
  "clap",
  "tom",
  "crash",
  "ride",
];

/**
 * CC0-licensed placeholder sample URLs.
 * In production, replace with real hosted assets.
 */
const SAMPLE_URLS: Record<DrumInstrument, string> = {
  kick: "https://assets.canvasos.app/samples/drums/kick.wav",
  snare: "https://assets.canvasos.app/samples/drums/snare.wav",
  "hihat-closed": "https://assets.canvasos.app/samples/drums/hihat-closed.wav",
  "hihat-open": "https://assets.canvasos.app/samples/drums/hihat-open.wav",
  clap: "https://assets.canvasos.app/samples/drums/clap.wav",
  tom: "https://assets.canvasos.app/samples/drums/tom.wav",
  crash: "https://assets.canvasos.app/samples/drums/crash.wav",
  ride: "https://assets.canvasos.app/samples/drums/ride.wav",
};

// ---------------------------------------------------------------------------
// Grid type
// ---------------------------------------------------------------------------

/** 8 rows × 16 steps bitmask. true = active. */
export type StepGrid = boolean[][];

function createEmptyGrid(): StepGrid {
  return Array.from({ length: ROW_COUNT }, () => new Array<boolean>(STEP_COUNT).fill(false));
}

// ---------------------------------------------------------------------------
// StepSequencer class
// ---------------------------------------------------------------------------

export class StepSequencer {
  private grid: StepGrid = createEmptyGrid();
  private sampler: Tone.Sampler;
  private sequence: Tone.Sequence<number> | null = null;
  private _bpm = 120;
  private _swing = 0;
  private volumes: number[] = new Array<number>(ROW_COUNT).fill(0); // dB

  constructor() {
    // Build the Tone.Sampler with placeholder URLs
    const samplerUrls: Record<string, string> = {};
    DRUM_INSTRUMENTS.forEach((inst, idx) => {
      // Map instrument → MIDI note for Sampler (C1 upward)
      samplerUrls[`C${idx + 1}`] = SAMPLE_URLS[inst];
    });

    this.sampler = new Tone.Sampler({
      urls: samplerUrls,
      onload: () => {
        /* samples loaded */
      },
    }).toDestination();
  }

  // -------------------------------------------------------------------------
  // Playback lifecycle
  // -------------------------------------------------------------------------

  start(): void {
    this.buildSequence();
    Tone.getTransport().start();
  }

  stop(): void {
    Tone.getTransport().stop();
    this.sequence?.stop();
  }

  dispose(): void {
    this.stop();
    this.sequence?.dispose();
    this.sampler.dispose();
  }

  // -------------------------------------------------------------------------
  // Transport configuration
  // -------------------------------------------------------------------------

  setBPM(bpm: number): void {
    this._bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
  }

  getBPM(): number {
    return this._bpm;
  }

  /**
   * Set swing amount [0, 1].
   * Swing delays every even-numbered step by (swing * 50ms) at the current BPM.
   */
  setSwing(amount: number): void {
    this._swing = Math.max(0, Math.min(1, amount));
    Tone.getTransport().swing = this._swing;
    Tone.getTransport().swingSubdivision = "16n";
  }

  getSwing(): number {
    return this._swing;
  }

  // -------------------------------------------------------------------------
  // Grid editing
  // -------------------------------------------------------------------------

  toggleStep(row: number, step: number): void {
    if (row < 0 || row >= ROW_COUNT || step < 0 || step >= STEP_COUNT) return;
    this.grid[row]![step] = !this.grid[row]![step];
  }

  setStep(row: number, step: number, active: boolean): void {
    if (row < 0 || row >= ROW_COUNT || step < 0 || step >= STEP_COUNT) return;
    this.grid[row]![step] = active;
  }

  isStepActive(row: number, step: number): boolean {
    return this.grid[row]?.[step] ?? false;
  }

  clearGrid(): void {
    this.grid = createEmptyGrid();
  }

  getGrid(): Readonly<StepGrid> {
    return this.grid;
  }

  // -------------------------------------------------------------------------
  // Volume per row
  // -------------------------------------------------------------------------

  /**
   * @param row  Row index (0–7).
   * @param vol  Volume in dB (−∞ to 0). 0 = unity gain, −60 ≈ silent.
   */
  setVolume(row: number, vol: number): void {
    if (row < 0 || row >= ROW_COUNT) return;
    this.volumes[row] = vol;
  }

  getVolume(row: number): number {
    return this.volumes[row] ?? 0;
  }

  // -------------------------------------------------------------------------
  // Internal: build / rebuild Tone.Sequence
  // -------------------------------------------------------------------------

  private buildSequence(): void {
    // Dispose the old sequence if it exists
    if (this.sequence) {
      this.sequence.stop();
      this.sequence.dispose();
    }

    const steps = Array.from({ length: STEP_COUNT }, (_, i) => i);

    this.sequence = new Tone.Sequence<number>(
      (time, step) => {
        for (let row = 0; row < ROW_COUNT; row++) {
          if (!this.grid[row]?.[step]) continue;

          const note = `C${row + 1}` as Tone.Unit.Note;
          const velDb = this.volumes[row] ?? 0;
          // Convert dB to velocity [0,1]
          const velocity = velDb <= -60 ? 0 : Math.pow(10, velDb / 20);

          this.sampler.triggerAttackRelease(note, "16n", time, velocity);
        }
      },
      steps,
      "16n",
    );

    this.sequence.start(0);
  }
}
