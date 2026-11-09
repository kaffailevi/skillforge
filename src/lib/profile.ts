import { z } from "zod";

// The learner's profile. Used by the browser (form, storage) and by the server (/api/chat), so no React here.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
export const MAX_SKILLS = 20;

const LEVEL_LABELS = ["Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

export function levelLabel(level: number): string {
  return LEVEL_LABELS[level - 1] ?? "";
}

export const Skill = z.object({
  name: z.string().trim().min(1, "Every skill needs a name.").max(40, "Skill names: at most 40 characters."),
  level: z.number().int().min(MIN_LEVEL).max(MAX_LEVEL),
});

export const Profile = z.object({
  displayName: z.string().trim().max(60, "Name: at most 60 characters."),
  role: z.string().trim().max(80, "Current role: at most 80 characters."),
  goal: z.string().trim().max(500, "Goal: at most 500 characters."),
  skills: z.array(Skill).max(MAX_SKILLS, `At most ${MAX_SKILLS} skills.`),
});

export type Skill = z.infer<typeof Skill>;
export type Profile = z.infer<typeof Profile>;

export const EMPTY_PROFILE: Profile = { displayName: "", role: "", goal: "", skills: [] };
