import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  RetryError,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/mentor-prompt";
import { EMPTY_PROFILE, Profile } from "@/lib/profile";
import { MOCK_CHOICE, ModelChoice } from "@/lib/providers";
import { mockMentorReply, mockMentorStream } from "@/lib/server/mock-mentor";
import { availableProviders, languageModel } from "@/lib/server/models";

// POST /api/chat — receives the conversation from useChat and streams the answer back
// in the AI SDK's UI message stream format, from Gemini or from the mock mentor.

const MessagePart = z.looseObject({
  type: z.string(),
  text: z.string().max(8000).optional(),
});

const ChatRequest = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        parts: z.array(MessagePart).max(50),
      }),
    )
    .min(1)
    .max(100),
  profile: Profile.default(EMPTY_PROFILE),
  model: ModelChoice.default(MOCK_CHOICE),
});

function textOf(message: { parts: { type: string; text?: string }[] }): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
}

// What the learner sees when the provider fails. Details go to the server log only.
function friendlyError(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error; // the SDK wraps errors it retried
  console.error("AI provider error:", cause instanceof Error ? cause.message : cause);
  if (APICallError.isInstance(cause)) {
    if (cause.statusCode === 429) return "The AI provider's rate limit was reached. Wait a minute, then retry.";
    if (cause.statusCode === 503) return "The model is overloaded right now. Retry, or pick another model.";
    if (cause.statusCode === 401 || cause.statusCode === 403) return "The AI provider rejected the API key.";
  }
  return "The mentor could not answer right now. Please retry.";
}

export async function POST(request: Request) {
  const parsed = ChatRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response("Invalid chat request.", { status: 400 });
  }
  const { messages, profile, model } = parsed.data;

  const lastMessage = messages.at(-1);
  const question = lastMessage ? textOf(lastMessage).trim() : "";
  if (lastMessage?.role !== "user" || question === "") {
    return new Response("The last message must be a non-empty user message.", { status: 400 });
  }

  if (model.provider === "mock") {
    const stream = mockMentorStream(mockMentorReply(question, profile), request.signal);
    return createUIMessageStreamResponse({ stream });
  }

  if (!availableProviders().includes(model.provider)) {
    return new Response("This provider has no API key on the server. Pick another model.", { status: 400 });
  }

  const result = streamText({
    model: languageModel(model),
    instructions: buildSystemPrompt(profile),
    messages: await convertToModelMessages(messages as UIMessage[]),
    abortSignal: request.signal,
    maxRetries: 1, // fail fast when the model is overloaded; the learner can retry or switch models
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, onError: friendlyError }),
  });
}
