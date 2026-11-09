"use client";

import { useState, type FormEvent } from "react";
import { useLocalStore } from "@/lib/local-store";
import { buildSystemPrompt } from "@/lib/mentor-prompt";
import { levelLabel, MAX_LEVEL, MAX_SKILLS, MIN_LEVEL, Profile } from "@/lib/profile";
import { profileStore } from "@/lib/profile-store";
import { TrashIcon } from "@/components/icons";

const LEVELS = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, index) => MIN_LEVEL + index);

export function ProfileForm() {
  const saved = useLocalStore(profileStore);
  if (!saved) return <p className="p-6 text-sm text-muted">Loading…</p>;
  return <ProfileEditor saved={saved} />;
}

type SkillRow = { key: string; name: string; level: number };
type Notice = { kind: "saved" | "error"; text: string };

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none";

function ProfileEditor({ saved }: { saved: Profile }) {
  const [displayName, setDisplayName] = useState(saved.displayName);
  const [role, setRole] = useState(saved.role);
  const [goal, setGoal] = useState(saved.goal);
  const [skills, setSkills] = useState<SkillRow[]>(() =>
    saved.skills.map((skill) => ({ key: crypto.randomUUID(), ...skill })),
  );
  const [notice, setNotice] = useState<Notice | null>(null);

  // Rows left without a name are dropped instead of blocking the save.
  const draft = {
    displayName,
    role,
    goal,
    skills: skills.filter((skill) => skill.name.trim()).map(({ name, level }) => ({ name, level })),
  };
  const preview = buildSystemPrompt(Profile.safeParse(draft).data ?? saved);

  function updateSkill(key: string, change: Partial<SkillRow>) {
    setSkills((rows) => rows.map((row) => (row.key === key ? { ...row, ...change } : row)));
    setNotice(null);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const parsed = Profile.safeParse(draft);
    if (!parsed.success) {
      setNotice({ kind: "error", text: parsed.error.issues.map((issue) => issue.message).join(" ") });
      return;
    }
    profileStore.set(parsed.data);
    setNotice({ kind: "saved", text: "Profile saved. The mentor uses it from your next message." });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-4 py-3 md:px-6">
        <h1 className="font-medium">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={save} onChange={() => setNotice(null)} className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
          <p className="text-sm text-muted">The mentor reads this before every answer.</p>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={60}
              autoComplete="name"
              className={`${inputClass} font-normal`}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Current role
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={80}
              placeholder="e.g. Computer science student, QA engineer"
              className={`${inputClass} font-normal`}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Goal
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. Get a junior full-stack job within a year"
              className={`${inputClass} resize-y font-normal`}
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Skills</legend>
            <p className="text-xs text-muted">Level from 1 (beginner) to 5 (expert).</p>
            {skills.length === 0 && <p className="text-sm text-muted">No skills yet.</p>}
            {skills.map((skill) => (
              <div key={skill.key} className="flex items-center gap-2">
                <input
                  value={skill.name}
                  onChange={(event) => updateSkill(skill.key, { name: event.target.value })}
                  maxLength={40}
                  aria-label="Skill name"
                  placeholder="e.g. React"
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <select
                  value={skill.level}
                  onChange={(event) => updateSkill(skill.key, { level: Number(event.target.value) })}
                  aria-label={`Level for ${skill.name || "this skill"}`}
                  className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level} — {levelLabel(level)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${skill.name || "this skill"}`}
                  onClick={() => {
                    setSkills((rows) => rows.filter((row) => row.key !== skill.key));
                    setNotice(null);
                  }}
                  className="rounded p-2 text-muted hover:text-danger"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={skills.length >= MAX_SKILLS}
              onClick={() => setSkills((rows) => [...rows, { key: crypto.randomUUID(), name: "", level: MIN_LEVEL }])}
              className="self-start rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-40"
            >
              Add skill
            </button>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">
              Save profile
            </button>
            {notice && (
              <p role="status" className={`text-sm ${notice.kind === "error" ? "text-danger" : "text-muted"}`}>
                {notice.text}
              </p>
            )}
          </div>

          <details className="rounded-lg border border-border p-3 text-sm">
            <summary className="cursor-pointer font-medium">What the mentor sees (system prompt)</summary>
            <pre className="mt-3 font-mono text-xs whitespace-pre-wrap text-muted">{preview}</pre>
          </details>
        </form>
      </div>
    </div>
  );
}
