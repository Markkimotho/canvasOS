import { enablePatches, applyPatches, produce, type Patch } from "immer";

enablePatches();

export interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
  description: string;
  timestamp: number;
}

const MAX_HISTORY = 500;

export class HistoryManager<T extends object> {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private onStateChange: (next: T) => void;
  private currentState: T;

  constructor(initialState: T, onStateChange: (next: T) => void) {
    this.currentState = initialState;
    this.onStateChange = onStateChange;
  }

  /** Apply a mutation and record undo/redo patches. */
  record(description: string, mutate: (draft: T) => void): T {
    let patches: Patch[] = [];
    let inversePatches: Patch[] = [];

    const nextState = produce(
      this.currentState,
      (draft: T) => {
        mutate(draft);
      },
      (p, ip) => {
        patches = p;
        inversePatches = ip;
      },
    );

    if (patches.length === 0) return this.currentState;

    this.past.push({ patches, inversePatches, description, timestamp: Date.now() });
    if (this.past.length > MAX_HISTORY) this.past.shift();
    this.future = [];

    this.currentState = nextState;
    this.onStateChange(nextState);
    return nextState;
  }

  undo(): boolean {
    const entry = this.past.pop();
    if (!entry) return false;

    const nextState = applyPatches(this.currentState, entry.inversePatches);
    this.future.unshift(entry);
    this.currentState = nextState as T;
    this.onStateChange(nextState as T);
    return true;
  }

  redo(): boolean {
    const entry = this.future.shift();
    if (!entry) return false;

    const nextState = applyPatches(this.currentState, entry.patches);
    this.past.push(entry);
    this.currentState = nextState as T;
    this.onStateChange(nextState as T);
    return true;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getUndoLabel(): string | undefined {
    return this.past[this.past.length - 1]?.description;
  }

  getRedoLabel(): string | undefined {
    return this.future[0]?.description;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }

  getState(): T {
    return this.currentState;
  }

  setState(state: T): void {
    this.currentState = state;
    this.past = [];
    this.future = [];
  }
}
