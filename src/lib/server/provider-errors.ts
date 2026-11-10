import "server-only";
import { APICallError, RetryError } from "ai";

// What the learner sees when the provider fails. Details go to the server log only
// (the error message, never the request, so a key cannot end up in the log).
export function friendlyError(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error; // the SDK wraps errors it retried
  console.error("AI provider error:", cause instanceof Error ? cause.message : cause);
  if (APICallError.isInstance(cause)) {
    const status = cause.statusCode;
    if (status === 429) return "The AI provider's rate limit was reached. Wait a minute, then retry.";
    if (status === 503) return "The model is overloaded right now. Retry, or pick another model.";
    if (status === 401 || status === 403 || (status === 400 && /api key/i.test(cause.message))) {
      return "Gemini rejected the API key. Check it in Settings.";
    }
  }
  return "The mentor could not answer right now. Please retry.";
}

