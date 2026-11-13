# GitHub login (step 9, F9)

SkillForge requires sign-in. The learner clicks **Continue with GitHub**, approves on GitHub's page, and comes back signed in. Only accounts whose **primary email is verified** on GitHub get in; that email is the one later steps use (e.g. bookings in step 12), never one the model writes.

There is no auth library or auth service: the OAuth web flow is three small route handlers, and the session is one encrypted cookie ([iron-session](https://github.com/vvo/iron-session), the library the Next.js guides use).

## How it works

```
/signin ──"Continue with GitHub"──▶ GET /api/auth/github
   sets skillforge_oauth_state (random, httpOnly, 10 min) ──▶ github.com/login/oauth/authorize
                                                                   │ learner approves
GET /api/auth/github/callback?code&state ◀─────────────────────────┘
   state = cookie? ──▶ code → access token ──▶ GET api.github.com/user + /user/emails
   primary email verified? ──▶ skillforge_session (encrypted, httpOnly, 7 days) ──▶ /
```

- [src/proxy.ts](../src/proxy.ts) runs before every request: signed out, pages redirect to `/signin` and `/api/*` answers **401**. `/api/auth/*` and static files are left alone.
- The GitHub token is used for the two reads and then dropped; it is never stored. The scope is `read:user user:email` (read-only).
- The session cookie holds the GitHub id, login, name, email and avatar URL, encrypted with `SESSION_SECRET`. A tampered or expired cookie counts as signed out.
- **Sign out** (user menu at the foot of the sidebar) is a `POST /api/auth/signout`: the cookie is deleted.
- Errors come back to `/signin?error=<code>` with a readable message: `denied`, `state-mismatch`, `github-failed`, `no-verified-email`, `not-configured`.

Code: [session.ts](../src/lib/server/session.ts), [github-oauth.ts](../src/lib/server/github-oauth.ts), [api/auth/](../src/app/api/auth/), [signin/page.tsx](../src/app/signin/page.tsx), [user-menu.tsx](../src/components/user-menu.tsx).

## Environment variables

| Variable | Kind | Reaches the browser? | Where it comes from |
| --- | --- | --- | --- |
| `GITHUB_CLIENT_ID` | config | no (only in the redirect URL to GitHub) | the GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | **secret** | no | the GitHub OAuth app → *Generate a new client secret* |
| `SESSION_SECRET` | **secret**, at least 32 characters | no | generate it (below); a different value locally and on Vercel |

Without them the app still builds, but nobody can sign in (`/signin` says sign-in is not set up).

## Setting it up

GitHub allows **one callback URL per OAuth app**, so there are two apps: one for local development, one for production.

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App** (https://github.com/settings/developers).

   | | Local | Production |
   | --- | --- | --- |
   | Application name | `SkillForge (local)` | `SkillForge` |
   | Homepage URL | `http://localhost:3000` | `https://skillforge-kl.vercel.app` |
   | Authorization callback URL | `http://localhost:3000/api/auth/github/callback` | `https://skillforge-kl.vercel.app/api/auth/github/callback` |

   Leave *Enable Device Flow* off. After **Register application**, copy the **Client ID** and click **Generate a new client secret** (shown once).
2. **Locally:** put the local app's values in `.env.local`, plus a session secret:
   ```powershell
   node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env.local
   ```
   then add `GITHUB_CLIENT_ID=` and `GITHUB_CLIENT_SECRET=` lines by hand, and restart `npm run dev`.
3. **On Vercel:** Project → Settings → Environment Variables, environment **Production**: the production app's `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, and a **new** `SESSION_SECRET` (generate another one; do not reuse the local one). Then **Redeploy**.

Preview deployments get their own URLs, which match neither callback URL, so sign-in works only on localhost and on the production URL. That is intended.

## Checking it

- Signed out: `/`, `/profile`, `/settings` redirect to `/signin`; `curl -X POST <url>/api/chat` answers 401.
- **Continue with GitHub** → GitHub's consent page → back on the chat, with your avatar, name and email at the foot of the sidebar.
- **Sign out** → back on `/signin`; the browser's back button does not get you in again.
