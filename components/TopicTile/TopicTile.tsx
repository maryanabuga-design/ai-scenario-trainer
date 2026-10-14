import {
  Bandage,
  BellRing,
  BookOpen,
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
} as const;

/** A topic's icon on a pastel tile coloured by its guide section. Decorative: the name sits next to it. */
export function TopicTile({
  sectionId,
  icon,
  size = "default",
}: {
  sectionId: string;
  icon: TopicIcon;
  size?: keyof typeof sizes;
}) {
  const Icon = icons[icon];
  const look = sizes[size];
  return (
    <span
      aria-hidden="true"
      className={`flex ${look.tile} shrink-0 items-center justify-center rounded-full text-text ${tints[topicTint(sectionId)]}`}
    >
      <Icon size={look.icon} strokeWidth={look.stroke} />
    </span>
  );
}
