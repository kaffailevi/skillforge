import "server-only";
import { createGoogle } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { ApiKey, KEY_HEADER } from "@/lib/api-keys";
import { PROVIDERS, type ModelChoice, type ProviderId } from "@/lib/providers";

// Providers that work without a key from the learner: the mock, plus any provider whose key is set
// in the server environment (meant for local development — leave it unset on a public deployment).
// Only presence is checked; the value never leaves the server.
export function serverProviders(): ProviderId[] {
  return PROVIDERS.filter((provider) => provider.keyVariable === null || Boolean(process.env[provider.keyVariable])).map(
    (provider) => provider.id,
  );
}

// The AI SDK model for a real provider, called with the learner's own key when they sent one,
// otherwise with the server's key. The key is used for this call only: never stored, never logged.
export function languageModel(choice: ModelChoice, key: string | null): LanguageModel {
  switch (choice.provider) {
    case "google":
      return createGoogle(key ? { apiKey: key } : {})(choice.model);
    case "mock":
      throw new Error("The mock mentor is not an AI SDK model.");
  }
}

// The learner's own key from the request header; null when absent or malformed.
export function learnerKey(request: Request): string | null {
  const parsed = ApiKey.safeParse(request.headers.get(KEY_HEADER) ?? "");
  return parsed.success ? parsed.data : null;
}
