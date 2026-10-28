"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { DiagramNode } from "@/lib/graph/types";

const KIND_STYLE: Record<DiagramNode["kind"], string> = {
  service: "border-blue-400 bg-blue-50",
  database: "border-emerald-400 bg-emerald-50",
  queue: "border-amber-400 bg-amber-50",
  cache: "border-red-400 bg-red-50",
  storage: "border-teal-400 bg-teal-50",
  api: "border-indigo-400 bg-indigo-50",
  client: "border-slate-400 bg-slate-50",
  external: "border-zinc-400 bg-zinc-100",
  function: "border-purple-400 bg-purple-50",
  job: "border-orange-400 bg-orange-50",
  generic: "border-gray-300 bg-white",
};

export function DiagramNodeView({ data }: NodeProps) {
  const n = data as unknown as DiagramNode;
  return (
    <div className={`rounded-md border-2 px-3 py-2 text-sm text-slate-900 shadow-sm ${KIND_STYLE[n.kind]}`}>
      <Handle type="target" position={Position.Left} />
      <div className="font-medium">{n.label}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">
        {n.kind}
        {n.tech ? ` · ${n.tech}` : ""}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
