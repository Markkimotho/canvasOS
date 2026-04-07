import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import { WriteLayer } from "../WriteLayer.js";

// Minimal ProseMirror/TipTap base styles injected once
const TIPTAP_CSS = `
.ProseMirror { outline: none; caret-color: #ebebeb; }
.ProseMirror p { margin: 0 0 0.75em; line-height: 1.7; color: #d4d4d4; }
.ProseMirror h1 { font-size: 1.8em; font-weight: 700; margin: 0 0 0.5em; color: #ebebeb; }
.ProseMirror h2 { font-size: 1.4em; font-weight: 600; margin: 0 0 0.5em; color: #ebebeb; }
.ProseMirror h3 { font-size: 1.15em; font-weight: 600; margin: 0 0 0.5em; color: #ebebeb; }
.ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0 0 0.75em; color: #d4d4d4; }
.ProseMirror li { margin-bottom: 0.25em; }
.ProseMirror blockquote { border-left: 3px solid #7c6ef5; padding-left: 1em; margin: 0 0 0.75em; color: #888; }
.ProseMirror hr { border: none; border-top: 1px solid #2c2c2c; margin: 1.5em 0; }
.ProseMirror strong { font-weight: 700; color: #ebebeb; }
.ProseMirror em { font-style: italic; }
.ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #4a4a4a; pointer-events: none; float: left; height: 0; }
`;

if (typeof document !== "undefined" && !document.getElementById("tiptap-base-css")) {
  const style = document.createElement("style");
  style.id = "tiptap-base-css";
  style.textContent = TIPTAP_CSS;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
      className={`inline-flex items-center justify-center w-8 h-8 rounded text-sm transition-colors ${
        active ? "bg-sky-600 text-white" : "text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface ToolbarProps {
  editor: Editor;
}

function Toolbar({ editor }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Rich text formatting toolbar"
      className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-zinc-800 bg-zinc-950 shrink-0"
    >
      {/* Bold */}
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>

      <div aria-hidden className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Heading 1 */}
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>

      {/* Heading 2 */}
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>

      {/* Heading 3 */}
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>

      <div aria-hidden className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Bullet list */}
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="w-4 h-4 fill-current">
          <circle cx="2" cy="4" r="1.5" />
          <rect x="5" y="3" width="9" height="2" rx="1" />
          <circle cx="2" cy="8" r="1.5" />
          <rect x="5" y="7" width="9" height="2" rx="1" />
          <circle cx="2" cy="12" r="1.5" />
          <rect x="5" y="11" width="9" height="2" rx="1" />
        </svg>
      </ToolbarButton>

      {/* Numbered list */}
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="w-4 h-4 fill-current">
          <text x="0" y="5" fontSize="5" fontFamily="monospace">
            1.
          </text>
          <rect x="5" y="3" width="9" height="2" rx="1" />
          <text x="0" y="9" fontSize="5" fontFamily="monospace">
            2.
          </text>
          <rect x="5" y="7" width="9" height="2" rx="1" />
          <text x="0" y="13" fontSize="5" fontFamily="monospace">
            3.
          </text>
          <rect x="5" y="11" width="9" height="2" rx="1" />
        </svg>
      </ToolbarButton>

      <div aria-hidden className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Blockquote */}
      <ToolbarButton
        label="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="w-4 h-4 fill-current">
          <path d="M2 3h3v5H3a1 1 0 00-1 1v1h4V3H2zm7 0h3v5h-2a1 1 0 00-1 1v1h4V3H9z" />
        </svg>
      </ToolbarButton>

      {/* Horizontal rule */}
      <ToolbarButton
        label="Insert horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="w-4 h-4 fill-current">
          <rect x="1" y="7" width="14" height="2" rx="1" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main WritePanel
// ---------------------------------------------------------------------------

export interface WritePanelProps {
  initialDoc?: JSONContent;
  onDocChange?: (doc: JSONContent) => void;
  className?: string;
}

export function WritePanel({ initialDoc, onDocChange, className = "" }: WritePanelProps) {
  const writeLayer = React.useRef<WriteLayer>(new WriteLayer(initialDoc));
  const [wordCount, setWordCount] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: writeLayer.current.getJSON(),
    editorProps: {
      attributes: {
        "aria-label": "Rich text document editor",
        "aria-multiline": "true",
        role: "textbox",
        class: [
          "prose prose-invert max-w-none",
          "min-h-full p-6 focus:outline-none",
          "text-zinc-100",
        ].join(" "),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      writeLayer.current.setJSON(json);
      setWordCount(writeLayer.current.getWordCount());
      onDocChange?.(json);
    },
  });

  // Update word count on mount
  useEffect(() => {
    setWordCount(writeLayer.current.getWordCount());
  }, []);

  const handleExportText = useCallback(() => {
    const text = writeLayer.current.getText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "document.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div
      aria-label="Writing editor panel"
      className={`flex flex-col h-full bg-zinc-900 text-zinc-100 overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      {editor && <Toolbar editor={editor} />}

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} aria-label="Document content area" className="h-full" />
      </div>

      {/* Footer: word count + export */}
      <div
        aria-label="Document statistics and actions"
        className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-t border-zinc-800 shrink-0 text-xs"
      >
        <span
          aria-live="polite"
          aria-label={`Word count: ${wordCount} words`}
          className="text-zinc-500"
        >
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>

        <button
          type="button"
          aria-label="Export document as plain text file"
          className="px-3 py-1 rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
          onClick={handleExportText}
        >
          Export text
        </button>
      </div>
    </div>
  );
}
