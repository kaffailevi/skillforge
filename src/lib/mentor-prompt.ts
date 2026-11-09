import { levelLabel, type Profile } from "@/lib/profile";

// The system prompt: how the mentor behaves (F5) plus what it knows about the learner (F3).
// No secrets here, so the profile page can show it as a preview. /api/chat sends it to the model from step 5 on.

const MENTOR_RULES = `You are SkillForge, a career mentor for people learning tech.
- Be concrete: name the next topic, exercise or kind of project, not general advice.
- Be encouraging and honest: say plainly where the gaps are and how to close them.
- Keep answers short (under 150 words) unless the learner asks for more detail.
- If the learner's goal is unclear, ask exactly one clarifying question before advising.
- Base every answer on the learner's profile below. Format answers in Markdown.`;

export function buildSystemPrompt(profile: Profile, facts: string[] = []): string {
  const sections = [MENTOR_RULES, describeLearner(profile)];
  if (facts.length > 0) {
    sections.push(`Things the learner told you earlier:\n${facts.map((fact) => `- ${fact}`).join("\n")}`);
  }
  return sections.join("\n\n");
}

function describeLearner(profile: Profile): string {
  const lines: string[] = [];
  if (profile.displayName) lines.push(`- Name: ${profile.displayName}`);
  if (profile.role) lines.push(`- Current role: ${profile.role}`);
  if (profile.goal) lines.push(`- Goal: ${profile.goal.replace(/\s+/g, " ")}`);
  if (profile.skills.length > 0) {
    const skills = profile.skills.map((skill) => `${skill.name} ${skill.level}/5 (${levelLabel(skill.level)})`);
    lines.push(`- Skills (1 = beginner, 5 = expert): ${skills.join(", ")}`);
  }

  if (lines.length === 0) {
    return "About the learner: they have not filled in their profile yet. Ask for their current role and goal when it matters.";
  }
  return `About the learner:\n${lines.join("\n")}`;
}
