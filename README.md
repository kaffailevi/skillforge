# SkillForge

An AI career mentor for people learning tech. Sign in with GitHub, describe your skills and goal, and chat with a mentor that keeps a learning plan for you, remembers what you tell it, and asks before it changes anything.

Built during the **FutureReady IT** course (Module 1 — Web Development & AI-Assisted Engineering).

## Stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- Vercel AI SDK — Google Gemini (default), a second provider in step 6, a mock model when no key is set
- Supabase Postgres, used only from the server
- GitHub sign-in
- Hosted on Vercel

## Documentation

- [Requirements](docs/requirements.md) — what the app does and how each feature is accepted
- [Build steps](docs/steps.md) — the order it is built in, one commit per step
- [AI providers](docs/ai-providers.md) — Gemini, the mock, and the environment variables they need

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any API key the mentor runs in **mock mode** and streams canned answers. To use Gemini, copy `.env.example` to `.env.local` and fill in the key; see [docs/ai-providers.md](docs/ai-providers.md).

## Status

Step 5 of [the plan](docs/steps.md): the mentor answers with Google Gemini through the Vercel AI SDK (or the mock when no key is set), using your profile; conversations, profile, theme and model choice are saved in the browser.
