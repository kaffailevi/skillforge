"use client";

import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";
import Link from "next/link";
import { CheckIcon, TicketIcon } from "@/components/icons";

// How a tool call looks in the chat (step 12): a short status line while it runs, a compact
// result, and for book_event_seat an approval card. Nothing is booked before "Approve".

type Part = ToolUIPart | DynamicToolUIPart;
type Respond = (approvalId: string, approved: boolean) => void;

type EventItem = {
  id: string;
  name: string;
  city: string;
  venueName: string;
  startsAt: string;
  availableSeats: number;
};
type ToolOutput =
  | {
      ok: true;
      events?: EventItem[];
      booking?: { seats: number; eventId: string };
    }
  | { ok: false; message: string };

const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatStart(startsAt: string): string {
  const date = new Date(startsAt); // a local date-time without a zone: read as local time
  return Number.isNaN(date.getTime()) ? startsAt : when.format(date);
}

export function ToolPart({ part, onRespond }: { part: Part; onRespond: Respond }) {
  const name = getToolName(part);
  const input = (part.input ?? {}) as {
    city?: string;
    name?: string;
    eventName?: string;
    eventId?: string;
    seats?: number;
  };

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
      <details className="card px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">
          Found {events.length} event{events.length === 1 ? "" : "s"}
          {input.city ? ` in ${input.city}` : ""}
        </summary>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-0.5 py-2">
              <span className="font-medium">{event.name}</span>
              <span className="text-muted">
                {event.city}, {event.venueName} · {formatStart(event.startsAt)} ·{" "}
                <span className="text-foreground">{event.availableSeats} seats free</span>
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
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <span className="text-accent">
              <TicketIcon />
            </span>
            Book {what}?
          </p>
          <p className="mt-1 text-muted">The booking uses your GitHub email. Nothing is booked until you approve.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => onRespond(part.approval.id, true)} className="btn btn-primary">
              Approve
            </button>
            <button type="button" onClick={() => onRespond(part.approval.id, false)} className="btn btn-secondary">
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
        <p className="card flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckIcon />
          </span>
          <span className="flex-1">Booked {what}.</span>
          <Link href="/bookings" className="font-medium text-accent underline underline-offset-2">
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
  return <p className="text-sm text-muted">{children}</p>;
}
