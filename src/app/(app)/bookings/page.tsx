import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/server/session";
import { notificationsFor } from "@/lib/server/ticketing";

export const metadata: Metadata = { title: "Bookings" };

// F12: the confirmations the backend's notification service received for the learner's GitHub
// email. A booking made in the chat travels ticketing-service → RabbitMQ → notification-service,
// so a new one can take a few seconds to appear here.
export default function BookingsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-semibold">Bookings</h1>
        <p className="mt-1 text-sm text-muted">
          Confirmations from the events service for your GitHub email. Book seats by asking the mentor in the chat.
        </p>
        <Suspense fallback={<p className="mt-6 text-sm text-muted">Loading your bookings…</p>}>
          <BookingList />
        </Suspense>
      </div>
    </div>
  );
}

// The backend sends Bucharest local times without a zone; show them as they are (read and
// formatted as UTC, so the server's own time zone cannot shift them).
const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

async function BookingList() {
  await connection(); // always the latest confirmations, read when the page is requested
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await notificationsFor(user.email);
  if (result.error !== undefined) {
    return (
      <p role="alert" className="mt-6 rounded-lg border border-danger/40 p-3 text-sm">
        {result.error}
      </p>
    );
  }
  if (result.data.length === 0) {
    return <p className="mt-6 text-sm text-muted">No bookings yet for {user.email}.</p>;
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {result.data.map((notification) => (
        <li key={notification.id} className="rounded-xl border border-border bg-surface p-4">
          <p>{notification.text}</p>
          <p className="mt-1 text-xs text-muted">
            Confirmed {when.format(new Date(`${notification.notifiedAt}Z`))} · booking {notification.bookingId.slice(0, 8)}
          </p>
        </li>
      ))}
    </ul>
  );
}
