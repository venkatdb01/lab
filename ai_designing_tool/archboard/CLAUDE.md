# ArchBoard — project rules

Source of truth for design: `../archboard-development-plan.md` (HLD §16, LLD §17).

## Non-negotiables
- The diagram is JSON. Mermaid/PNG/SVG are exports only.
- All changes, human or AI, go through the pure reducer `applyOp` in `lib/graph/reducer.ts`.
- AI edits via small tools, never full regeneration. `replaceDiagram` only on an empty canvas.
- Every tool call is Zod-validated; errors return a model-readable `hint`.
- Anthropic key is server-side only.
- TypeScript strict mode.

## Conventions
- Model IDs live in `lib/ai/models.ts` only.
- Reducer changes require tests in `tests/graph/reducer.test.ts`.
- Record significant design decisions as ADRs in `docs/adr/`.
