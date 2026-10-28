"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDiagram } from "@/store/diagram";
import type { Diagram } from "@/lib/graph/types";
import { DiagramNodeView } from "./DiagramNodeView";

const nodeTypes = { diagram: DiagramNodeView };

/** Pure projection: React Flow never owns the graph. */
export function toFlow(d: Diagram): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: d.nodes.map((n, i) => ({
      id: n.id,
      type: "diagram",
      position: n.position ?? { x: (i % 4) * 220, y: Math.floor(i / 4) * 140 },
      data: n as unknown as Record<string, unknown>,
    })),
    edges: d.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.style === "dashed",
      style: e.style === "dashed" ? { strokeDasharray: "5 4" } : undefined,
    })),
  };
}

export function Canvas() {
  const diagram = useDiagram((s) => s.diagram);
  const apply = useDiagram((s) => s.apply);
  const flow = useMemo(() => toFlow(diagram), [diagram]);

  // Local copy only so React Flow can render mid-drag positions.
  const [nodes, setNodes] = useState<Node[]>(flow.nodes);
  const [syncedFrom, setSyncedFrom] = useState(flow.nodes);
  if (syncedFrom !== flow.nodes) {
    setSyncedFrom(flow.nodes);
    setNodes(flow.nodes);
  }

  const onNodesChange = (changes: NodeChange[]) =>
    setNodes((ns) => applyNodeChanges(changes, ns));

  return (
    <ReactFlow
      nodes={nodes}
      edges={flow.edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeDragStop={(_, node) =>
        apply({ type: "moveNode", id: node.id, position: node.position })
      }
      fitView
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}
