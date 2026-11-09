import "server-only";

// The mock mentor answers without any AI provider, so the app works before an API key exists.
// It picks a canned answer by keyword and streams it word by word, like a real model would.

const ANSWERS: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["react", "frontend", "front-end"],
    answer:
      "Good choice. For React, I'd go in this order:\n\n1. **Components and props** — build small pieces and pass data down.\n2. **State and effects** — `useState`, `useEffect`, and when you don't need an effect.\n3. **Shared state** — lifting state up, then Context.\n\nWhich of these feels least solid to you right now?",
  },
  {
    keywords: ["java", "spring", "backend", "back-end"],
    answer:
      "For backend work with Java, focus on:\n\n- **Modern Java** — records, sealed interfaces, pattern matching.\n- **Spring Boot** — controllers, services, validation, `ProblemDetail` errors.\n- **Tests first** — write the failing test, then the code.\n\nDo you already have a small API you could extend?",
  },
  {
    keywords: ["job", "career", "interview", "cv", "role"],
    answer:
      "Let's make your next step concrete. Tell me:\n\n1. The **role** you are aiming for.\n2. The **skills** you already use at work or in projects.\n3. How many **hours per week** you can spend learning.\n\nWith that I can suggest a realistic plan.",
  },
];

const FALLBACK =
  "I'm **SkillForge**, your career mentor (running in *mock mode*: no AI provider is configured yet).\n\nTell me what you are learning and what role you want, and I'll suggest the next steps. Try asking about **React**, **Java** or your **career**.";

export function mockMentorReply(userMessage: string): string {
  const text = userMessage.toLowerCase();
  const match = ANSWERS.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword)));
  return match?.answer ?? FALLBACK;
}

// Yields the answer piece by piece. Stops early when the browser cancels the request.
export async function* streamWords(text: string, signal: AbortSignal, delayMs = 30): AsyncGenerator<string> {
  for (const piece of text.split(/(?<=\s)/)) {
    if (signal.aborted) return;
    yield piece;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
