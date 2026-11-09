import { z } from "zod";
import type { StreamEvent } from "@/lib/chat-types";
import { mockMentorReply, streamWords } from "@/lib/server/mock-mentor";

// POST /api/chat — receives the conversation, answers with a stream of Server-Sent Events.

const ChatRequest = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .min(1)
    .max(100),
});

export async function POST(request: Request) {
  const parsed = ChatRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const lastMessage = parsed.data.messages.at(-1);
  if (lastMessage?.role !== "user" || lastMessage.content.trim() === "") {
    return Response.json({ error: "The last message must be a non-empty user message." }, { status: 400 });
  }

  const answer = mockMentorReply(lastMessage.content);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        for await (const text of streamWords(answer, request.signal)) {
          send({ type: "delta", text });
        }
        send({ type: "done" });
        controller.close();
      } catch {
        // The browser went away (Stop button, closed tab): nothing left to send to.
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
