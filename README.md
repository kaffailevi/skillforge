# SkillForge

An AI career mentor for people learning tech. Sign in with GitHub, describe your skills and goal, and chat with a mentor that keeps a learning plan for you, remembers what you tell it, and asks before it changes anything.

Built during the **FutureReady IT** course (Module 1 — Web Development & AI-Assisted Engineering).

## Stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- Vercel AI SDK — Anthropic Claude Haiku (default), OpenAI (second provider), a mock model when no key is set
- Supabase Postgres, used only from the server
- GitHub sign-in
- Hosted on Vercel

## Documentation

- [Requirements](docs/requirements.md) — what the app does and how each feature is accepted
- [Build steps](docs/steps.md) — the order it is built in, one commit per step

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any API key the mentor runs in **mock mode** and streams canned answers.

## Status

Step 2 of [the plan](docs/steps.md): Next.js skeleton, streaming chat with the mock mentor, messages saved in the browser.
