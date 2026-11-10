import { z } from "zod";

// Bring your own key: each learner's Gemini key is kept in their own browser and sent with each
// request in this header. The server uses it for that one call and never stores or logs it.
export const KEY_HEADER = "X-Gemini-Api-Key";

export const ApiKey = z
  .string()
  .trim()
  .min(20, "That does not look like a Gemini API key.")
  .max(200, "That does not look like a Gemini API key.")
  .regex(/^[\w.-]+$/, "That does not look like a Gemini API key."); // letters, digits, _ - . (newer keys contain a dot)

export const ApiKeys = z.object({ google: z.string() });
export type ApiKeys = z.infer<typeof ApiKeys>;

// Shows only the end of a key, e.g. "…a1B2".
export function maskKey(key: string): string {
  return `…${key.slice(-4)}`;
}
