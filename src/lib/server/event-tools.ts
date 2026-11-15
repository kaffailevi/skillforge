import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { SessionUser } from "@/lib/server/session";
import { bookSeats, searchEvents } from "@/lib/server/ticketing";

// F12: the mentor's tools for learning events from the Java backend.
// get_events runs without asking; book_event_seat needs the learner's approval (see /api/chat).
// The booking always uses the signed-in learner's GitHub email: the model cannot choose it.

export function eventTools(user: SessionUser) {
  return {
    get_events: tool({
      description:
        "List upcoming learning events (workshops, meetups, conferences) with their id, venue, city, start time and free seats. " +
        "Filter by city and/or by a word from the event name; leave both empty to list everything.",
      inputSchema: z.object({
        city: z.string().trim().max(60).optional().describe("City, e.g. Cluj-Napoca, Iasi, Bucuresti, Brasov"),
        name: z.string().trim().max(60).optional().describe("A word from the event name, e.g. React, Spring, Cloud"),
      }),
      execute: async ({ city, name }) => {
        const result = await searchEvents({ city: city || undefined, name: name || undefined });
        return result.error !== undefined ? { ok: false as const, message: result.error } : { ok: true as const, events: result.data };
      },
    }),

    book_event_seat: tool({
      description:
        "Book seats at a learning event for the signed-in learner (their GitHub email is used automatically). " +
        "Use an event id returned by get_events. The learner must approve before it runs.",
      inputSchema: z.object({
        eventId: z.string().trim().min(1).max(80).describe("The event's id from get_events"),
        eventName: z.string().trim().max(120).describe("The event's name, shown to the learner on the approval card"),
        seats: z.number().int().min(1).max(10),
      }),
      execute: async ({ eventId, seats }) => {
        const result = await bookSeats(eventId, user.email, seats);
        return result.error !== undefined
          ? { ok: false as const, message: result.error }
          : { ok: true as const, booking: result.data };
      },
    }),
  };
}

export const EVENT_TOOL_RULES = `You can look up learning events with get_events and book seats with book_event_seat.
- When the learner asks about workshops, meetups or events, call get_events first and recommend events that fit their goal.
- Book only when the learner asks to. Use the exact event id from get_events. Never ask for their email: the booking uses their GitHub email.
- The learner approves or rejects each booking in the chat. If they reject it, acknowledge it briefly and do not try again unless they ask.
- If a tool answers ok: false, tell the learner its message in plain words; do not retry the same call.`;
