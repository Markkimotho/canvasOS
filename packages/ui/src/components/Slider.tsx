import { useId } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { cn } from "../utils/cn.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SliderProps {
  /** Accessible label for the slider. */
  label: string;
  /** Current value. */
  value: number;
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Step increment. */
  step?: number;
  /** Called with the new value when the slider changes. */
  onChange: (value: number) => void;
  /** Additional class names for the wrapper. */
  className?: string;
  /** Optional unit label appended to the displayed value (e.g. "px", "%"). */
  unit?: string;
  /** Whether the slider is disabled. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className,
  unit = "",
  disabled = false,
}: SliderProps) {
  const id = useId();
  const labelId = `slider-label-${id}`;
  const valueId = `slider-value-${id}`;

  const displayValue = Number.isInteger(value) ? String(value) : value.toFixed(2);

  return (
    <div className={cn("flex items-center gap-3", className)} aria-labelledby={labelId}>
      {/* Label */}
      <label
        id={labelId}
        htmlFor={`slider-thumb-${id}`}
        className="w-24 shrink-0 text-sm text-zinc-300 truncate"
      >
        {label}
      </label>

      {/* Radix slider */}
      <RadixSlider.Root
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={valueId}
        onValueChange={([v]) => {
          if (v !== undefined) onChange(v);
        }}
        className="relative flex items-center flex-1 h-5 cursor-pointer select-none touch-none"
      >
        <RadixSlider.Track className="relative bg-zinc-700 rounded-full h-1.5 flex-1">
          <RadixSlider.Range className="absolute bg-sky-500 rounded-full h-full" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          id={`slider-thumb-${id}`}
          aria-label={`${label}: ${displayValue}${unit}`}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          className={cn(
            "block w-4 h-4 rounded-full bg-white shadow-sm border-2 border-sky-500",
            "hover:border-sky-400 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1",
            "focus-visible:ring-offset-zinc-900 transition-colors",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />
      </RadixSlider.Root>

      {/* Current value display */}
      <span
        id={valueId}
        aria-label={`Current value: ${displayValue}${unit}`}
        className="w-12 text-right text-xs tabular-nums text-zinc-400 shrink-0"
      >
        {displayValue}
        {unit}
      </span>
    </div>
  );
}
