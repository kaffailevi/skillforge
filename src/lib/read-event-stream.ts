import type { StreamEvent } from "@/lib/chat-types";

// Reads a Server-Sent Events body and yields each event as it arrives.
// Events are separated by a blank line; each data line starts with "data: ".
export async function* readEventStream(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true }); // stream: true keeps a character split across chunks intact

    let end = buffer.indexOf("\n\n");
    while (end !== -1) {
      const rawEvent = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice("data: ".length))
        .join("\n");
      if (data) yield JSON.parse(data) as StreamEvent;
      end = buffer.indexOf("\n\n");
    }
  }
}
