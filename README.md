# SkillForge

An AI career mentor for people learning tech. Sign in with GitHub, describe your skills and goal, and chat with a mentor that knows your profile, finds learning events (workshops, meetups) and books a seat for you, but only after you approve it.

**Live:** https://skillforge-kl.vercel.app (sign in with GitHub; Gemini works at once on the server's key, or with your own key from Settings)

Built during the **FutureReady IT** course. The front end is Module 1 (Web Development & AI-Assisted Engineering); the learning events come from the Module 2 back end, [`kaffailevi/frit-ticketing-app`](https://github.com/kaffailevi/frit-ticketing-app): three Java services on Google Cloud Run.

## What it does today

- **Mentor chat** with streamed Markdown answers, from Google Gemini (3.5 Flash or Flash-Lite) or a mock mentor that needs no AI.
- **Conversations** in a sidebar: new, open, rename, delete.
- **Profile** (name, role, goal, skills 1–5) that the mentor reads before every answer; without a name it uses your GitHub name.
- **GitHub sign-in**, required for every page and API.
- **Learning events** (step 12): the tools `get_events` and `book_event_seat` call the back end's API gateway from the server; a booking needs your **Approve** in the chat. The **Bookings** page shows the confirmations the back end's notification service received.
- Light, dark and system theme; works on a phone.

Conversations, profile, theme, model choice and your own key (if any) are kept **in your browser**. Supabase persistence, the learning plan and remembered facts are planned (steps 10–11), not built.

## Stack

- Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- Vercel AI SDK with Google Gemini, and a mock model
- GitHub OAuth with an encrypted session cookie (`iron-session`)
- The Java back end on Google Cloud Run, reached through its API gateway with an API key
- Hosted on Vercel

## Documentation

- [Requirements](docs/requirements.md): what the app does and how each feature is accepted
- [Build steps](docs/steps.md): the order it is built in, one commit per step
- [AI providers](docs/ai-providers.md): Gemini on the server's key or your own, the mock, the environment variables
- [GitHub login](docs/auth.md): sign-in, the session cookie, the two OAuth apps
- [Ticketing back end](docs/ticketing-backend.md): the event tools, the Bookings page, the errors shown
- [Vercel](docs/vercel.md): how the app is deployed

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Sign-in with GitHub is required: set up the local OAuth app and `SESSION_SECRET` first ([docs/auth.md](docs/auth.md)). Open http://localhost:3000. Without any Gemini key the mentor runs in **mock mode** and streams canned answers; put a key in `.env.local` or in **Settings** ([docs/ai-providers.md](docs/ai-providers.md)). The event tools need `TICKETING_API_URL` and `TICKETING_API_KEY` ([docs/ticketing-backend.md](docs/ticketing-backend.md)).

## Status

Steps 1–5, 7, 9 and 12 of [the plan](docs/steps.md) are done, plus a redesign (ink sidebar, ember accent, one set of buttons and fields). Steps 6 and 8 are optional and skipped; steps 10 and 11 (Supabase, learning plan and facts) are not built yet.
