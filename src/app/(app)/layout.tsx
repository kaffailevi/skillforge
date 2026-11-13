import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { UserMenu } from "@/components/user-menu";

// Every page of the app proper (chat, profile, settings): the sidebar, with the signed-in learner
// at its foot. The user menu reads the session cookie, so it streams in behind its own boundary
// and the rest of the shell stays in the static shell.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      userMenu={
        <Suspense fallback={<div className="h-10" />}>
          <UserMenu />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
