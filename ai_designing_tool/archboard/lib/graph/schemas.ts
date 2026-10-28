import { z } from "zod";

export const NodeKindSchema = z.enum([
  "service", "database", "queue", "cache", "storage", "api",
  "client", "external", "function", "job", "generic",
]);

const PositionSchema = z.object({ x: z.number(), y: z.number() });

export const DiagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: NodeKindSchema,
  tech: z.string().optional(),
  groupId: z.string().optional(),
  position: PositionSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DiagramEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  style: z.enum(["solid", "dashed"]).optional(),
  direction: z.enum(["one", "both"]).optional(),
});

export const DiagramGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  parentId: z.string().optional(),
});

export const DecisionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  decision: z.string(),
  reasoning: z.string(),
  alternatives: z.array(z.string()),
  relatedNodeIds: z.array(z.string()),
  status: z.enum(["proposed", "accepted", "superseded"]),
  createdAt: z.string(),
});

export const OpenQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  why: z.string().optional(),
  options: z.array(z.string()).optional(),
  blocking: z.boolean(),
  resolved: z.boolean(),
  answer: z.string().optional(),
});

export const DiagramSchema = z.object({
  nodes: z.array(DiagramNodeSchema),
  edges: z.array(DiagramEdgeSchema),
  groups: z.array(DiagramGroupSchema),
  decisions: z.array(DecisionSchema),
  openQuestions: z.array(OpenQuestionSchema),
  confidence: z.number().min(0).max(100),
  blockers: z.array(z.string()),
});

export const OpSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("addNode"), node: DiagramNodeSchema }),
  z.object({
    type: z.literal("updateNode"),
    id: z.string(),
    patch: DiagramNodeSchema.omit({ id: true }).partial(),
  }),
  z.object({ type: z.literal("removeNode"), id: z.string() }),
  z.object({ type: z.literal("addEdge"), edge: DiagramEdgeSchema }),
  z.object({ type: z.literal("removeEdge"), id: z.string() }),
  z.object({
    type: z.literal("addGroup"),
    group: DiagramGroupSchema,
    nodeIds: z.array(z.string()),
  }),
  z.object({ type: z.literal("moveNode"), id: z.string(), position: PositionSchema }),
  z.object({ type: z.literal("recordDecision"), decision: DecisionSchema }),
  z.object({
    type: z.literal("setConfidence"),
    score: z.number(),
    blockers: z.array(z.string()),
  }),
  z.object({ type: z.literal("addQuestion"), question: OpenQuestionSchema }),
  z.object({
    type: z.literal("resolveQuestion"),
    id: z.string(),
    answer: z.string().optional(),
  }),
  z.object({
    type: z.literal("replaceDiagram"),
    nodes: z.array(DiagramNodeSchema),
    edges: z.array(DiagramEdgeSchema),
    groups: z.array(DiagramGroupSchema),
  }),
]);
