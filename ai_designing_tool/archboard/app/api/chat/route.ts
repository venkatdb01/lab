import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { z } from "zod";
import { MODELS } from "@/lib/ai/models";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1),
});

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY is not set (see .env.example)", { status: 500 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response("Invalid request body", { status: 400 });
  }

  const result = streamText({
    model: anthropic(MODELS.architect),
    system: buildSystemPrompt("architect"),
    messages: parsed.data.messages,
  });

  // Text-only stream; provider errors (billing, rate limit) are surfaced as text
  // instead of an empty 200 response.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          controller.enqueue(encoder.encode(part.text));
        } else if (part.type === "error") {
          console.error(part.error);
          const msg = part.error instanceof Error ? part.error.message : String(part.error);
          controller.enqueue(encoder.encode(`\n[Error: ${msg}]`));
        }
      }
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
