export type NodeKind =
  | "service" | "database" | "queue" | "cache" | "storage" | "api"
  | "client" | "external" | "function" | "job" | "generic";

export interface DiagramNode {
  id: string;
  label: string;
  kind: NodeKind;
  tech?: string;
  groupId?: string;
  position?: { x: number; y: number };
  notes?: string;
  tags?: string[];
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: "solid" | "dashed";
  direction?: "one" | "both";
}

export interface DiagramGroup {
  id: string;
  label: string;
  parentId?: string;
}

export interface Decision {
  id: string;
  title: string;
  decision: string;
  reasoning: string;
  alternatives: string[];
  relatedNodeIds: string[];
  status: "proposed" | "accepted" | "superseded";
  createdAt: string;
}

export interface OpenQuestion {
  id: string;
  question: string;
  why?: string;
  options?: string[];
  blocking: boolean;
  resolved: boolean;
  answer?: string;
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  decisions: Decision[];
  openQuestions: OpenQuestion[];
  confidence: number;
  blockers: string[];
}

export type Op =
  | { type: "addNode"; node: DiagramNode }
  | { type: "updateNode"; id: string; patch: Partial<Omit<DiagramNode, "id">> }
  | { type: "removeNode"; id: string }
  | { type: "addEdge"; edge: DiagramEdge }
  | { type: "removeEdge"; id: string }
  | { type: "addGroup"; group: DiagramGroup; nodeIds: string[] }
  | { type: "moveNode"; id: string; position: { x: number; y: number } }
  | { type: "recordDecision"; decision: Decision }
  | { type: "setConfidence"; score: number; blockers: string[] }
  | { type: "addQuestion"; question: OpenQuestion }
  | { type: "resolveQuestion"; id: string; answer?: string }
  | {
      type: "replaceDiagram";
      nodes: DiagramNode[];
      edges: DiagramEdge[];
      groups: DiagramGroup[];
    };

export type OpErrorCode =
  | "DUPLICATE_ID"
  | "UNKNOWN_NODE"
  | "UNKNOWN_EDGE"
  | "UNKNOWN_QUESTION"
  | "UNKNOWN_GROUP"
  | "CANVAS_NOT_EMPTY";

export interface OpError {
  code: OpErrorCode;
  message: string;
  /** Written for the model: tells it how to recover. */
  hint?: string;
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
