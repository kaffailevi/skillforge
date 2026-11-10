# SkillForge

An AI career mentor for people learning tech. Sign in with GitHub, describe your skills and goal, and chat with a mentor that keeps a learning plan for you, remembers what you tell it, and asks before it changes anything.

**Live:** https://skillforge-kl.vercel.app (bring your own Gemini key in Settings, or try the mock mentor)

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
- [AI providers](docs/ai-providers.md) — Gemini with your own key, the mock, and the environment variables
- [Vercel](docs/vercel.md) — how the app is deployed

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any API key the mentor runs in **mock mode** and streams canned answers. To use Gemini, paste your own key in **Settings** (kept only in your browser), or, for local development, copy `.env.example` to `.env.local` and fill it in. See [docs/ai-providers.md](docs/ai-providers.md).

## Status

Step 7 of [the plan](docs/steps.md): the mentor answers with Google Gemini using **your own API key** (Settings), or the mock without one. Conversations, profile, theme, model choice and key are saved in the browser.
