// Types shared by the browser and the server.

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

// One Server-Sent Event sent by /api/chat. The answer arrives as many "delta" events, then one "done".
export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
