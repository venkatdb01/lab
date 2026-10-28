import { describe, expect, it } from "vitest";
import { applyOp, applyOps, emptyDiagram } from "@/lib/graph/reducer";
import type { Diagram, DiagramNode } from "@/lib/graph/types";

const node = (id: string, extra: Partial<DiagramNode> = {}): DiagramNode => ({
  id,
  label: id,
  kind: "service",
  ...extra,
});

const withNodes = (...ids: string[]): Diagram => ({
  ...emptyDiagram(),
  nodes: ids.map((i) => node(i)),
});

const val = (r: ReturnType<typeof applyOp>) => {
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

describe("applyOp", () => {
  it("addNode appends a node without mutating the input", () => {
    const before = emptyDiagram();
    const after = val(applyOp(before, { type: "addNode", node: node("a") }));
    expect(after.nodes).toHaveLength(1);
    expect(before.nodes).toHaveLength(0);
  });

  it("addNode rejects a duplicate id", () => {
    const r = applyOp(withNodes("a"), { type: "addNode", node: node("a") });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("DUPLICATE_ID");
  });

  it("updateNode patches fields and keeps the rest", () => {
    const d = val(applyOp(withNodes("a"), { type: "updateNode", id: "a", patch: { tech: "Kafka" } }));
    expect(d.nodes[0]).toMatchObject({ id: "a", label: "a", tech: "Kafka" });
  });

  it("updateNode on unknown id returns UNKNOWN_NODE with known ids in the hint", () => {
    const r = applyOp(withNodes("a", "b"), { type: "updateNode", id: "zzz", patch: {} });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("UNKNOWN_NODE");
      expect(r.error.hint).toContain("a, b");
    }
  });

  it("addEdge connects existing nodes", () => {
    const d = val(
      applyOp(withNodes("a", "b"), { type: "addEdge", edge: { id: "e1", source: "a", target: "b" } }),
    );
    expect(d.edges).toHaveLength(1);
  });

  it("addEdge with an unknown target returns UNKNOWN_NODE", () => {
    const r = applyOp(withNodes("a"), { type: "addEdge", edge: { id: "e1", source: "a", target: "x" } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNKNOWN_NODE");
  });

  it("removeNode cascades to edges", () => {
    const start = val(
      applyOps(withNodes("a", "b", "c"), [
        { type: "addEdge", edge: { id: "e1", source: "a", target: "b" } },
        { type: "addEdge", edge: { id: "e2", source: "b", target: "c" } },
      ]),
    );
    const d = val(applyOp(start, { type: "removeNode", id: "b" }));
    expect(d.nodes.map((n) => n.id)).toEqual(["a", "c"]);
    expect(d.edges).toHaveLength(0);
  });

  it("addGroup assigns groupId to member nodes", () => {
    const d = val(
      applyOp(withNodes("a", "b"), {
        type: "addGroup",
        group: { id: "g1", label: "VPC" },
        nodeIds: ["a"],
      }),
    );
    expect(d.nodes.find((n) => n.id === "a")?.groupId).toBe("g1");
    expect(d.nodes.find((n) => n.id === "b")?.groupId).toBeUndefined();
  });

  it("moveNode sets the position", () => {
    const d = val(applyOp(withNodes("a"), { type: "moveNode", id: "a", position: { x: 5, y: 7 } }));
    expect(d.nodes[0].position).toEqual({ x: 5, y: 7 });
  });

  it("replaceDiagram works on an empty canvas and is rejected otherwise", () => {
    const op = { type: "replaceDiagram" as const, nodes: [node("a")], edges: [], groups: [] };
    expect(applyOp(emptyDiagram(), op).ok).toBe(true);
    const r = applyOp(withNodes("x"), op);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("CANVAS_NOT_EMPTY");
  });

  it("setConfidence is clamped by unresolved blocking questions", () => {
    const d = val(
      applyOps(emptyDiagram(), [
        { type: "addQuestion", question: { id: "q1", question: "?", blocking: true, resolved: false } },
        { type: "addQuestion", question: { id: "q2", question: "?", blocking: true, resolved: false } },
        { type: "setConfidence", score: 95, blockers: ["q1", "q2"] },
      ]),
    );
    expect(d.confidence).toBe(80);
    const resolved = val(applyOps(d, [
      { type: "resolveQuestion", id: "q1" },
      { type: "resolveQuestion", id: "q2" },
      { type: "setConfidence", score: 95, blockers: [] },
    ]));
    expect(resolved.confidence).toBe(95);
  });

  it("applyOps stops at the first failing op", () => {
    const r = applyOps(emptyDiagram(), [
      { type: "addNode", node: node("a") },
      { type: "removeNode", id: "nope" },
      { type: "addNode", node: node("b") },
    ]);
    expect(r.ok).toBe(false);
  });
});
