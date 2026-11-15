import Image from "next/image";
import { connection } from "next/server";
import { LogOutIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/server/session";

// The signed-in learner (avatar, name, email) and "Sign out". A Server Component: the session is
// read on the server and only these display fields reach the browser.
export async function UserMenu() {
  await connection(); // the session check compares the seal's expiry with the current time
  const user = await getCurrentUser();
  if (!user) return null; // the proxy already sent signed-out visitors to /signin

  return (
    <div className="flex items-center gap-3 rounded-lg px-1">
      <Image
        src={user.avatarUrl}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full ring-2 ring-sidebar-border"
      />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
        <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
      </div>
      <form action="/api/auth/signout" method="post">
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="rounded-lg p-2 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <LogOutIcon />
        </button>
      </form>
    </div>
  );
}
