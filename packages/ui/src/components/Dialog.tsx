import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "../utils/cn.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback fired when the open state should change. */
  onOpenChange: (open: boolean) => void;
  /** Accessible title shown at the top of the dialog. */
  title: string;
  /** Optional description shown below the title. */
  description?: string;
  /** Dialog body content. */
  children: React.ReactNode;
  /** Additional class names for the content panel. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Close button icon
// ---------------------------------------------------------------------------

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="w-4 h-4 fill-current">
      <path d="M2.293 2.293a1 1 0 011.414 0L8 6.586l4.293-4.293a1 1 0 111.414 1.414L9.414 8l4.293 4.293a1 1 0 01-1.414 1.414L8 9.414l-4.293 4.293a1 1 0 01-1.414-1.414L6.586 8 2.293 3.707a1 1 0 010-1.414z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        {/* Overlay */}
        <RadixDialog.Overlay
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-sm z-50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        />

        {/* Content panel */}
        <RadixDialog.Content
          aria-describedby={description ? "dialog-description" : undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50",
            "-translate-x-1/2 -translate-y-1/2",
            "w-full max-w-lg max-h-[90vh] overflow-y-auto",
            "bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl",
            "p-6 focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <RadixDialog.Title className="text-lg font-semibold text-zinc-100 leading-tight pr-4">
              {title}
            </RadixDialog.Title>

            <RadixDialog.Close
              aria-label="Close dialog"
              className={cn(
                "shrink-0 rounded text-zinc-400 hover:text-zinc-100",
                "hover:bg-zinc-800 p-1 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-sky-500",
              )}
            >
              <CloseIcon />
            </RadixDialog.Close>
          </div>

          {/* Optional description */}
          {description && (
            <RadixDialog.Description id="dialog-description" className="text-sm text-zinc-400 mb-4">
              {description}
            </RadixDialog.Description>
          )}

          {/* Body */}
          <div className="text-zinc-200">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
