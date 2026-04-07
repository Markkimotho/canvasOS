import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "../utils/cn.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TooltipProps {
  /** The text (or element) displayed inside the tooltip popup. */
  content: React.ReactNode;
  /** The trigger element that the tooltip is anchored to. */
  children: React.ReactNode;
  /** Delay in ms before showing the tooltip. Defaults to 400. */
  delayDuration?: number;
  /** Side of the trigger the tooltip should appear on. */
  side?: "top" | "right" | "bottom" | "left";
  /** Alignment relative to the trigger. */
  align?: "start" | "center" | "end";
  /** Additional class names for the tooltip content. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Tooltip wraps @radix-ui/react-tooltip. Children must be a single
 * focusable/hoverable element (e.g. a <button>). Wrap non-interactive
 * elements in a <span> with tabIndex={0} if needed.
 */
export function Tooltip({
  content,
  children,
  delayDuration = 400,
  side = "top",
  align = "center",
  className,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>

        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              "z-50 max-w-xs rounded bg-zinc-800 border border-zinc-700",
              "px-2.5 py-1.5 text-xs text-zinc-100 shadow-lg leading-snug",
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
              "data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-1",
              "data-[side=left]:slide-in-from-right-1",
              "data-[side=right]:slide-in-from-left-1",
              "data-[side=top]:slide-in-from-bottom-1",
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-zinc-800" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
