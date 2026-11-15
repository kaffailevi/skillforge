import { FlameIcon } from "@/components/icons";

// The SkillForge mark: an ember tile with a flame. Used in the sidebar, the phone header and on /signin.
export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = {
    sm: "size-7 rounded-md",
    md: "size-8 rounded-lg",
    lg: "size-12 rounded-xl",
  }[size];
  const icon = { sm: 15, md: 17, lg: 26 }[size];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-accent text-accent-foreground ${box}`}>
      <FlameIcon size={icon} />
    </span>
  );
}
