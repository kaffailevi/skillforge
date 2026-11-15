"use client";

import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";
import Link from "next/link";

// How a tool call looks in the chat (step 12): a short status line while it runs, a compact
// result, and for book_event_seat an approval card. Nothing is booked before "Approve".

type Part = ToolUIPart | DynamicToolUIPart;
type Respond = (approvalId: string, approved: boolean) => void;

type EventItem = { id: string; name: string; city: string; venueName: string; startsAt: string; availableSeats: number };
type ToolOutput =
  | { ok: true; events?: EventItem[]; booking?: { seats: number; eventId: string } }
  | { ok: false; message: string };

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

function formatStart(startsAt: string): string {
  const date = new Date(startsAt); // a local date-time without a zone: read as local time
  return Number.isNaN(date.getTime()) ? startsAt : when.format(date);
}

export function ToolPart({ part, onRespond }: { part: Part; onRespond: Respond }) {
  const name = getToolName(part);
  const input = (part.input ?? {}) as { city?: string; name?: string; eventName?: string; eventId?: string; seats?: number };

  if (name === "book_event_seat") return <BookingCard part={part} input={input} onRespond={onRespond} />;

  if (name === "get_events") {
    if (part.state === "input-streaming" || part.state === "input-available") {
      return <Status>Looking up events{input.city ? ` in ${input.city}` : ""}…</Status>;
    }
    if (part.state === "output-error") return <Status>Could not look up events.</Status>;
    if (part.state !== "output-available") return null;

    const output = part.output as ToolOutput;
    if (!output.ok) return <Status>{output.message}</Status>;
    const events = output.events ?? [];
    return (
      <details className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
        <summary className="cursor-pointer text-muted">
          Found {events.length} event{events.length === 1 ? "" : "s"}
          {input.city ? ` in ${input.city}` : ""}
        </summary>
        <ul className="mt-2 flex flex-col gap-1">
          {events.map((event) => (
            <li key={event.id}>
              <span className="font-medium">{event.name}</span>{" "}
              <span className="text-muted">
                · {event.city}, {event.venueName} · {formatStart(event.startsAt)} · {event.availableSeats} free
              </span>
            </li>
          ))}
        </ul>
      </details>
    );
  }

  return null; // a tool this version of the UI does not know
}

type CardProps = {
  part: Part;
  input: { eventName?: string; eventId?: string; seats?: number };
  onRespond: Respond;
};

function BookingCard({ part, input, onRespond }: CardProps) {
  const what = `${input.seats ?? "?"} seat${input.seats === 1 ? "" : "s"} at ${input.eventName || input.eventId || "this event"}`;

  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return <Status>Preparing a booking…</Status>;
    case "approval-requested":
      return (
        <div className="rounded-xl border border-accent/50 bg-surface p-3 text-sm">
          <p className="font-medium">Book {what}?</p>
          <p className="mt-1 text-muted">The booking uses your GitHub email. Nothing is booked until you approve.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onRespond(part.approval.id, true)}
              className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-foreground hover:opacity-90"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => onRespond(part.approval.id, false)}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-background"
            >
              Reject
            </button>
          </div>
        </div>
      );
    case "approval-responded":
      return <Status>{part.approval.approved ? `Booking ${what}…` : "Booking rejected."}</Status>;
    case "output-denied":
      return <Status>You rejected booking {what}.</Status>;
    case "output-error":
      return <Status>The booking could not be made.</Status>;
    case "output-available": {
      const output = part.output as ToolOutput;
      if (!output.ok) return <Status>Not booked: {output.message}</Status>;
      return (
        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          ✓ Booked {what}.{" "}
          <Link href="/bookings" className="text-accent underline">
            See your bookings
          </Link>
        </p>
      );
    }
    default:
      return null;
  }
}

function Status({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted italic">{children}</p>;
}
