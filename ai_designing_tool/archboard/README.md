# ArchBoard

An architecture-review partner that happens to draw. Describe a system in plain language; an AI architect draws it as an editable diagram, asks sharp questions, and records every decision until you are confident in the design.

Full plan: [../archboard-development-plan.md](../archboard-development-plan.md)

## Status
Phase 0 — foundations. Canvas, reducer and streaming chat route work. shadcn/ui is not set up yet.

## Run
```
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
npm test                     # reducer tests
```

## Layout
- `app/` — routes and API handlers
- `components/` — canvas, chat, decisions, confidence UI
- `lib/graph/` — diagram types, Zod schemas, pure reducer, layout, exports
- `lib/ai/` — prompts, tools, context builder, orchestrator
- `lib/db/` — Drizzle schema and queries
- `store/` — Zustand diagram store with undo/redo
- `tests/` — unit and integration tests
- `evals/` — prompt regression scenarios
- `docs/` — design notes and ADRs
