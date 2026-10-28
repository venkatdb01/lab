import { create } from "zustand";
import { applyOp, emptyDiagram } from "@/lib/graph/reducer";
import type { Diagram, Op, OpError } from "@/lib/graph/types";

interface DiagramState {
  diagram: Diagram;
  past: Diagram[];
  future: Diagram[];
  /** Applies an op; returns an error instead of throwing. */
  apply: (op: Op) => OpError | null;
  undo: () => void;
  redo: () => void;
  load: (d: Diagram) => void;
}

export const useDiagram = create<DiagramState>((set, get) => ({
  diagram: emptyDiagram(),
  past: [],
  future: [],

  apply: (op) => {
    const { diagram, past } = get();
    const r = applyOp(diagram, op);
    if (!r.ok) return r.error;
    set({ diagram: r.value, past: [...past, diagram], future: [] });
    return null;
  },

  undo: () => {
    const { diagram, past, future } = get();
    const prev = past.at(-1);
    if (!prev) return;
    set({ diagram: prev, past: past.slice(0, -1), future: [diagram, ...future] });
  },

  redo: () => {
    const { diagram, past, future } = get();
    const [next, ...rest] = future;
    if (!next) return;
    set({ diagram: next, past: [...past, diagram], future: rest });
  },

  load: (d) => set({ diagram: d, past: [], future: [] }),
}));
