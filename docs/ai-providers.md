# AI providers

SkillForge talks to language models through the **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/google`). The browser uses `useChat`, which posts the conversation to `/api/chat`; the route calls the model with `streamText` and streams the answer back as a UI message stream.

## Providers

| Provider | Models | Needs | When it is used |
| --- | --- | --- | --- |
| Google Gemini (default) | `gemini-3.5-flash`, `gemini-3.5-flash-lite` | `GOOGLE_GENERATIVE_AI_API_KEY` | When the key is set on the server |
| Mock | `mock-mentor` | nothing | Always available; the default when no key is set |

The learner picks the model in the chat header; the choice is saved in the browser (`skillforge.model`). A provider whose key is missing is listed as "no API key" and cannot be picked. Only the *names* of the configured providers reach the browser, never a key.

The list lives in [src/lib/providers.ts](../src/lib/providers.ts). The server side (key check and model creation) is in [src/lib/server/models.ts](../src/lib/server/models.ts). The mock is in [src/lib/server/mock-mentor.ts](../src/lib/server/mock-mentor.ts).

## Environment variables

| Variable | Secret or config | Reaches the browser? | Used by |
| --- | --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | **Secret** | No — read only on the server by `@ai-sdk/google` | `/api/chat` |

Locally: put it in `.env.local` (git-ignored; copy [.env.example](../.env.example)). In production: Vercel → Project → Settings → Environment Variables. Never prefix it with `NEXT_PUBLIC_`.

The home page is prerendered, so the list of configured providers is fixed at build time. After adding or removing a key, restart `npm run dev` locally or redeploy on Vercel.

### Getting a Gemini key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) and sign in with a Google account.
2. **Create API key** (it can live in any Google Cloud project; the free tier is enough for development).
3. Paste it into `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY=...` and restart the dev server.

If a key is ever shown in a chat, a screenshot or a commit, delete it in AI Studio and create a new one.

## What the model receives

- **Instructions** (the system prompt): the mentor rules plus the learner's profile, built by [src/lib/mentor-prompt.ts](../src/lib/mentor-prompt.ts). The profile page shows a preview.
- **Messages**: the whole conversation, validated with Zod in the route (at most 100 messages, 8000 characters per text part).

## Errors

The SDK retries a failed call once (`maxRetries: 1`). The learner then sees a short message with a **Retry** button; details go only to the server log.

| Provider answer | Message in the chat |
| --- | --- |
| 429 rate limit | "The AI provider's rate limit was reached. Wait a minute, then retry." |
| 503 overloaded | "The model is overloaded right now. Retry, or pick another model." |
| 401 / 403 | "The AI provider rejected the API key." |
| anything else | "The mentor could not answer right now. Please retry." |

Gemini's `-latest` aliases (`gemini-flash-latest`) were often overloaded (503) when this was written, so the app uses pinned model IDs.
