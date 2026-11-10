import { generateText } from "ai";
import { languageModel, learnerKey } from "@/lib/server/models";
import { friendlyError } from "@/lib/server/provider-errors";

// POST /api/check-key — the Settings page's "Test key" button. Makes one tiny Gemini call
// with the key from the X-Gemini-Api-Key header. The key is not stored or logged.
export async function POST(request: Request) {
  const key = learnerKey(request);
  if (!key) {
    return Response.json({ ok: false, message: "That does not look like a Gemini API key." }, { status: 400 });
  }

  try {
    await generateText({
      model: languageModel({ provider: "google", model: "gemini-3.5-flash-lite" }, key),
      prompt: "Reply with the single word: ok",
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(20_000),
    });
    return Response.json({ ok: true, message: "The key works." });
  } catch (error) {
    return Response.json({ ok: false, message: friendlyError(error) });
  }
}
