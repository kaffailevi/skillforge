# SkillForge — requirements

SkillForge is an AI career mentor for people learning tech. You sign in with GitHub, tell it who you are, what you know and where you want to get, and it talks with you like a mentor: it answers questions, keeps a learning plan for you, and remembers what you tell it. Changes to your data happen only after you approve them.

This file is the source of truth for scope and acceptance criteria. Each feature is delivered in one step of [steps.md](steps.md).

## Users

- **Learner** — a developer or student who signs in with a GitHub account that has a verified email. Sees and changes only their own data.

There are no admin users.

## Features

### F1 — Mentor chat (streaming)
The learner writes a message; the mentor's answer appears word by word.
- Answers are rendered as Markdown (lists, code blocks, tables). HTML in answers is sanitized; links open in a new tab.
- A message can be stopped while it streams. An error shows a readable message and a "Retry" button.
- Acceptance: a question gets a streamed answer; `**bold**` renders bold; `<script>` in an answer is shown as text, not run.

### F2 — Conversations
- A sidebar lists the learner's conversations, newest first; "New chat" starts an empty one.
- A conversation gets a title from its first message. It can be renamed and deleted (with confirmation).
- Acceptance: after a page reload the list and the open conversation are still there.

### F3 — Profile
- Fields: display name, current role, goal (free text), skills — each with a level from 1 (beginner) to 5 (expert).
- The mentor uses the profile in every answer.
- Acceptance: change a skill's level, ask "what should I learn next?" — the answer takes the new level into account.

### F4 — AI providers
- Default provider: **Anthropic, model Claude Haiku**. Second provider: **OpenAI, a mini model**. A **mock** provider streams canned mentor answers and is used when no API key is configured, so the app works without any key.
- The learner picks provider and model in the UI; the choice is remembered.
- Acceptance: with no keys the mock answers; with a key the real model answers; switching provider changes who answers the next message.

### F5 — Mentor behaviour
- A system prompt makes the model a tech career mentor: concrete, encouraging, honest about gaps, short by default, asks one clarifying question when the goal is unclear.
- The system prompt includes the profile (F3) and the remembered facts (F10).

### F6 — Markdown export
- A conversation can be downloaded as a `.md` file (title, date, each message with its author).

### F7 — Look and feel
- Light, dark and system theme; the choice is remembered.
- Usable on a phone (sidebar collapses into a menu).

### F8 — Cost and caching
- Each answer shows its token usage (input / output) and an estimated cost in USD, from a price table per model with the date the prices were checked.
- The conversation shows its total cost.
- Identical requests (same provider, model, system prompt and messages) are answered from a server cache (LRU, with expiry) instead of calling the model again; cached answers are marked "from cache" and cost 0.
- Acceptance: sending the same first message twice in two new chats returns the second answer instantly, marked "from cache".

### F9 — GitHub login
- The app requires sign-in. "Continue with GitHub" opens GitHub's consent page; after it, the learner is back in the app.
- Only GitHub accounts with a verified email can sign in.
- A user menu shows avatar and name, with "Sign out".
- Acceptance: signed out, every page except sign-in redirects to sign-in, and `/api/*` answers 401.

### F10 — Persistence (Supabase)
- Profiles, conversations and messages are stored in Supabase Postgres, accessed **only from the server** with the secret key. The browser never talks to Supabase.
- Tables: `profiles`, `identities` (GitHub now; another provider could be linked later), `conversations`, `messages`.
- Every query is filtered by the signed-in learner's profile.
- Acceptance: a conversation started on the laptop is visible on the phone after signing in with the same GitHub account.

### F11 — Tools with human approval
- `get_learning_plan` — reads the learner's learning plan. Runs without asking.
- `update_learning_plan` — replaces the plan's steps. **Needs approval**: the chat shows the proposed plan with "Approve" / "Reject"; nothing is saved before "Approve". After "Reject" the mentor says so and does not retry.
- `remember_fact` — saves a short fact about the learner ("prefers video courses"). Runs without asking; facts are listed on the profile page and can be deleted there.
- Tool inputs are validated with Zod; at most 5 model steps per answer.
- Acceptance: "Put advanced JavaScript before Next.js as step 1" → approval card → Approve → the plan in the profile has the new first step.

### F12 — Learning events (exam bridge to the Java backend)
- `get_events` — lists upcoming learning events (workshops, meetups) from the course ticketing backend on Google Cloud Run, filtered by city or name. Runs without asking.
- `book_event_seat` — books seats for the signed-in learner (their GitHub email, never one the model writes). **Needs approval.**
- A "Bookings" page shows the confirmations the backend's notification service received.
- The backend is called only from the server, with an API key from the environment.
- Sold out (409) and rate limited (429) answers are shown as friendly messages in the chat.

## Non-functional requirements

- **Secrets** live only in environment variables: `.env.local` locally (never committed), Vercel *Environment Variables* in production. `.env.example` lists every name with an empty value.
- Server-only code (provider keys, Supabase, tools) is in modules that import `server-only`.
- Every external call handles its error path (`{ data, error }` from Supabase, non-2xx from APIs).
- Two Supabase projects: one for local development, one for production.
- Each integration is documented in `docs/` (what it is for, which variables it needs, whether each is a secret or config, how to get it).
- TypeScript strict; ESLint and Prettier pass.

## Out of scope

Payments, email notifications from SkillForge itself, an admin area, sign-in with providers other than GitHub, a native mobile app.
