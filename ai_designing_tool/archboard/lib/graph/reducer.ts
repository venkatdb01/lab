import type { Diagram, Op, OpError, Result } from "./types";

export const emptyDiagram = (): Diagram => ({
  nodes: [],
  edges: [],
  groups: [],
  decisions: [],
  openQuestions: [],
  confidence: 0,
  blockers: [],
});

const ok = (value: Diagram): Result<Diagram, OpError> => ({ ok: true, value });
const fail = (error: OpError): Result<Diagram, OpError> => ({ ok: false, error });

const knownNodeIds = (d: Diagram) => d.nodes.map((n) => n.id).join(", ") || "(none)";

const maxConfidence = (d: Diagram) =>
  100 - 10 * d.openQuestions.filter((q) => q.blocking && !q.resolved).length;

/** Pure: never mutates `d`. */
export function applyOp(d: Diagram, op: Op): Result<Diagram, OpError> {
  switch (op.type) {
    case "addNode": {
      if (d.nodes.some((n) => n.id === op.node.id)) {
        return fail({
          code: "DUPLICATE_ID",
          message: `Node id '${op.node.id}' already exists`,
          hint: "Pick a different id.",
        });
      }
      return ok({ ...d, nodes: [...d.nodes, op.node] });
    }

    case "updateNode": {
      if (!d.nodes.some((n) => n.id === op.id)) return unknownNode(d, op.id);
      return ok({
        ...d,
        nodes: d.nodes.map((n) => (n.id === op.id ? { ...n, ...op.patch } : n)),
      });
    }

    case "removeNode": {
      if (!d.nodes.some((n) => n.id === op.id)) return unknownNode(d, op.id);
      return ok({
        ...d,
        nodes: d.nodes.filter((n) => n.id !== op.id),
        edges: d.edges.filter((e) => e.source !== op.id && e.target !== op.id),
        decisions: d.decisions.map((x) => ({
          ...x,
          relatedNodeIds: x.relatedNodeIds.filter((id) => id !== op.id),
        })),
      });
    }

    case "addEdge": {
      if (d.edges.some((e) => e.id === op.edge.id)) {
        return fail({
          code: "DUPLICATE_ID",
          message: `Edge id '${op.edge.id}' already exists`,
          hint: "Pick a different id.",
        });
      }
      for (const id of [op.edge.source, op.edge.target]) {
        if (!d.nodes.some((n) => n.id === id)) return unknownNode(d, id);
      }
      return ok({ ...d, edges: [...d.edges, op.edge] });
    }

    case "removeEdge": {
      if (!d.edges.some((e) => e.id === op.id)) {
        return fail({
          code: "UNKNOWN_EDGE",
          message: `Edge '${op.id}' not found`,
        });
      }
      return ok({ ...d, edges: d.edges.filter((e) => e.id !== op.id) });
    }

    case "addGroup": {
      if (d.groups.some((g) => g.id === op.group.id)) {
        return fail({
          code: "DUPLICATE_ID",
          message: `Group id '${op.group.id}' already exists`,
          hint: "Pick a different id.",
        });
      }
      if (op.group.parentId && !d.groups.some((g) => g.id === op.group.parentId)) {
        return fail({
          code: "UNKNOWN_GROUP",
          message: `Parent group '${op.group.parentId}' not found`,
        });
      }
      for (const id of op.nodeIds) {
        if (!d.nodes.some((n) => n.id === id)) return unknownNode(d, id);
      }
      return ok({
        ...d,
        groups: [...d.groups, op.group],
        nodes: d.nodes.map((n) =>
          op.nodeIds.includes(n.id) ? { ...n, groupId: op.group.id } : n,
        ),
      });
    }

    case "moveNode": {
      if (!d.nodes.some((n) => n.id === op.id)) return unknownNode(d, op.id);
      return ok({
        ...d,
        nodes: d.nodes.map((n) =>
          n.id === op.id ? { ...n, position: op.position } : n,
        ),
      });
    }

    case "recordDecision": {
      const exists = d.decisions.some((x) => x.id === op.decision.id);
      return ok({
        ...d,
        decisions: exists
          ? d.decisions.map((x) => (x.id === op.decision.id ? op.decision : x))
          : [...d.decisions, op.decision],
      });
    }

    case "setConfidence": {
      const cap = maxConfidence(d);
      return ok({
        ...d,
        confidence: Math.max(0, Math.min(op.score, cap, 100)),
        blockers: op.blockers,
      });
    }

    case "addQuestion": {
      if (d.openQuestions.some((q) => q.id === op.question.id)) {
        return fail({
          code: "DUPLICATE_ID",
          message: `Question id '${op.question.id}' already exists`,
        });
      }
      const next = { ...d, openQuestions: [...d.openQuestions, op.question] };
      return ok({ ...next, confidence: Math.min(next.confidence, maxConfidence(next)) });
    }

    case "resolveQuestion": {
      if (!d.openQuestions.some((q) => q.id === op.id)) {
        return fail({
          code: "UNKNOWN_QUESTION",
          message: `Question '${op.id}' not found`,
        });
      }
      return ok({
        ...d,
        openQuestions: d.openQuestions.map((q) =>
          q.id === op.id ? { ...q, resolved: true, answer: op.answer } : q,
        ),
      });
    }

    case "replaceDiagram": {
      if (d.nodes.length > 0) {
        return fail({
          code: "CANVAS_NOT_EMPTY",
          message: "replaceDiagram is only allowed on an empty canvas",
          hint: "Use addNode / addEdge / updateNode instead.",
        });
      }
      return ok({ ...d, nodes: op.nodes, edges: op.edges, groups: op.groups });
    }
  }
}

/** Applies ops in order; stops at the first failure. */
export function applyOps(d: Diagram, ops: Op[]): Result<Diagram, OpError> {
  let cur = d;
  for (const op of ops) {
    const r = applyOp(cur, op);
    if (!r.ok) return r;
    cur = r.value;
  }
  return ok(cur);
}

function unknownNode(d: Diagram, id: string): Result<Diagram, OpError> {
  return fail({
    code: "UNKNOWN_NODE",
    message: `Node '${id}' not found`,
    hint: `Known node ids: ${knownNodeIds(d)}`,
  });
}
