import type { JSONContent } from "@tiptap/core";

export type { JSONContent };

/**
 * WriteLayer is the headless data model for the writing module.
 * It stores and manages TipTap document JSON independently of the React UI.
 */
export class WriteLayer {
  private doc: JSONContent;

  constructor(initialDoc?: JSONContent) {
    this.doc = initialDoc ?? {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    };
  }

  /** Return a deep copy of the current TipTap document JSON. */
  getJSON(): JSONContent {
    return JSON.parse(JSON.stringify(this.doc)) as JSONContent;
  }

  /** Replace the document with a new TipTap JSON document. */
  setJSON(doc: JSONContent): void {
    this.doc = JSON.parse(JSON.stringify(doc)) as JSONContent;
  }

  /** Extract all plain text from the document, preserving newlines. */
  getText(): string {
    return extractText(this.doc);
  }

  /** Count words in the plain-text representation of the document. */
  getWordCount(): number {
    const text = this.getText().trim();
    if (text.length === 0) return 0;
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? "";
  }

  if (!node.content || node.content.length === 0) {
    return "";
  }

  const parts: string[] = [];

  for (const child of node.content) {
    parts.push(extractText(child));
  }

  // Block-level nodes get a newline separator
  const blockTypes = new Set([
    "doc",
    "paragraph",
    "heading",
    "blockquote",
    "bulletList",
    "orderedList",
    "listItem",
    "horizontalRule",
    "hardBreak",
  ]);

  const isBlock = blockTypes.has(node.type ?? "");

  if (isBlock) {
    return parts.join("") + "\n";
  }

  return parts.join("");
}
