"use client";

import { useSearchParams } from "next/navigation";

// Explains the ?error= code the sign-in routes redirect with (see SignInErrorCode).
const MESSAGES: Record<string, string> = {
  "not-configured": "GitHub sign-in is not set up on this server yet (see docs/auth.md).",
  denied: "You cancelled on GitHub. Sign in again whenever you are ready.",
  "state-mismatch": "That sign-in link expired or came from another browser. Please try again.",
  "github-failed": "GitHub did not answer as expected. Please try again in a moment.",
  "no-verified-email":
    "Your GitHub account has no verified primary email. Verify it at github.com/settings/emails, then sign in again.",
};

export function SignInError() {
  const code = useSearchParams().get("error");
  if (!code) return null;

  return (
    <p role="alert" className="mt-4 rounded-lg border border-danger/40 bg-background p-3 text-left text-sm">
      {MESSAGES[code] ?? MESSAGES["github-failed"]}
    </p>
  );
}
