import type { LucideIcon } from "lucide-react";

const tones = {
  yellow: "bg-pastel-yellow",
  blue: "bg-pastel-blue",
  peach: "bg-pastel-peach",
  lilac: "bg-pastel-lilac",
  green: "bg-pastel-green",
  sand: "bg-pastel-sand",
} as const;

export type TileTone = keyof typeof tones;

/** The flat icon on a pastel circle (the compact size: 36px circle, 18px icon): the Media3D icon fallback. */
export function TileIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: TileTone }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text ${tones[tone]}`}
    >
      <Icon size={18} strokeWidth={1.75} />
    </span>
  );
}
