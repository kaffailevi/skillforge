import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/session";

// POST /api/auth/signout — the "Sign out" button: drop the session cookie, back to /signin.
// POST only (a form), so a link on another site cannot sign the learner out.
// 303: the browser follows the redirect with GET.

export function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/signin", request.url), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
  return response;
}
