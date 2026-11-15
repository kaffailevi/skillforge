# Ticketing backend (learning events, step 12)

The mentor's event tools (F12) call the course's Java backend, [`kaffailevi/frit-ticketing-app`](https://github.com/kaffailevi/frit-ticketing-app), deployed on Google Cloud Run. SkillForge talks only to its public **api-gateway**; `ticketing-service` and `notification-service` stay private behind it.

```
browser ──► SkillForge server (/api/chat, /bookings) ──X-Api-Key──► api-gateway ──► ticketing-service ──RabbitMQ──► notification-service
```

The backend is called **only from the server** (`src/lib/server/ticketing.ts`), so the API key never reaches the browser.

## What SkillForge uses

| Call | Used by | |
| --- | --- | --- |
| `GET /events?name=` | tool `get_events` | Upcoming events only. The city is filtered in SkillForge by the start of the name, ignoring case and diacritics ("Cluj" finds "Cluj-Napoca"), because the backend matches only a whole city name. |
| `POST /events/{id}/bookings` `{customerEmail, seats}` | tool `book_event_seat` | Runs only after the learner clicks **Approve**. The email is always the signed-in learner's GitHub email, never one the model writes. |
| `GET /notifications?customerEmail=` | the **Bookings** page | The confirmations the notification service received. A new booking appears after a few seconds (it travels through RabbitMQ). |

Every request carries an `X-Correlation-Id` (`skillforge-<uuid>`), so one request can be followed through the logs of all three backend services.

### Errors shown to the learner

| Backend answer | Message |
| --- | --- |
| 409 with `availableSeats` | "Sorry, this event is sold out." / "Only N seat(s) are left for this event." |
| 409 with `startsAt` | "This event has already started…" |
| 429 (`Retry-After`) | "Too many requests to the events service. Please wait N seconds…" |
| 404, 400 | the backend's `detail` |
| 401/403, 5xx, timeout (20 s), network error | "The events service is not reachable right now…" (the real cause goes to the server log) |

When either variable below is missing, the chat works without the event tools.

## Environment variables

| Variable | Kind | Reaches the browser? | Where to get it |
| --- | --- | --- | --- |
| `TICKETING_API_URL` | config | no | The api-gateway's Cloud Run URL: `gcloud run services describe api-gateway --region europe-west1 --format "value(status.url)"` |
| `TICKETING_API_KEY` | **secret** | no | The gateway's `GATEWAY_API_KEY` (Secret Manager secret `gateway-api-key` in the backend's project). Copy it; never paste it in chat or commit it. |

Locally they can live in `.env.local`, or be set in the shell that starts `npm run dev`. On Vercel: Project → Settings → Environment Variables (Production), then redeploy.

## Before a demo

The notification service is a RabbitMQ consumer, so it must be running to receive confirmations. When it is scaled to zero to save money, set it back first:

```bash
gcloud run services update notification-service --region europe-west1 --min-instances 1
```

and back to `0` afterwards.
