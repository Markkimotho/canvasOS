import { useState, useCallback, useEffect } from "react";
import type { OscillatorType, ADSREnvelope, FilterParams } from "../MiniSynth.js";
import type { DrumInstrument } from "../StepSequencer.js";
import { DRUM_INSTRUMENTS, STEP_COUNT, ROW_COUNT } from "../StepSequencer.js";
import type { MidiDevice } from "../MidiController.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudioPanelProps {
  /** Current step grid state: ROW_COUNT rows × STEP_COUNT columns */
  grid?: boolean[][];
  bpm?: number;
  swing?: number;
  oscillatorType?: OscillatorType;
  adsr?: ADSREnvelope;
  filter?: FilterParams;
  midiDevices?: MidiDevice[];
  onStepToggle?: (row: number, step: number) => void;
  onBpmChange?: (bpm: number) => void;
  onSwingChange?: (swing: number) => void;
  onOscillatorChange?: (type: OscillatorType) => void;
  onADSRChange?: (adsr: Partial<ADSREnvelope>) => void;
  onFilterChange?: (params: Partial<FilterParams>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: "10px",
        color: "#777",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "block",
        marginBottom: "4px",
      }}
    >
      {children}
    </span>
  );
}

function Knob({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        alignItems: "center",
        minWidth: "50px",
      }}
    >
      <label
        htmlFor={id}
        style={{ fontSize: "10px", color: "#888", textAlign: "center", cursor: "default" }}
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step ?? 0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "60px" }}
      />
      <span style={{ fontSize: "10px", color: "#666" }}>
        {format ? format(value) : value.toFixed(2)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Sequencer grid
// ---------------------------------------------------------------------------

function StepGrid({
  grid,
  onStepToggle,
}: {
  grid: boolean[][];
  onStepToggle?: (row: number, step: number) => void;
}) {
  return (
    <div
      role="grid"
      aria-label="Step sequencer grid"
      style={{ display: "flex", flexDirection: "column", gap: "2px" }}
    >
      {DRUM_INSTRUMENTS.map((inst: DrumInstrument, row) => (
        <div
          key={inst}
          role="row"
          aria-label={`${inst} row`}
          style={{ display: "flex", gap: "2px", alignItems: "center" }}
        >
          {/* Row label */}
          <span
            role="rowheader"
            style={{
              width: "80px",
              fontSize: "10px",
              color: "#888",
              textAlign: "right",
              paddingRight: "6px",
              flexShrink: 0,
              userSelect: "none",
            }}
          >
            {inst}
          </span>

          {/* Steps */}
          {Array.from({ length: STEP_COUNT }, (_, step) => {
            const active = grid[row]?.[step] ?? false;
            const isGrouped = step % 4 === 0;
            return (
              <button
                key={step}
                role="gridcell"
                aria-label={`${inst} step ${step + 1} ${active ? "on" : "off"}`}
                aria-pressed={active}
                onClick={() => onStepToggle?.(row, step)}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "3px",
                  border: "1px solid",
                  borderColor: isGrouped ? "#555" : "#3a3a3a",
                  background: active
                    ? row < 2
                      ? "#6366f1"
                      : "#a5b4fc"
                    : isGrouped
                      ? "#252525"
                      : "#1e1e1e",
                  cursor: "pointer",
                  padding: 0,
                  marginLeft: isGrouped && step > 0 ? "4px" : undefined,
                  transition: "background 0.05s",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default empty grid
// ---------------------------------------------------------------------------

function createEmptyGrid(): boolean[][] {
  return Array.from({ length: ROW_COUNT }, () => new Array<boolean>(STEP_COUNT).fill(false));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AudioPanel({
  grid: gridProp,
  bpm: bpmProp = 120,
  swing: swingProp = 0,
  oscillatorType: oscProp = "sawtooth",
  adsr: adsrProp,
  filter: filterProp,
  midiDevices = [],
  onStepToggle,
  onBpmChange,
  onSwingChange,
  onOscillatorChange,
  onADSRChange,
  onFilterChange,
}: AudioPanelProps) {
  const [grid, setGrid] = useState<boolean[][]>(gridProp ?? createEmptyGrid());
  const [bpm, setBpm] = useState(bpmProp);
  const [swing, setSwing] = useState(swingProp);
  const [oscType, setOscType] = useState<OscillatorType>(oscProp);
  const [adsr, setAdsr] = useState<ADSREnvelope>(
    adsrProp ?? { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.4 },
  );
  const [filter, setFilter] = useState<FilterParams>(filterProp ?? { cutoff: 8000, resonance: 1 });

  // Keep local state in sync with props
  useEffect(() => {
    if (gridProp) setGrid(gridProp);
  }, [gridProp]);
  useEffect(() => {
    setBpm(bpmProp);
  }, [bpmProp]);
  useEffect(() => {
    setSwing(swingProp);
  }, [swingProp]);
  useEffect(() => {
    setOscType(oscProp);
  }, [oscProp]);
  useEffect(() => {
    if (adsrProp) setAdsr(adsrProp);
  }, [adsrProp]);
  useEffect(() => {
    if (filterProp) setFilter(filterProp);
  }, [filterProp]);

  // -------------------------------------------------------------------------
  // Step toggle (uncontrolled fallback)
  // -------------------------------------------------------------------------

  const handleStepToggle = useCallback(
    (row: number, step: number) => {
      if (onStepToggle) {
        onStepToggle(row, step);
      } else {
        setGrid((prev) => {
          const next = prev.map((r) => [...r]);
          if (next[row]) next[row]![step] = !next[row]![step];
          return next;
        });
      }
    },
    [onStepToggle],
  );

  // -------------------------------------------------------------------------
  // BPM
  // -------------------------------------------------------------------------

  const handleBpmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      setBpm(v);
      onBpmChange?.(v);
    },
    [onBpmChange],
  );

  // -------------------------------------------------------------------------
  // Swing
  // -------------------------------------------------------------------------

  const handleSwingChange = useCallback(
    (v: number) => {
      setSwing(v);
      onSwingChange?.(v);
    },
    [onSwingChange],
  );

  // -------------------------------------------------------------------------
  // Oscillator type
  // -------------------------------------------------------------------------

  const oscTypes: OscillatorType[] = ["sine", "square", "sawtooth", "triangle"];

  const handleOscChange = useCallback(
    (type: OscillatorType) => {
      setOscType(type);
      onOscillatorChange?.(type);
    },
    [onOscillatorChange],
  );

  // -------------------------------------------------------------------------
  // ADSR
  // -------------------------------------------------------------------------

  const handleAdsrChange = useCallback(
    (key: keyof ADSREnvelope, value: number) => {
      const updated = { ...adsr, [key]: value };
      setAdsr(updated);
      onADSRChange?.({ [key]: value });
    },
    [adsr, onADSRChange],
  );

  // -------------------------------------------------------------------------
  // Filter
  // -------------------------------------------------------------------------

  const handleFilterChange = useCallback(
    (key: keyof FilterParams, value: number) => {
      const updated = { ...filter, [key]: value };
      setFilter(updated);
      onFilterChange?.({ [key]: value });
    },
    [filter, onFilterChange],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      role="region"
      aria-label="Audio module panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "10px",
        height: "100%",
        overflowY: "auto",
        background: "#1a1a1a",
        color: "#ccc",
        userSelect: "none",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* MIDI device indicator                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="MIDI devices">
        <SectionLabel>MIDI</SectionLabel>
        {midiDevices.length === 0 ? (
          <span style={{ fontSize: "11px", color: "#555" }}>No devices connected</span>
        ) : (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {midiDevices.map((d) => (
              <li
                key={d.id}
                aria-label={`MIDI device: ${d.name}`}
                style={{
                  fontSize: "11px",
                  color: "#6ee7b7",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#6ee7b7",
                    flexShrink: 0,
                  }}
                />
                {d.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Step sequencer                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Step sequencer">
        <SectionLabel>Step Sequencer</SectionLabel>
        <StepGrid grid={grid} onStepToggle={handleStepToggle} />

        {/* BPM + Swing */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "8px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label htmlFor="bpm-input" style={{ fontSize: "11px", color: "#888" }}>
              BPM
            </label>
            <input
              id="bpm-input"
              type="range"
              aria-label="BPM"
              min={40}
              max={240}
              step={1}
              value={bpm}
              onChange={handleBpmChange}
              style={{ width: "80px" }}
            />
            <span
              style={{ fontSize: "11px", color: "#ccc", minWidth: "28px" }}
              aria-live="polite"
              aria-label={`BPM: ${bpm}`}
            >
              {bpm}
            </span>
          </div>

          <Knob
            id="swing-knob"
            label="Swing"
            value={swing}
            min={0}
            max={1}
            step={0.01}
            onChange={handleSwingChange}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* MiniSynth controls                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Synthesiser controls"
        style={{ borderTop: "1px solid #2a2a2a", paddingTop: "10px" }}
      >
        <SectionLabel>Synth</SectionLabel>

        {/* Oscillator type */}
        <div
          aria-label="Oscillator type"
          style={{ display: "flex", gap: "4px", marginBottom: "10px", flexWrap: "wrap" }}
        >
          {oscTypes.map((type) => (
            <button
              key={type}
              aria-label={`Oscillator: ${type}`}
              aria-pressed={oscType === type}
              onClick={() => handleOscChange(type)}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: oscType === type ? "#6366f1" : "#444",
                background: oscType === type ? "rgba(99,102,241,0.2)" : "transparent",
                color: oscType === type ? "#a5b4fc" : "#888",
                cursor: "pointer",
                fontSize: "11px",
                textTransform: "capitalize",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ADSR */}
        <div
          aria-label="ADSR envelope"
          style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}
        >
          {(["attack", "decay", "sustain", "release"] as (keyof ADSREnvelope)[]).map((key) => (
            <Knob
              key={key}
              id={`adsr-${key}`}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={adsr[key]}
              min={key === "sustain" ? 0 : 0.001}
              max={key === "sustain" ? 1 : key === "release" ? 4 : 2}
              step={key === "sustain" ? 0.01 : 0.001}
              onChange={(v) => handleAdsrChange(key, v)}
              format={(v) => (key === "sustain" ? `${Math.round(v * 100)}%` : `${v.toFixed(3)}s`)}
            />
          ))}
        </div>

        {/* Filter */}
        <div aria-label="Low-pass filter" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <Knob
            id="filter-cutoff"
            label="Cutoff"
            value={filter.cutoff}
            min={20}
            max={20000}
            step={1}
            onChange={(v) => handleFilterChange("cutoff", v)}
            format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}kHz` : `${Math.round(v)}Hz`)}
          />
          <Knob
            id="filter-resonance"
            label="Resonance"
            value={filter.resonance}
            min={0.1}
            max={20}
            step={0.1}
            onChange={(v) => handleFilterChange("resonance", v)}
            format={(v) => v.toFixed(1)}
          />
        </div>
      </section>
    </div>
  );
}
