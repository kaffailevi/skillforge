export type ChatRole = "user" | "assistant";

// A message as the browser stores it: plain text. useChat's UIMessage is converted to and from this.
export type ChatMessage = { id: string; role: ChatRole; content: string };
