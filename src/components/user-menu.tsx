import Image from "next/image";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/server/session";

// The signed-in learner (avatar, name, email) and "Sign out". A Server Component: the session is
// read on the server and only these display fields reach the browser.
export async function UserMenu() {
  await connection(); // the session check compares the seal's expiry with the current time
  const user = await getCurrentUser();
  if (!user) return null; // the proxy already sent signed-out visitors to /signin

  return (
    <div className="flex items-center gap-2">
      <Image src={user.avatarUrl} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <form action="/api/auth/signout" method="post">
        <button type="submit" className="rounded-md px-2 py-1 text-xs text-muted hover:bg-background hover:text-foreground">
          Sign out
        </button>
      </form>
    </div>
  );
}
