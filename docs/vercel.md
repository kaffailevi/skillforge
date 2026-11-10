# Vercel (hosting)

SkillForge runs on **Vercel**, connected to the GitHub repo `kaffailevi/skillforge`:

- every push to `main` deploys **Production**;
- every other branch or pull request gets its own **Preview** URL.

There is no `vercel.json`. Vercel detects Next.js and runs `npm install` and `npm run build`.

## First deploy (done once)

1. Go to [vercel.com](https://vercel.com) and choose **Continue with GitHub** (Hobby plan, free).
2. Click **Add New… → Project**. Under **Import Git Repository**, choose `kaffailevi/skillforge`.
   - If the repo is not listed: **Adjust GitHub App Permissions**, and allow the Vercel app to access this repo.
3. Framework preset: **Next.js**. Leave the build settings and the root directory as they are.
4. **Environment Variables:** none for now. Do **not** add `GOOGLE_GENERATIVE_AI_API_KEY` here; see below.
5. Click **Deploy**. The site is then live at `https://<project>.vercel.app`.

## Environment variables

None are needed yet. Each visitor brings their own Gemini key in **Settings** (see [ai-providers.md](ai-providers.md#bring-your-own-key)).

| Variable | Set on Vercel? | Why |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | **No** | If set, every visitor without a key would use it, and spend your quota. Use it only in `.env.local`. |

Later steps add variables (GitHub login, Supabase, the Java backend). Each one is listed in its own doc and set under **Project → Settings → Environment Variables**. After adding or changing a variable, **redeploy**: Deployments → ⋯ → Redeploy.

## Checking a deploy

- The home page loads. Without a key it shows the "mock mentor" hint, and the mock answers.
- **Settings** → paste your key → **Test key** says "The key works." The model picker then offers **Gemini 3.5 Flash**, and a question streams a Gemini answer.
- When something fails: Project → **Logs** shows the server output, including `AI provider error:` lines.
