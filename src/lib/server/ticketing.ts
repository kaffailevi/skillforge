import "server-only";
import { z } from "zod";

// The course's Java backend (frit-ticketing-app) on Google Cloud Run, reached through its public
// api-gateway. Called only from the server: the gateway's API key never reaches the browser.
// Every function returns { data } or { error }, where error is a sentence the learner can read.

export type Result<T> = { data: T; error?: never } | { data?: never; error: string };

const EventSummary = z.object({
  id: z.string(),
  name: z.string(),
  venueName: z.string(),
  city: z.string(),
  startsAt: z.string(), // local date-time, e.g. 2027-03-05T10:00:00 (Europe/Bucharest)
  capacity: z.number(),
  availableSeats: z.number(),
});
export type EventSummary = z.infer<typeof EventSummary>;

const Booking = z.object({
  id: z.string(),
  eventId: z.string(),
  customerEmail: z.string(),
  seats: z.number(),
  bookedAt: z.string(),
});
export type Booking = z.infer<typeof Booking>;

const Notification = z.object({
  id: z.string(),
  bookingId: z.string(),
  text: z.string(),
  notifiedAt: z.string(),
});
export type Notification = z.infer<typeof Notification>;

// The backend's errors are ProblemDetails; a 409 adds availableSeats or startsAt.
const Problem = z.looseObject({
  detail: z.string().optional(),
  availableSeats: z.number().optional(),
  startsAt: z.string().optional(),
});

function backend(): { url: string; key: string } | null {
  const url = process.env.TICKETING_API_URL?.replace(/\/+$/, "");
  const key = process.env.TICKETING_API_KEY;
  return url && key ? { url, key } : null;
}

export function ticketingConfigured(): boolean {
  return backend() !== null;
}

const UNREACHABLE = "The events service is not reachable right now. Please try again in a minute.";

async function call(path: string, init?: { method: "POST"; body: unknown }): Promise<Result<unknown>> {
  const config = backend();
  if (!config) return { error: "The events service is not set up on this server (see docs/ticketing-backend.md)." };

  let response: Response;
  try {
    response = await fetch(`${config.url}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        "X-Api-Key": config.key,
        // One id for this request in the logs of all three backend services.
        "X-Correlation-Id": `skillforge-${crypto.randomUUID()}`,
        ...(init ? { "Content-Type": "application/json" } : {}),
      },
      body: init ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000), // Cloud Run may need a few seconds to start an instance
    });
  } catch (error) {
    console.error("Ticketing backend unreachable:", error instanceof Error ? error.message : error);
    return { error: UNREACHABLE };
  }

  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return { data: body };

  const problem = Problem.safeParse(body).data;
  switch (response.status) {
    case 404:
      return { error: problem?.detail ?? "That event does not exist." };
    case 409:
      if (problem?.availableSeats !== undefined) {
        return {
          error:
            problem.availableSeats === 0
              ? "Sorry, this event is sold out."
              : `Only ${problem.availableSeats} seat(s) are left for this event.`,
        };
      }
      if (problem?.startsAt) return { error: "This event has already started, so it can no longer be booked." };
      return { error: problem?.detail ?? "Someone else booked at the same moment. Please try again." };
    case 429: {
      const wait = Number(response.headers.get("Retry-After"));
      return {
        error: `Too many requests to the events service. Please wait ${wait > 0 ? `${wait} seconds` : "a moment"} and try again.`,
      };
    }
    case 400:
      return { error: problem?.detail ?? "The events service did not accept that request." };
    case 401:
    case 403:
      console.error(`Ticketing backend refused the API key (${response.status}). Check TICKETING_API_KEY.`);
      return { error: UNREACHABLE };
    default:
      console.error(`Ticketing backend answered ${response.status} for ${path}`);
      return { error: UNREACHABLE };
  }
}

function parsed<T>(result: Result<unknown>, schema: z.ZodType<T>): Result<T> {
  if (result.error !== undefined) return { error: result.error };
  const value = schema.safeParse(result.data);
  if (!value.success) {
    console.error("Unexpected answer from the ticketing backend:", value.error.message);
    return { error: UNREACHABLE };
  }
  return { data: value.data };
}

// "Iași" → "iasi": lower case, without diacritics.
function plain(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// Upcoming events (the backend lists only events that have not started), soonest first.
// The backend matches only a whole city name ("Cluj-Napoca"), while people and models say "Cluj" or "Iași",
// so the city is matched here, by the start of the name, ignoring case and diacritics.
export async function searchEvents(filter: { city?: string; name?: string }): Promise<Result<EventSummary[]>> {
  const suffix = filter.name ? `?${new URLSearchParams({ name: filter.name })}` : "";
  const result = parsed(await call(`/events${suffix}`), z.array(EventSummary));
  if (!result.data || !filter.city) return result;
  const city = plain(filter.city);
  return { data: result.data.filter((event) => plain(event.city).startsWith(city)) };
}

export async function bookSeats(eventId: string, customerEmail: string, seats: number): Promise<Result<Booking>> {
  return parsed(
    await call(`/events/${encodeURIComponent(eventId)}/bookings`, { method: "POST", body: { customerEmail, seats } }),
    Booking,
  );
}

// The confirmations the backend's notification service received for this email, newest first.
export async function notificationsFor(customerEmail: string): Promise<Result<Notification[]>> {
  const result = parsed(
    await call(`/notifications?customerEmail=${encodeURIComponent(customerEmail)}`),
    z.array(Notification),
  );
  return result.data ? { data: result.data.toSorted((a, b) => b.notifiedAt.localeCompare(a.notifiedAt)) } : result;
}
