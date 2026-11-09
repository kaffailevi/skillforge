import { Chat } from "@/components/chat";
import { availableProviders } from "@/lib/server/models";

export default function Home() {
  // Only the names of providers whose key is set reach the browser, never the keys.
  return <Chat available={availableProviders()} />;
}
