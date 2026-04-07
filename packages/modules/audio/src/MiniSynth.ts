import * as Tone from "tone";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";

export interface ADSREnvelope {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0–1
  release: number; // seconds
}

export interface FilterParams {
  cutoff: number; // Hz (20–20000)
  resonance: number; // Q factor (0.1–20)
}

export interface ReverbParams {
  wet: number; // 0–1 send level
  decay: number; // seconds
  preDelay: number;
}

export interface DelayParams {
  wet: number; // 0–1 send level
  delayTime: number; // seconds
  feedback: number; // 0–1
}

// ---------------------------------------------------------------------------
// MiniSynth
// ---------------------------------------------------------------------------

export class MiniSynth {
  private poly: Tone.PolySynth<Tone.Synth>;
  private filter: Tone.Filter;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private reverbGain: Tone.Gain;
  private delayGain: Tone.Gain;
  private dryGain: Tone.Gain;

  constructor() {
    // Build signal chain:
    // PolySynth → Filter → dry/wet splits → Destination

    this.filter = new Tone.Filter({
      frequency: 8000,
      type: "lowpass",
      rolloff: -24,
      Q: 1,
    });

    // Reverb
    this.reverb = new Tone.Reverb({ decay: 2, preDelay: 0.01 });
    this.reverbGain = new Tone.Gain(0); // wet send level
    this.reverb.toDestination();

    // Delay
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.3 });
    this.delayGain = new Tone.Gain(0); // wet send level
    this.delay.toDestination();

    // Dry path
    this.dryGain = new Tone.Gain(1);
    this.dryGain.toDestination();

    // Filter feeds dry path and effect sends
    this.filter.connect(this.dryGain);
    this.filter.connect(this.reverbGain);
    this.filter.connect(this.delayGain);
    this.reverbGain.connect(this.reverb);
    this.delayGain.connect(this.delay);

    // PolySynth
    this.poly = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.5,
        release: 0.4,
      },
    });
    this.poly.connect(this.filter);
  }

  // -------------------------------------------------------------------------
  // Oscillator
  // -------------------------------------------------------------------------

  setOscillatorType(type: OscillatorType): void {
    this.poly.set({ oscillator: { type } });
  }

  // -------------------------------------------------------------------------
  // ADSR envelope
  // -------------------------------------------------------------------------

  setADSR(envelope: Partial<ADSREnvelope>): void {
    this.poly.set({ envelope });
  }

  getADSR(): ADSREnvelope {
    const env = this.poly.get().envelope as ADSREnvelope;
    return {
      attack: env.attack ?? 0.005,
      decay: env.decay ?? 0.1,
      sustain: env.sustain ?? 0.5,
      release: env.release ?? 0.4,
    };
  }

  // -------------------------------------------------------------------------
  // Filter
  // -------------------------------------------------------------------------

  setFilter(params: Partial<FilterParams>): void {
    if (params.cutoff !== undefined) {
      this.filter.frequency.value = Math.max(20, Math.min(20000, params.cutoff));
    }
    if (params.resonance !== undefined) {
      this.filter.Q.value = Math.max(0.1, Math.min(20, params.resonance));
    }
  }

  getFilter(): FilterParams {
    return {
      cutoff: Number(this.filter.frequency.value),
      resonance: this.filter.Q.value,
    };
  }

  // -------------------------------------------------------------------------
  // Reverb
  // -------------------------------------------------------------------------

  setReverb(params: Partial<ReverbParams>): void {
    if (params.wet !== undefined) {
      this.reverbGain.gain.value = Math.max(0, Math.min(1, params.wet));
    }
    if (params.decay !== undefined) {
      this.reverb.decay = Math.max(0.1, params.decay);
    }
    if (params.preDelay !== undefined) {
      this.reverb.preDelay = Math.max(0, params.preDelay);
    }
  }

  // -------------------------------------------------------------------------
  // Delay
  // -------------------------------------------------------------------------

  setDelay(params: Partial<DelayParams>): void {
    if (params.wet !== undefined) {
      this.delayGain.gain.value = Math.max(0, Math.min(1, params.wet));
    }
    if (params.delayTime !== undefined) {
      this.delay.delayTime.value = Math.max(0, params.delayTime);
    }
    if (params.feedback !== undefined) {
      this.delay.feedback.value = Math.max(0, Math.min(1, params.feedback));
    }
  }

  // -------------------------------------------------------------------------
  // Note triggering
  // -------------------------------------------------------------------------

  /**
   * Trigger a note on the poly synth.
   *
   * @param note      Tone.js note string, e.g. "C4", "F#3".
   * @param duration  Tone.js duration string or seconds, e.g. "8n", 0.25.
   * @param time      Optional start time in Tone.js timeline (default: now).
   */
  triggerNote(note: string, duration: Tone.Unit.Time = "8n", time?: Tone.Unit.Time): void {
    const startTime = time ?? Tone.now();
    this.poly.triggerAttackRelease(note as Tone.Unit.Note, duration, startTime);
  }

  /**
   * Trigger note-on without automatic release.
   */
  noteOn(note: string, velocity = 1): void {
    this.poly.triggerAttack(note as Tone.Unit.Note, Tone.now(), velocity);
  }

  /**
   * Release a held note.
   */
  noteOff(note: string): void {
    this.poly.triggerRelease(note as Tone.Unit.Note, Tone.now());
  }

  releaseAll(): void {
    this.poly.releaseAll();
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  dispose(): void {
    this.poly.dispose();
    this.filter.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.reverbGain.dispose();
    this.delayGain.dispose();
    this.dryGain.dispose();
  }
}
