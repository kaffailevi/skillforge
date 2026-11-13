import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, userFromSeal } from "@/lib/server/session";

// Runs before every page and API request (Next.js 16 "proxy", formerly middleware).
// Signed out: pages redirect to /signin and /api/* answers 401. Signed in: /signin goes home.
// The sign-in routes themselves (/api/auth/*) and static files are not matched.
// Route handlers that need the learner (e.g. their email) still read the session themselves.

export async function proxy(request: NextRequest) {
  const user = await userFromSeal(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/signin") {
    return user ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in with GitHub first." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/signin", request.url));
}

export const config = {
  matcher: ["/((?!api/auth/|_next/static|_next/image|favicon.ico).*)"],
};
