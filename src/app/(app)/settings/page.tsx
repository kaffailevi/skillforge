import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { serverProviders } from "@/lib/server/models";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  // Only whether the server has a Gemini key reaches the browser, never the key.
  return <SettingsForm serverKey={serverProviders().includes("google")} />;
}
