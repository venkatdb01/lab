"use client";

import { useEffect } from "react";
import { Canvas } from "@/components/canvas/Canvas";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { sampleDiagram } from "@/lib/graph/sample";
import { useDiagram } from "@/store/diagram";

// Phase 0 playground: drag nodes on the left, stream a Claude reply on the right.
export default function Home() {
  const load = useDiagram((s) => s.load);
  const undo = useDiagram((s) => s.undo);
  const redo = useDiagram((s) => s.redo);

  useEffect(() => load(sampleDiagram()), [load]);

  return (
    <main className="flex h-screen bg-white text-slate-900">
      <section className="relative flex-1">
        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <button className="rounded border bg-white px-2 py-1 text-xs" onClick={undo}>Undo</button>
          <button className="rounded border bg-white px-2 py-1 text-xs" onClick={redo}>Redo</button>
        </div>
        <Canvas />
      </section>
      <aside className="w-96 border-l border-slate-300">
        <ChatPanel />
      </aside>
    </main>
  );
}
