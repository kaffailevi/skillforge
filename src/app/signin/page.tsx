import type { Metadata } from "next";
import { Suspense } from "react";
import { GitHubIcon } from "@/components/icons";
import { SignInError } from "@/components/sign-in-error";

export const metadata: Metadata = { title: "Sign in" };

// The only page a signed-out visitor can open. "Continue with GitHub" is a plain link to the
// route that starts GitHub's OAuth flow; GitHub brings the learner back signed in.
export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold">SkillForge</h1>
        <p className="mt-1 text-sm text-muted">Your AI career mentor</p>

        <Suspense>
          <SignInError />
        </Suspense>

        <a
          href="/api/auth/github"
          className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          <GitHubIcon />
          Continue with GitHub
        </a>
        <p className="mt-4 text-xs text-muted">
          Only GitHub accounts with a verified email can sign in. SkillForge reads your name, avatar and primary
          email, nothing else.
        </p>
      </div>
    </main>
  );
}
