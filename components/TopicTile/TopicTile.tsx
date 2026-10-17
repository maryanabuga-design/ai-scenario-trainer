import {
  Bandage,
  BellRing,
  BookOpen,
  FileText,
  ClipboardList,
  DoorOpen,
  Droplet,
  HeartPulse,
  MapPin,
  Phone,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TopicIcon } from "@/lib/weak-topics";
import { topicTint } from "@/lib/weak-topics";
import type { TopicTint } from "@/lib/weak-topics";

const icons: Record<TopicIcon, LucideIcon> = {
  BellRing,
  DoorOpen,
  Wind,
  MapPin,
  Phone,
  HeartPulse,
  Bandage,
  ClipboardList,
  Droplet,
  BookOpen,
  FileText,
};

const tints: Record<TopicTint, string> = {
  yellow: "bg-pastel-yellow",
  blue: "bg-pastel-blue",
  lilac: "bg-pastel-lilac",
  green: "bg-pastel-green",
  peach: "bg-pastel-peach",
};

/** "compact" (36px circle, 18px icon) is for the Weak topics rows only. */
const sizes = {
  default: { tile: "h-12 w-12", icon: 24, stroke: 2 },
  compact: { tile: "h-9 w-9", icon: 18, stroke: 1.75 },
  /** The 44px rounded square of the Materials rows (12px radius, not a circle). */
  tile: { tile: "h-11 w-11 rounded-[12px]", icon: 22, stroke: 2 },
  /** The 44px circle of the Steps list cards. */
  circle44: { tile: "h-11 w-11", icon: 22, stroke: 2 },
} as const;

/** A topic's icon on a pastel tile coloured by its guide section (or the olive tint in a selectable row). Decorative: the name sits next to it. */
export function TopicTile({
  sectionId,
  icon,
  size = "default",
  tone = "pastel",
}: {
  sectionId: string;
  icon: TopicIcon;
  size?: keyof typeof sizes;
  /** "olive" is the one light olive tint of every selectable row; "pastel" is the topic's own colour. */
  tone?: "pastel" | "olive";
}) {
  const Icon = icons[icon];
  const look = sizes[size];
  return (
    <span
      aria-hidden="true"
      className={`flex ${look.tile} shrink-0 items-center justify-center ${size === "tile" ? "" : "rounded-full"} text-text ${tone === "olive" ? "bg-olive-tint" : tints[topicTint(sectionId)]}`}
    >
      <Icon size={look.icon} strokeWidth={look.stroke} />
    </span>
  );
}
