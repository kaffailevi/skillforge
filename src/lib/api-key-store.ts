import { ApiKeys, KEY_HEADER } from "@/lib/api-keys";
import { createLocalStore } from "@/lib/local-store";

// The learner's own provider keys, saved only in this browser (localStorage).
export const apiKeyStore = createLocalStore("skillforge.apiKeys", ApiKeys, () => ({ google: "" }));

// Headers for a request to our own server: the learner's key, if they saved one.
export function keyHeaders(): Record<string, string> {
  const key = apiKeyStore.get().google;
  return key ? { [KEY_HEADER]: key } : {};
}
