import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/mentor-prompt";
import { EMPTY_PROFILE, Profile } from "@/lib/profile";
import { MOCK_CHOICE, ModelChoice } from "@/lib/providers";
import { EVENT_TOOL_RULES, eventTools } from "@/lib/server/event-tools";
import { mockMentorReply, mockMentorStream } from "@/lib/server/mock-mentor";
import { languageModel, learnerKey, serverProviders } from "@/lib/server/models";
import { friendlyError } from "@/lib/server/provider-errors";
import { getCurrentUser, toolApprovalSecret } from "@/lib/server/session";
import { ticketingConfigured } from "@/lib/server/ticketing";

// POST /api/chat — receives the conversation from useChat and streams the answer back
// in the AI SDK's UI message stream format, from Gemini or from the mock mentor.
// Gemini is called with the learner's own key (X-Gemini-Api-Key header), or with the server's key if one is set.
// Real models get the learning-event tools (step 12); booking waits for the learner's approval.

const MessagePart = z.looseObject({
  type: z.string(),
  text: z.string().max(8000).optional(),
  state: z.string().optional(), // tool parts: e.g. "approval-responded"
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

export async function POST(request: Request) {
  const parsed = ChatRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response("Invalid chat request.", { status: 400 });
  }
  const { messages, profile, model } = parsed.data;

  const user = await getCurrentUser();
  if (!user) return new Response("Sign in with GitHub first.", { status: 401 });

  // Either a new question, or the learner's Approve/Reject on a tool call (the answer then continues).
  const lastMessage = messages.at(-1);
  const question = lastMessage ? textOf(lastMessage).trim() : "";
  const isApprovalReply =
    lastMessage?.role === "assistant" && lastMessage.parts.some((part) => part.state === "approval-responded");
  if (!isApprovalReply && (lastMessage?.role !== "user" || question === "")) {
    return new Response("The last message must be a non-empty user message.", { status: 400 });
  }

  if (model.provider === "mock") {
    if (isApprovalReply) return new Response("The mock mentor has no tools.", { status: 400 });
    const stream = mockMentorStream(mockMentorReply(question, profile), request.signal);
    return createUIMessageStreamResponse({ stream });
  }

  const key = learnerKey(request);
  if (!key && !serverProviders().includes(model.provider)) {
    return new Response("Add your Gemini API key in Settings, or pick the mock mentor.", { status: 400 });
  }

  const withTools = ticketingConfigured();
  const result = streamText({
    model: languageModel(model, key),
    instructions: withTools ? `${buildSystemPrompt(profile)}\n\n${EVENT_TOOL_RULES}` : buildSystemPrompt(profile),
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools: withTools ? eventTools(user) : undefined,
    toolApproval: { book_event_seat: "user-approval" },
    // The server signs each approval request, so a modified browser cannot fake an "Approve".
    experimental_toolApprovalSecret: toolApprovalSecret(),
    stopWhen: isStepCount(5),
    abortSignal: request.signal,
    maxRetries: 1, // fail fast when the model is overloaded; the learner can retry or switch models
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, onError: friendlyError }),
  });
}
