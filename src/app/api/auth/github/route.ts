import { NextResponse } from "next/server";
import { authorizeUrl, githubApp, STATE_COOKIE } from "@/lib/server/github-oauth";
import { sessionConfigured } from "@/lib/server/session";

// GET /api/auth/github — "Continue with GitHub": remember a random state in a short-lived cookie,
// then send the browser to GitHub's consent page. GitHub comes back to /api/auth/github/callback.

export function GET(request: Request) {
  const app = githubApp();
  if (!app || !sessionConfigured()) {
    return NextResponse.redirect(new URL("/signin?error=not-configured", request.url));
  }

  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/auth/github/callback", request.url).toString();

  const response = NextResponse.redirect(authorizeUrl(app, redirectUri, state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/github",
    maxAge: 10 * 60, // the learner has 10 minutes on GitHub's page
  });
  return response;
}
