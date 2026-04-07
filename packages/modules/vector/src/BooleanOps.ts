export type BooleanOpType = "union" | "subtract" | "intersect" | "exclude" | "divide";

/**
 * Perform a boolean operation on two paper.js PathItems.
 *
 * Delegates directly to the corresponding paper.PathItem static methods:
 *  - unite      → union
 *  - subtract   → subtract (path1 minus path2)
 *  - intersect  → intersect
 *  - exclude    → exclude (XOR)
 *  - divide     → divide (split path1 at path2 boundaries)
 *
 * The original paths are left untouched; the caller is responsible for
 * removing or repositioning them as needed.
 *
 * @param op    The boolean operation to apply.
 * @param path1 The base path (subject).
 * @param path2 The tool path (clip / cutter).
 * @returns     A new PathItem representing the result.
 */
export function performBooleanOp(
  op: BooleanOpType,
  path1: paper.PathItem,
  path2: paper.PathItem,
): paper.PathItem {
  switch (op) {
    case "union":
      return path1.unite(path2);

    case "subtract":
      return path1.subtract(path2);

    case "intersect":
      return path1.intersect(path2);

    case "exclude":
      return path1.exclude(path2);

    case "divide":
      return path1.divide(path2);

    default: {
      // Exhaustive guard – TypeScript will flag unhandled ops at compile time
      const _exhaustive: never = op;
      throw new Error(`Unknown boolean operation: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Convenience wrapper that also removes the two source paths from the scene
 * and inserts the result in their place (above path2).
 */
export function applyBooleanOp(
  op: BooleanOpType,
  path1: paper.PathItem,
  path2: paper.PathItem,
): paper.PathItem {
  const result = performBooleanOp(op, path1, path2);

  // Inherit visual style from path1
  result.strokeColor = path1.strokeColor;
  result.strokeWidth = path1.strokeWidth;
  result.fillColor = path1.fillColor;

  // Insert the result above the topmost source item
  const insertAbove = path1.index > path2.index ? path1 : path2;
  result.insertAbove(insertAbove);

  path1.remove();
  path2.remove();

  return result;
}
