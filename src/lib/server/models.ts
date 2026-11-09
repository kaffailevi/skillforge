import "server-only";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { PROVIDERS, type ModelChoice, type ProviderId } from "@/lib/providers";

// Which providers have their API key set. Only presence is checked; the value never leaves the server.
export function availableProviders(): ProviderId[] {
  return PROVIDERS.filter((provider) => provider.keyVariable === null || Boolean(process.env[provider.keyVariable])).map(
    (provider) => provider.id,
  );
}

// The AI SDK model for a real provider. @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY itself.
export function languageModel(choice: ModelChoice): LanguageModel {
  switch (choice.provider) {
    case "google":
      return google(choice.model);
    case "mock":
      throw new Error("The mock mentor is not an AI SDK model.");
  }
}
