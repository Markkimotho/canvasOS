import React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn.js";

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

const buttonVariants = cva(
  // Base styles applied to every button
  [
    "inline-flex items-center justify-center gap-2 font-medium rounded",
    "transition-colors duration-150 focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
    "focus-visible:ring-offset-zinc-900",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        default: "bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700",
        secondary: "bg-zinc-700 text-zinc-100 hover:bg-zinc-600 active:bg-zinc-800",
        ghost:
          "bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-700",
        danger: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Accessible label override — use when button has no visible text. */
  "aria-label"?: string;
  /** Set to true to show a loading spinner and disable interaction. */
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    disabled,
    loading = false,
    children,
    "aria-label": ariaLabel,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <svg
          aria-hidden="true"
          className="animate-spin h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = "Button";
