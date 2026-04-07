import { useEffect, useRef, useState, useCallback } from "react";
import {
  AudioPanel,
  StepSequencer,
  MiniSynth,
  MidiController,
  ROW_COUNT,
  STEP_COUNT,
} from "@canvasos/audio";
import type { ADSREnvelope, FilterParams, OscillatorType, MidiDevice } from "@canvasos/audio";

function createEmptyGrid(): boolean[][] {
  return Array.from({ length: ROW_COUNT }, () => new Array<boolean>(STEP_COUNT).fill(false));
}

export function MusicView() {
  const [grid, setGrid] = useState<boolean[][]>(createEmptyGrid);
  const [bpm, setBpm] = useState(128);
  const [swing, setSwing] = useState(0);
  const [oscType, setOscType] = useState<OscillatorType>("sawtooth");
  const [adsr, setAdsr] = useState<ADSREnvelope>({
    attack: 0.005,
    decay: 0.1,
    sustain: 0.5,
    release: 0.4,
  });
  const [filter, setFilter] = useState<FilterParams>({
    cutoff: 8000,
    resonance: 1,
  });
  const [playing, setPlaying] = useState(false);
  const [midiDevices, setMidiDevices] = useState<MidiDevice[]>([]);

  const seqRef = useRef<StepSequencer | null>(null);
  const synthRef = useRef<MiniSynth | null>(null);
  const midiRef = useRef<MidiController | null>(null);

  // Mount: create engine instances
  useEffect(() => {
    const synth = new MiniSynth();
    synth.setOscillatorType(oscType);
    synthRef.current = synth;

    const seq = new StepSequencer();
    seq.setBPM(bpm);
    seq.setSwing(swing);
    seqRef.current = seq;

    const midi = new MidiController();
    midi
      .connect()
      .then(() => setMidiDevices([...midi.getDevices()]))
      .catch(() => {
        // Web MIDI not available or permission denied — silently ignore
      });
    midiRef.current = midi;

    return () => {
      seq.stop();
      seq.dispose();
      synth.dispose();
      midi.disconnect();
      seqRef.current = null;
      synthRef.current = null;
      midiRef.current = null;
    };
  }, []);

  // Transport
  const togglePlay = useCallback(() => {
    const seq = seqRef.current;
    if (!seq) return;
    if (playing) {
      seq.stop();
      setPlaying(false);
    } else {
      seq.start();
      setPlaying(true);
    }
  }, [playing]);

  // Step toggle: update grid state + sequencer grid
  const handleStepToggle = useCallback((row: number, step: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      const newVal = !next[row]![step];
      next[row]![step] = newVal;
      seqRef.current?.setStep(row, step, newVal);
      return next;
    });
  }, []);

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(newBpm);
    seqRef.current?.setBPM(newBpm);
  }, []);

  const handleSwingChange = useCallback((newSwing: number) => {
    setSwing(newSwing);
    seqRef.current?.setSwing(newSwing);
  }, []);

  const handleOscChange = useCallback((type: OscillatorType) => {
    setOscType(type);
    synthRef.current?.setOscillatorType(type);
  }, []);

  const handleAdsrChange = useCallback((partial: Partial<ADSREnvelope>) => {
    setAdsr((prev) => {
      const updated = { ...prev, ...partial };
      synthRef.current?.setADSR(updated);
      return updated;
    });
  }, []);

  const handleFilterChange = useCallback((partial: Partial<FilterParams>) => {
    setFilter((prev) => {
      const updated = { ...prev, ...partial };
      synthRef.current?.setFilter(updated);
      return updated;
    });
  }, []);

  return (
    <main className="ml-16 mt-12 mb-12 h-[calc(100vh-6rem)] overflow-hidden bg-surface-container-lowest flex flex-col">
      {/* Transport bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-surface-container border-b border-white/5 flex-shrink-0">
        <button
          onClick={togglePlay}
          className={[
            "w-9 h-9 rounded-full flex items-center justify-center transition-all",
            playing
              ? "bg-[rgba(233,69,96,0.2)] border border-[#E94560]/50 text-[#E94560] hover:bg-[rgba(233,69,96,0.3)]"
              : "bg-surface-container-highest border border-white/10 text-on-surface/70 hover:border-[#E94560]/40 hover:text-[#E94560]",
          ].join(" ")}
          aria-label={playing ? "Stop sequencer" : "Start sequencer"}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {playing ? "stop" : "play_arrow"}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="font-['JetBrains_Mono'] text-sm font-bold text-[#E94560]">{bpm}</span>
          <span className="font-['JetBrains_Mono'] text-[10px] text-on-surface/40 uppercase">
            BPM
          </span>
        </div>

        {swing > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-['JetBrains_Mono'] text-[10px] text-on-surface/40 uppercase">
              Swing
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-on-surface/60">
              {Math.round(swing * 100)}%
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Playing pulse indicator */}
        {playing && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#E94560] animate-pulse" />
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#E94560] uppercase tracking-widest">
              Playing
            </span>
          </div>
        )}

        {/* MIDI indicator */}
        {midiDevices.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-highest border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-['JetBrains_Mono'] text-[10px] text-on-surface/50">MIDI</span>
          </div>
        )}
      </div>

      {/* AudioPanel fills the rest */}
      <div className="flex-1 overflow-hidden">
        <AudioPanel
          grid={grid}
          bpm={bpm}
          swing={swing}
          oscillatorType={oscType}
          adsr={adsr}
          filter={filter}
          midiDevices={midiDevices}
          onStepToggle={handleStepToggle}
          onBpmChange={handleBpmChange}
          onSwingChange={handleSwingChange}
          onOscillatorChange={handleOscChange}
          onADSRChange={handleAdsrChange}
          onFilterChange={handleFilterChange}
        />
      </div>
    </main>
  );
}
