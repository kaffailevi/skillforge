import { z } from "zod";

// The AI providers and models the learner can pick. No secrets here: keyVariable is only the *name*
// of the environment variable the server reads. The mock needs no key and is always available.

export const PROVIDERS = [
  {
    id: "google",
    label: "Google Gemini",
    keyVariable: "GOOGLE_GENERATIVE_AI_API_KEY",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
    ],
  },
  {
    id: "mock",
    label: "Mock",
    keyVariable: null,
    models: [{ id: "mock-mentor", label: "Mock mentor (no AI)" }],
  },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

export const ModelChoice = z
  .object({
    provider: z.enum(["google", "mock"]),
    model: z.string(),
  })
  .refine(
    ({ provider, model }) =>
      PROVIDERS.some((item) => item.id === provider && item.models.some((option) => option.id === model)),
    "Unknown model for this provider.",
  );

export type ModelChoice = z.infer<typeof ModelChoice>;

export const MOCK_CHOICE: ModelChoice = { provider: "mock", model: "mock-mentor" };

// The saved choice if its provider has a key; otherwise the first provider that has one; otherwise the mock.
export function resolveChoice(saved: ModelChoice, available: ProviderId[]): ModelChoice {
  if (available.includes(saved.provider)) return saved;
  const firstReal = PROVIDERS.find((item) => item.id !== "mock" && available.includes(item.id));
  return firstReal ? { provider: firstReal.id, model: firstReal.models[0].id } : MOCK_CHOICE;
}
