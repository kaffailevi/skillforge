import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, fetchSignedInUser, githubApp, SignInError, STATE_COOKIE } from "@/lib/server/github-oauth";
import { SESSION_COOKIE, sealSession, sessionCookieOptions } from "@/lib/server/session";

// GET /api/auth/github/callback?code=…&state=… — GitHub sends the learner back here.
// The state must match the cookie set by /api/auth/github; then the code becomes a session cookie.
// Any failure goes back to /signin with a short error code the page explains.

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const app = githubApp();
    if (!app) throw new SignInError("not-configured");
    if (params.get("error") === "access_denied") throw new SignInError("denied");

    const state = params.get("state");
    const code = params.get("code");
    if (!state || !code || state !== request.cookies.get(STATE_COOKIE)?.value) {
      throw new SignInError("state-mismatch");
    }

    const redirectUri = new URL("/api/auth/github/callback", request.url).toString();
    const token = await exchangeCode(app, code, redirectUri);
    const user = await fetchSignedInUser(token);

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(SESSION_COOKIE, await sealSession(user), sessionCookieOptions);
    response.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/github" });
    return response;
  } catch (error) {
    const code = error instanceof SignInError ? error.code : "github-failed";
    if (!(error instanceof SignInError)) console.error("GitHub sign-in failed:", error);
    const response = NextResponse.redirect(new URL(`/signin?error=${code}`, request.url));
    response.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/github" });
    return response;
  }
}
