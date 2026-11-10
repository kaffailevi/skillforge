# SkillForge — instructions for contributors and AI agents

SkillForge is an AI career mentor built with Next.js and the Vercel AI SDK. Scope and acceptance criteria: [docs/requirements.md](docs/requirements.md). Build order: [docs/steps.md](docs/steps.md).

This is Next.js 16.4 with Cache Components; read [AGENTS.md](AGENTS.md) and the guides in `node_modules/next/dist/docs/` before relying on older Next.js knowledge.

## How we work

- One step from `docs/steps.md` at a time. Do only what the step asks; no extra features.
- After a step: `npm run lint` and `npm run build` must pass, then check the step's acceptance criteria in the browser.
- One commit per step: `step N — <what>`. No AI attribution in commits.
- When a step adds an integration, document it in `docs/<integration>.md`: what it is for, every environment variable it needs, whether each is a **secret** or **config**, whether it reaches the browser, and how to get it.

## Code rules

- Next.js App Router, TypeScript strict. Server Components by default; `'use client'` only on components that need state, effects or browser APIs.
- Anything that touches keys, Supabase or tools lives in `src/lib/server/` and starts with `import "server-only"`.
- Secrets come only from environment variables. Never hard-code or log them. Never prefix a secret with `NEXT_PUBLIC_`.
- Exception: each learner's own Gemini key stays in their browser and reaches the server only in the `X-Gemini-Api-Key` header ([docs/ai-providers.md](docs/ai-providers.md#bring-your-own-key)). Never store, log or return it. Never set `GOOGLE_GENERATIVE_AI_API_KEY` on Vercel.
- Validate every input that crosses a boundary (request bodies, tool inputs) with Zod.
- Handle the error path of every external call; show the user a readable message.
- Styling: Tailwind utility classes and the theme tokens in `src/app/globals.css`. Keep the UI plain; improve it only when a step asks.
- UI text is in English.

## Commands

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```
