import { Chat } from "@/components/chat";

export default function Home() {
  return (
    <>
      <header className="border-b border-foreground/10 px-4 py-3">
        <h1 className="text-lg font-semibold">SkillForge</h1>
        <p className="text-sm text-foreground/60">Your AI career mentor</p>
      </header>
      <main className="flex flex-1 flex-col">
        <Chat />
      </main>
    </>
  );
}
