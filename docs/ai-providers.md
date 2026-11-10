# AI providers

SkillForge talks to language models through the **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/google`). The browser uses `useChat`, which posts the conversation to `/api/chat`; the route calls the model with `streamText` and streams the answer back as a UI message stream.

## Providers

| Provider | Models | Needs | When it is used |
| --- | --- | --- | --- |
| Google Gemini (default) | `gemini-3.5-flash`, `gemini-3.5-flash-lite` | The learner's own key (Settings), or a server key for local development | When a key is available |
| Mock | `mock-mentor` | nothing | Always available; the fallback when there is no key |

The learner picks the model in the chat header. The choice is saved in the browser (`skillforge.model`). A provider without a key is listed as "add your key in Settings" and cannot be picked.

Where the code is:
- The provider list: [src/lib/providers.ts](../src/lib/providers.ts).
- The server side (key handling and model creation): [src/lib/server/models.ts](../src/lib/server/models.ts).
- The mock: [src/lib/server/mock-mentor.ts](../src/lib/server/mock-mentor.ts).

## Bring your own key

SkillForge is public, so it does **not** pay for other people's usage. Every learner uses their own Gemini key:

1. **Settings** → paste the key → **Save**. The key is stored only in that browser (`localStorage`, `skillforge.apiKeys`). **Test key** makes one tiny call through `/api/check-key`.
2. With each message, the browser sends the key in the `X-Gemini-Api-Key` header to `/api/chat` on our own server, never to anyone else.
3. The server validates the header with Zod and creates the Gemini client for that one request with `createGoogle({ apiKey })`. It never stores, logs or returns the key. Errors are logged by message only, so a key can't end up in the logs.
4. Without a key, the learner gets the mock mentor and a hint pointing to Settings.

Trade-offs, accepted on purpose:
- The key is readable by scripts running on the SkillForge origin. Answers are rendered without raw HTML (see `src/components/markdown.tsx`), which keeps injected scripts out.
- Anyone using the same browser profile can use the key. The Settings page says so and offers **Remove**.

## Environment variables

| Variable | Secret or config | Reaches the browser? | Where to set it |
| --- | --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | **Secret** | No; only the fact that it is set does | `.env.local` for local development only |

If this variable is set, the server uses it for every request that comes without a learner key. **Do not set it on Vercel** for the public deployment, or every visitor would use your quota. Locally it is convenient: the app works without visiting Settings.

The home page is prerendered, so whether a server key exists is fixed at build time. After changing `.env.local`, restart `npm run dev`.

### Getting a Gemini key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key**. The free tier is enough for development.
3. Paste it in SkillForge → **Settings**, or, for local development, into `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY=...`.

Keys come in two formats: the older `AIza…` and a newer one that contains a dot. Both are accepted.

If a key is ever shown in a chat, a screenshot or a commit, delete it in AI Studio and create a new one.

## What the model receives

- **Instructions** (the system prompt): the mentor rules plus the learner's profile, built by [src/lib/mentor-prompt.ts](../src/lib/mentor-prompt.ts). The profile page shows a preview.
- **Messages**: the whole conversation, validated with Zod in the route: at most 100 messages, and at most 8000 characters per text part.

## Errors

The SDK retries a failed call once (`maxRetries: 1`). After that, the learner sees a short message with a **Retry** button; details go only to the server log.

| Provider answer | Message in the chat |
| --- | --- |
| 429 rate limit | "The AI provider's rate limit was reached. Wait a minute, then retry." |
| 503 overloaded | "The model is overloaded right now. Retry, or pick another model." |
| 400 invalid key, 401, 403 | "Gemini rejected the API key. Check it in Settings." |
| anything else | "The mentor could not answer right now. Please retry." |

Gemini's `-latest` aliases (`gemini-flash-latest`) were often overloaded (503) when this was written, so the app uses pinned model IDs.
