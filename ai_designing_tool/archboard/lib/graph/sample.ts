import { applyOps, emptyDiagram } from "./reducer";
import type { Diagram, Op } from "./types";

const ops: Op[] = [
  { type: "addNode", node: { id: "n_web", label: "Web App", kind: "client", position: { x: 0, y: 80 } } },
  { type: "addNode", node: { id: "n_api", label: "Orders API", kind: "api", tech: "Node.js", position: { x: 250, y: 80 } } },
  { type: "addNode", node: { id: "n_db", label: "Orders DB", kind: "database", tech: "PostgreSQL", position: { x: 500, y: 0 } } },
  { type: "addNode", node: { id: "n_queue", label: "Order Events", kind: "queue", tech: "Kafka", position: { x: 500, y: 160 } } },
  { type: "addNode", node: { id: "n_worker", label: "Fulfilment Worker", kind: "job", position: { x: 750, y: 160 } } },
  { type: "addEdge", edge: { id: "e1", source: "n_web", target: "n_api", label: "REST" } },
  { type: "addEdge", edge: { id: "e2", source: "n_api", target: "n_db", label: "SQL" } },
  { type: "addEdge", edge: { id: "e3", source: "n_api", target: "n_queue", label: "publishes" } },
  { type: "addEdge", edge: { id: "e4", source: "n_queue", target: "n_worker", label: "consumes", style: "dashed" } },
];

export function sampleDiagram(): Diagram {
  const r = applyOps(emptyDiagram(), ops);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
}
