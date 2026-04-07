import paper from "paper";

export type TextAlignment = "left" | "center" | "right";

export interface TextStyle {
  fontFamily: string;
  fontSize: number; // px
  fontWeight: string; // e.g. "normal", "bold", "400", "700"
  fontStyle: string; // "normal" | "italic" | "oblique"
  tracking: number; // letter-spacing in px
  leading: number; // line-height in px (0 = auto = fontSize * 1.2)
  alignment: TextAlignment;
  color: string; // CSS color string
}

const DEFAULT_STYLE: TextStyle = {
  fontFamily: "sans-serif",
  fontSize: 16,
  fontWeight: "normal",
  fontStyle: "normal",
  tracking: 0,
  leading: 0,
  alignment: "left",
  color: "#000000",
};

/**
 * TextTool creates and edits paper.PointText items.
 *
 * Design constraints:
 *  - Text is NEVER rasterised by this tool. It remains a live paper.PointText
 *    so it can be re-edited, reflowed, and exported as SVG text at any time.
 *  - Font metrics (tracking / leading) are applied through paper.js style
 *    properties where the API exposes them, and through custom data attributes
 *    for values paper.js does not natively expose (tracking).
 */
export class TextTool {
  private scope: paper.PaperScope | null = null;
  private tool: paper.Tool | null = null;
  private activeText: paper.PointText | null = null;
  private style: TextStyle = { ...DEFAULT_STYLE };

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  activate(paperScope: paper.PaperScope): void {
    this.scope = paperScope;
    this.scope.activate();

    this.tool = new paper.Tool();
    this.tool.onMouseDown = (event: paper.ToolEvent) => this.onMouseDown(event);
    this.tool.activate();
  }

  deactivate(): void {
    this.commitActiveText();
    if (this.tool) {
      this.tool.remove();
      this.tool = null;
    }
  }

  // -----------------------------------------------------------------------
  // Style setters
  // -----------------------------------------------------------------------

  setFontFamily(fontFamily: string): void {
    this.style = { ...this.style, fontFamily };
    this.applyStyleToActive();
  }

  setFontSize(fontSize: number): void {
    this.style = { ...this.style, fontSize };
    this.applyStyleToActive();
  }

  setFontWeight(fontWeight: string): void {
    this.style = { ...this.style, fontWeight };
    this.applyStyleToActive();
  }

  setFontStyle(fontStyle: string): void {
    this.style = { ...this.style, fontStyle };
    this.applyStyleToActive();
  }

  setTracking(tracking: number): void {
    this.style = { ...this.style, tracking };
    this.applyStyleToActive();
  }

  setLeading(leading: number): void {
    this.style = { ...this.style, leading };
    this.applyStyleToActive();
  }

  setAlignment(alignment: TextAlignment): void {
    this.style = { ...this.style, alignment };
    this.applyStyleToActive();
  }

  setColor(color: string): void {
    this.style = { ...this.style, color };
    this.applyStyleToActive();
  }

  setStyle(partial: Partial<TextStyle>): void {
    this.style = { ...this.style, ...partial };
    this.applyStyleToActive();
  }

  // -----------------------------------------------------------------------
  // Text content
  // -----------------------------------------------------------------------

  setContent(content: string): void {
    if (this.activeText) {
      this.activeText.content = content;
    }
  }

  /**
   * Programmatically place a text item at a point and optionally supply
   * initial content.  Useful for undo/redo replay.
   */
  placeText(x: number, y: number, content = "Text"): paper.PointText {
    if (!this.scope) throw new Error("TextTool not activated");
    this.scope.activate();

    const text = new paper.PointText(new paper.Point(x, y));
    text.content = content;
    this.activeText = text;
    this.applyStyleToActive();
    return text;
  }

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  private onMouseDown(event: paper.ToolEvent): void {
    if (!this.scope) return;
    this.scope.activate();

    // Commit any previously active text item
    this.commitActiveText();

    // Check if the user clicked an existing PointText to edit it
    const hit = this.scope.project.hitTest(event.point, {
      fill: true,
      stroke: false,
      tolerance: 4,
    });

    if (hit && hit.item instanceof paper.PointText) {
      this.activeText = hit.item;
    } else {
      // Create a new PointText at the click position
      this.activeText = new paper.PointText(event.point);
      this.activeText.content = "";
      this.applyStyleToActive();
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private applyStyleToActive(): void {
    if (!this.activeText) return;
    this.applyStyleToText(this.activeText, this.style);
  }

  private applyStyleToText(text: paper.PointText, s: TextStyle): void {
    text.fontFamily = s.fontFamily;
    text.fontSize = s.fontSize;
    text.fontWeight = s.fontWeight;
    text.fillColor = new paper.Color(s.color);

    // Justification maps to paper.js "justification"
    text.justification =
      s.alignment === "center" ? "center" : s.alignment === "right" ? "right" : "left";

    // Leading (line-height)
    const leading = s.leading > 0 ? s.leading : s.fontSize * 1.2;
    text.leading = leading;

    // paper.js does not expose letter-spacing natively; store it as data
    // so downstream SVG export can read it and inject a CSS style attribute.
    text.data = {
      ...text.data,
      tracking: s.tracking,
      fontStyle: s.fontStyle,
    };
  }

  private commitActiveText(): void {
    // If the active text has no content, remove it from the scene
    if (this.activeText && this.activeText.content.trim() === "") {
      this.activeText.remove();
    }
    this.activeText = null;
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getActiveText(): paper.PointText | null {
    return this.activeText;
  }

  getStyle(): Readonly<TextStyle> {
    return this.style;
  }
}
