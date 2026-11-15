"use client";

import { useState, type FormEvent } from "react";
import { apiKeyStore, keyHeaders } from "@/lib/api-key-store";
import { ApiKey, maskKey } from "@/lib/api-keys";
import { useLocalStore } from "@/lib/local-store";

type Notice = { kind: "ok" | "error"; text: string };

// serverKey: whether SkillForge's server has its own Gemini key (only that fact, never the key).
export function SettingsForm({ serverKey }: { serverKey: boolean }) {
  const keys = useLocalStore(apiKeyStore);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [testing, setTesting] = useState(false);

  if (!keys) return <p className="p-6 text-sm text-muted">Loading…</p>;
  const savedKey = keys.google;

  function save(event: FormEvent) {
    event.preventDefault();
    const parsed = ApiKey.safeParse(draft);
    if (!parsed.success) {
      setNotice({
        kind: "error",
        text: parsed.error.issues[0]?.message ?? "Invalid key.",
      });
      return;
    }
    apiKeyStore.set({ google: parsed.data });
    setDraft("");
    setNotice({
      kind: "ok",
      text: "Key saved in this browser. Gemini is now available in the chat.",
    });
  }

  function remove() {
    apiKeyStore.set({ google: "" });
    setNotice({ kind: "ok", text: "Key removed from this browser." });
  }

  async function test() {
    setTesting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/check-key", {
        method: "POST",
        headers: keyHeaders(),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message: string;
      };
      setNotice({ kind: result.ok ? "ok" : "error", text: result.message });
    } catch {
      setNotice({ kind: "error", text: "Could not reach the server." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
          <section className="card flex flex-col gap-4 p-5 md:p-6">
            <h2 className="text-base font-semibold">Your Gemini API key</h2>
            {serverKey ? (
              <p className="text-sm text-muted">
                <strong className="text-foreground">Gemini works without a key of your own:</strong> SkillForge&apos;s
                server has one. To use your own quota instead, save your key here. It is kept only in this browser,
                sent to SkillForge&apos;s server with each message, used for that one call to Gemini, and never stored
                or logged there.
              </p>
            ) : (
              <p className="text-sm text-muted">
                SkillForge uses <strong>your own</strong> Google Gemini key, so you control your usage. The key is saved
                only in this browser. It is sent to SkillForge&apos;s server with each message, used for that one call
                to Gemini, and never stored or logged there. Without a key, the mock mentor answers.
              </p>
            )}
            <p className="text-sm">
              Get a free key in{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent underline underline-offset-2"
              >
                Google AI Studio
              </a>{" "}
              → <em>Create API key</em>.
            </p>

            {savedKey ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                <span className="flex-1">
                  Saved key: <code className="font-mono">{maskKey(savedKey)}</code>
                </span>
                <button
                  type="button"
                  onClick={() => void test()}
                  disabled={testing}
                  className="btn btn-secondary py-1.5"
                >
                  {testing ? "Testing…" : "Test key"}
                </button>
                <button type="button" onClick={remove} className="btn btn-danger py-1.5">
                  Remove
                </button>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border-strong px-3 py-2 text-sm text-muted">
                No key saved in this browser.{serverKey && " The chat uses SkillForge's key."}
              </p>
            )}

            <form onSubmit={save} className="flex gap-2">
              <input
                type="password"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setNotice(null);
                }}
                aria-label="Gemini API key"
                placeholder={savedKey ? "Paste a new key to replace it" : "Paste your Gemini API key"}
                autoComplete="off"
                spellCheck={false}
                className="field min-w-0 flex-1 font-mono"
              />
              <button type="submit" disabled={!draft.trim()} className="btn btn-primary">
                Save
              </button>
            </form>

            {notice && (
              <p role="status" className={`text-sm ${notice.kind === "error" ? "text-danger" : "text-success"}`}>
                {notice.text}
              </p>
            )}

            <p className="text-xs text-muted">
              On a shared computer, remove the key when you are done. Anyone using this browser profile can use it.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
