import { Chat } from "@/components/chat";
import { serverProviders } from "@/lib/server/models";

export default function Home() {
  // Only the names of providers with a server key reach the browser, never the keys.
  return <Chat serverProviders={serverProviders()} />;
}
