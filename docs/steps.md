# SkillForge — build steps

The app is built the way it was in the course: **one step = one prompt = one commit**, each step small enough to review line by line. A step is done when its acceptance criteria in [requirements.md](requirements.md) pass and `npm run lint` and `npm run build` are green.

Commit messages: `step N — <what>`.

| Step | Delivers | Features | Needs from you |
| --- | --- | --- | --- |
| 1 | Requirements, step plan, instructions (`docs/`, `README.md`, `CLAUDE.md`) — no code | — | — |
| 2 | Next.js skeleton (App Router, TypeScript, Tailwind), `/api/chat` streaming from the **mock** model, messages in `localStorage` | F1 (raw), F4 (mock) | — |
| 3 | Full UI with mock data: sidebar, conversations, Markdown rendering (sanitized), theme, mobile layout | F1, F2, F7 | — |
| 4 | Profile page and profile in the system prompt | F3, F5 | — |
| 5 | Real model through the Vercel AI SDK (`useChat`), Anthropic Haiku, provider/model picker, `docs/ai-providers.md` | F1, F4 | Anthropic API key in `.env.local` (mock keeps working without it) |
| 6 | Second provider (OpenAI mini) and Markdown export | F4, F6 | OpenAI key (optional) |
| 7 | Deploy to Vercel, `docs/vercel.md` | — | Vercel account (sign in with GitHub), import the repo |
| 8 | Token usage, cost estimate, LRU cache | F8 | — |
| 9 | GitHub login, verified email only, `docs/auth.md` | F9 | GitHub OAuth apps (local + production) |
| 10 | Supabase persistence (4 tables), `docs/supabase.md` with the SQL | F10 | Two Supabase projects; run the SQL in the SQL Editor |
| 11 | Tools with approval + migration (`learning_plan`, `facts`) | F11 | Run the migration SQL |
| 12 | Learning events from the Java backend on Cloud Run | F12 | Backend deployed; gateway URL + API key |
| 13–14 | Your two personal prompts (`PROMPTS.md`) | — | Post them in the course chat first |

## Personal prompts (course homework, steps 13–14)

1. **Career Trajectory Advisor** — the learner types a target role; the mentor compares it with the profile's skills, shows the gaps as progress bars (current vs. target level) and proposes at most 2 new plan steps through a `propose_learning_steps` tool with approval, reusing the approval UI.
2. **Weekly Progress Digest** — on demand, summarize the last 7 days of conversations into topics covered, facts learned, plan steps completed and one suggested next step; shown as Markdown and exportable with the existing export. Reads data only on the server.
