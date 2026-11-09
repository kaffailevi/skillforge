import "server-only";
import { createUIMessageStream } from "ai";
import { levelLabel, type Profile } from "@/lib/profile";

// The mock mentor answers without any AI provider, so the app works before an API key exists.
// It picks a canned answer by keyword and streams it word by word, like a real model would.

const ANSWERS: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["markdown", "format"],
    answer:
      'My answers are Markdown. A table:\n\n| Skill | Level |\n| --- | --- |\n| React | 3 / 5 |\n| Java | 2 / 5 |\n\nA code block:\n\n```ts\nconst nextTopic = "TypeScript generics";\n```\n\nA link, which opens in a new tab: [Next.js docs](https://nextjs.org/docs).\n\nHTML is shown as text and never runs: <script>alert("hi")</script>',
  },
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

const ASKS_FOR_NEXT_STEP = /\bnext\b|where (do|should) i start/i;

export function mockMentorReply(userMessage: string, profile: Profile): string {
  if (ASKS_FOR_NEXT_STEP.test(userMessage)) return nextStepAnswer(profile);
  const text = userMessage.toLowerCase();
  const match = ANSWERS.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword)));
  if (match) return match.answer;
  return profile.displayName ? `Hi ${profile.displayName}! ${FALLBACK}` : FALLBACK;
}

// "What should I learn next?" is answered from the profile: the weakest skill first, the strongest as an anchor.
function nextStepAnswer(profile: Profile): string {
  if (profile.skills.length === 0) {
    return "I can't pick a next step yet: your profile has no skills. Open **Profile**, add the skills you use with a level from 1 to 5, and ask me again.";
  }

  const byLevel = [...profile.skills].sort((a, b) => a.level - b.level);
  const weakest = byLevel[0];
  const strongest = byLevel[byLevel.length - 1];

  const steps = [
    `1. **${weakest.name}** — you rated it ${weakest.level}/5 (${levelLabel(weakest.level)}). ${adviceFor(weakest.level)}`,
  ];
  if (strongest.level > weakest.level) {
    steps.push(
      `2. **Use ${strongest.name}** (${strongest.level}/5) as your anchor: build one small project that needs both ${strongest.name} and ${weakest.name}.`,
    );
  }

  const opening = profile.displayName ? `${profile.displayName}, here is` : "Here is";
  const goal = profile.goal ? ` toward your goal (*${profile.goal.replace(/\s+/g, " ")}*)` : "";
  return `${opening} what I'd do next${goal}:\n\n${steps.join("\n")}\n\n_Mock mode: this answer is built from your profile, not by an AI model._`;
}

function adviceFor(level: number): string {
  if (level <= 2) return "Start with a beginner course and write a little code every day.";
  if (level === 3) return "Build one small project end to end without following a tutorial.";
  return "Go deeper: read real-world code and explain it to someone else.";
}

// Yields the answer piece by piece. Stops early when the browser cancels the request.
export async function* streamWords(text: string, signal: AbortSignal, delayMs = 30): AsyncGenerator<string> {
  for (const piece of text.split(/(?<=\s)/)) {
    if (signal.aborted) return;
    yield piece;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

// The mock answer in the AI SDK's UI message stream format, so useChat reads it like a real model's answer.
export function mockMentorStream(answer: string, signal: AbortSignal) {
  return createUIMessageStream({
    async execute({ writer }) {
      const id = "mock-text";
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id });
      for await (const delta of streamWords(answer, signal)) {
        writer.write({ type: "text-delta", id, delta });
      }
      writer.write({ type: "text-end", id });
      writer.write({ type: "finish" });
    },
  });
}
