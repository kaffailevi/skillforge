import { createLocalStore } from "@/lib/local-store";
import { ModelChoice } from "@/lib/providers";

// The learner's provider/model pick, remembered in the browser. Default: Gemini 3.5 Flash.
export const modelChoiceStore = createLocalStore("skillforge.model", ModelChoice, () => ({
  provider: "google" as const,
  model: "gemini-3.5-flash",
}));
