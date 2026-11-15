import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { z } from "zod";

// The signed-in learner, kept in one encrypted, httpOnly cookie (iron-session). No database yet:
// everything the app needs about the learner fits in the cookie. SESSION_SECRET encrypts it.

export const SessionUser = z.object({
  githubId: z.number(),
  login: z.string(),
  name: z.string(),
  email: z.email(), // GitHub's primary email, verified by GitHub (see github-oauth.ts)
  avatarUrl: z.url(),
});
export type SessionUser = z.infer<typeof SessionUser>;

export const SESSION_COOKIE = "skillforge_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // sign in again after a week

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function sessionConfigured(): boolean {
  return sessionSecret() !== null;
}

// The learner in a session cookie, or null when there is none, it expired, was tampered with,
// or the server has no SESSION_SECRET (then nobody is signed in: fail closed).
export async function userFromSeal(seal: string | undefined): Promise<SessionUser | null> {
  const password = sessionSecret();
  if (!seal || !password) return null;
  try {
    const data = await unsealData<{ user?: unknown }>(seal, { password, ttl: SESSION_TTL_SECONDS });
    const parsed = SessionUser.safeParse(data.user);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// For Server Components and Route Handlers. With Cache Components, a component that calls this
// must sit inside a <Suspense> boundary (it reads the request's cookies).
export async function getCurrentUser(): Promise<SessionUser | null> {
  return userFromSeal((await cookies()).get(SESSION_COOKIE)?.value);
}

// The key that signs tool approvals (step 12), derived from SESSION_SECRET so there is one secret
// less to manage, yet never the same key that encrypts the cookie.
export function toolApprovalSecret(): Uint8Array | undefined {
  const secret = sessionSecret();
  return secret ? createHmac("sha256", secret).update("skillforge tool approvals").digest() : undefined;
}

export async function sealSession(user: SessionUser): Promise<string> {
  const password = sessionSecret();
  if (!password) throw new Error("SESSION_SECRET is not set (at least 32 characters). See docs/auth.md.");
  return sealData({ user }, { password, ttl: SESSION_TTL_SECONDS });
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, // sent on the redirect back from GitHub, not on cross-site POSTs
  path: "/",
  maxAge: SESSION_TTL_SECONDS - 60, // the cookie expires just before the seal does
};
