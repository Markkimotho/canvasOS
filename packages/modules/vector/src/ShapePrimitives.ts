import paper from "paper";

// ---------------------------------------------------------------------------
// Default style helpers
// ---------------------------------------------------------------------------

function applyDefaultStyle(item: paper.PathItem): void {
  item.strokeColor = new paper.Color("#000000");
  item.strokeWidth = 1;
  item.fillColor = new paper.Color("rgba(0,0,0,0)");
}

// ---------------------------------------------------------------------------
// Rectangle
// ---------------------------------------------------------------------------

/**
 * Create an axis-aligned rectangle.
 */
export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
): paper.Path.Rectangle {
  const rect = new paper.Path.Rectangle(
    new paper.Rectangle(new paper.Point(x, y), new paper.Size(width, height)),
  );
  applyDefaultStyle(rect);
  return rect;
}

// ---------------------------------------------------------------------------
// Rounded Rectangle
// ---------------------------------------------------------------------------

/**
 * Create a rounded rectangle with independent corner radii.
 */
export function createRoundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number,
): paper.Path.Rectangle {
  const rect = new paper.Path.Rectangle(
    new paper.Rectangle(new paper.Point(x, y), new paper.Size(width, height)),
    new paper.Size(cornerRadius, cornerRadius),
  );
  applyDefaultStyle(rect);
  return rect;
}

// ---------------------------------------------------------------------------
// Ellipse
// ---------------------------------------------------------------------------

/**
 * Create an ellipse inscribed in the bounding box at (x, y) with given size.
 */
export function createEllipse(
  x: number,
  y: number,
  width: number,
  height: number,
): paper.Path.Ellipse {
  const ellipse = new paper.Path.Ellipse(
    new paper.Rectangle(new paper.Point(x, y), new paper.Size(width, height)),
  );
  applyDefaultStyle(ellipse);
  return ellipse;
}

// ---------------------------------------------------------------------------
// Regular Polygon
// ---------------------------------------------------------------------------

/**
 * Create a regular n-sided polygon centred at (cx, cy) with circumradius r.
 */
export function createPolygon(
  cx: number,
  cy: number,
  r: number,
  sides: number,
): paper.Path.RegularPolygon {
  const polygon = new paper.Path.RegularPolygon(
    new paper.Point(cx, cy),
    Math.max(3, Math.round(sides)),
    r,
  );
  applyDefaultStyle(polygon);
  return polygon;
}

// ---------------------------------------------------------------------------
// Star
// ---------------------------------------------------------------------------

/**
 * Create a star with `points` points, outer radius r1, inner radius r2.
 * Fully parametric — built from paper.Path so it remains re-editable.
 */
export function createStar(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  points: number,
): paper.Path {
  const n = Math.max(2, Math.round(points));
  const segments: paper.Point[] = [];
  const step = Math.PI / n;

  for (let i = 0; i < 2 * n; i++) {
    const angle = i * step - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    segments.push(new paper.Point(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r));
  }

  const path = new paper.Path({ segments, closed: true });
  applyDefaultStyle(path);
  return path;
}

// ---------------------------------------------------------------------------
// Line
// ---------------------------------------------------------------------------

/**
 * Create a straight open path between two points.
 */
export function createLine(x1: number, y1: number, x2: number, y2: number): paper.Path.Line {
  const line = new paper.Path.Line(new paper.Point(x1, y1), new paper.Point(x2, y2));
  line.strokeColor = new paper.Color("#000000");
  line.strokeWidth = 1;
  return line;
}

// ---------------------------------------------------------------------------
// Arrow
// ---------------------------------------------------------------------------

/**
 * Create an arrow from (x1,y1) to (x2,y2).
 * The arrowhead is a filled triangle; the shaft is an open path.
 * Both are grouped so the result behaves as a single item.
 *
 * @param headLength  Length of the arrowhead triangle in px (default 12)
 * @param headWidth   Half-width of the arrowhead base in px (default 6)
 */
export function createArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headLength = 12,
  headWidth = 6,
): paper.Group {
  const start = new paper.Point(x1, y1);
  const end = new paper.Point(x2, y2);

  const direction = end.subtract(start).normalize();
  const perp = new paper.Point(-direction.y, direction.x);

  // Arrowhead tip
  const tip = end;
  // Base of the arrowhead (stepped back along the shaft)
  const base = end.subtract(direction.multiply(headLength));
  const baseLeft = base.add(perp.multiply(headWidth));
  const baseRight = base.subtract(perp.multiply(headWidth));

  // Shaft stops where the arrowhead base begins
  const shaft = new paper.Path.Line(start, base);
  shaft.strokeColor = new paper.Color("#000000");
  shaft.strokeWidth = 1;

  // Arrowhead triangle
  const head = new paper.Path({
    segments: [tip, baseLeft, baseRight],
    closed: true,
  });
  head.fillColor = new paper.Color("#000000");
  head.strokeColor = null;

  const group = new paper.Group([shaft, head]);
  return group;
}
