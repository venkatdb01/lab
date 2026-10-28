export type Mode = "architect" | "reviewer";

// Phase 0 placeholder; the full behaviours (plan §5.3) arrive in Phase 1.
export function buildSystemPrompt(mode: Mode = "architect"): string {
  const role =
    mode === "reviewer"
      ? "You are a senior architect reviewing a system design."
      : "You are a senior software architect helping a user design a system.";
  return `${role} Be concise.`;
}
