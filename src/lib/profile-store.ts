import { createLocalStore } from "@/lib/local-store";
import { EMPTY_PROFILE, Profile } from "@/lib/profile";

// The profile lives in the browser until Supabase arrives (step 10).
export const profileStore = createLocalStore("skillforge.profile", Profile, EMPTY_PROFILE);
