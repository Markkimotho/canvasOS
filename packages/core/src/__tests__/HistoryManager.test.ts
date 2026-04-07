import { describe, it, expect, beforeEach } from "vitest";
import { HistoryManager } from "../history/HistoryManager.js";

interface TestState {
  count: number;
  name: string;
}

describe("HistoryManager", () => {
  let manager: HistoryManager<TestState>;
  let current: TestState;

  beforeEach(() => {
    current = { count: 0, name: "initial" };
    manager = new HistoryManager(current, (s) => {
      current = s;
    });
  });

  it("records and applies mutations", () => {
    manager.record("increment", (draft) => {
      draft.count += 1;
    });
    expect(current.count).toBe(1);
  });

  it("undoes last mutation", () => {
    manager.record("increment", (draft) => {
      draft.count += 1;
    });
    manager.record("rename", (draft) => {
      draft.name = "changed";
    });

    expect(current.name).toBe("changed");
    manager.undo();
    expect(current.name).toBe("initial");
    expect(current.count).toBe(1);
  });

  it("redoes after undo", () => {
    manager.record("increment", (draft) => {
      draft.count = 5;
    });
    manager.undo();
    expect(current.count).toBe(0);
    manager.redo();
    expect(current.count).toBe(5);
  });

  it("clears future on new record after undo", () => {
    manager.record("a", (d) => {
      d.count = 1;
    });
    manager.record("b", (d) => {
      d.count = 2;
    });
    manager.undo();
    manager.record("c", (d) => {
      d.count = 99;
    });
    expect(manager.canRedo()).toBe(false);
    expect(current.count).toBe(99);
  });

  it("respects MAX_HISTORY of 500", () => {
    for (let i = 0; i < 600; i++) {
      manager.record("inc", (d) => {
        d.count++;
      });
    }
    let undoCount = 0;
    while (manager.canUndo()) {
      manager.undo();
      undoCount++;
    }
    expect(undoCount).toBeLessThanOrEqual(500);
  });

  it("canUndo / canRedo", () => {
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(false);
    manager.record("x", (d) => {
      d.count = 1;
    });
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);
    manager.undo();
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(true);
  });

  it("getUndoLabel / getRedoLabel", () => {
    manager.record("paint stroke", (d) => {
      d.count++;
    });
    expect(manager.getUndoLabel()).toBe("paint stroke");
    manager.undo();
    expect(manager.getRedoLabel()).toBe("paint stroke");
  });
});
