import "server-only";
import { z } from "zod";
import type { SessionUser } from "@/lib/server/session";

// GitHub sign-in (OAuth web flow): send the learner to GitHub, get a code back, exchange it for a
// token, read the profile and the emails. Only an account whose primary email GitHub has verified
// may sign in. The token is used for these two reads and then dropped: it is never stored.

export type SignInErrorCode =
  | "not-configured" // GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / SESSION_SECRET missing
  | "denied" // the learner clicked "Cancel" on GitHub
  | "state-mismatch" // the callback does not belong to a sign-in this browser started
  | "github-failed" // GitHub did not answer as expected
  | "no-verified-email"; // the account's primary email is not verified

export class SignInError extends Error {
  constructor(readonly code: SignInErrorCode) {
    super(code);
  }
}

// The random state of a sign-in in progress (scoped to /api/auth/github, 10 minutes).
export const STATE_COOKIE = "skillforge_oauth_state";

type GitHubApp = { clientId: string; clientSecret: string };

export function githubApp(): GitHubApp | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function authorizeUrl(app: GitHubApp, redirectUri: string, state: string): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", app.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return url.toString();
}

const TokenResponse = z.object({ access_token: z.string().min(1) });

export async function exchangeCode(app: GitHubApp, code: string, redirectUri: string): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  // GitHub answers 200 with { error: "bad_verification_code" } for a used or expired code.
  const parsed = TokenResponse.safeParse(response.ok ? await response.json().catch(() => null) : null);
  if (!parsed.success) throw new SignInError("github-failed");
  return parsed.data.access_token;
}

const GitHubUser = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.url(),
});

const GitHubEmails = z.array(z.object({ email: z.string(), primary: z.boolean(), verified: z.boolean() }));

async function githubApi(path: string, token: string): Promise<unknown> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new SignInError("github-failed");
  return response.json();
}

export async function fetchSignedInUser(token: string): Promise<SessionUser> {
  const [userBody, emailsBody] = await Promise.all([githubApi("/user", token), githubApi("/user/emails", token)]);
  const user = GitHubUser.safeParse(userBody);
  const emails = GitHubEmails.safeParse(emailsBody);
  if (!user.success || !emails.success) throw new SignInError("github-failed");

  const primary = emails.data.find((entry) => entry.primary && entry.verified);
  if (!primary) throw new SignInError("no-verified-email");

  return {
    githubId: user.data.id,
    login: user.data.login,
    name: user.data.name?.trim() || user.data.login,
    email: primary.email,
    avatarUrl: user.data.avatar_url,
  };
}
