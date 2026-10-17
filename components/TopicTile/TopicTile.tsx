import {
  Bandage,
  BellRing,
  BookOpen,
  FileText,
  ClipboardList,
  DoorOpen,
  Droplet,
  Flame,
  HeartPulse,
  MapPin,
  Phone,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/IconTile/IconTile";
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
  Flame,
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
  /** The 48px rounded square of the Steps summary card (12px radius, like the Materials rows). */
  square48: { tile: "h-12 w-12 rounded-[12px]", icon: 24, stroke: 2 },
} as const;

/** A topic's icon on a pastel tile coloured by its guide section, or on the shared icon tile. Decorative: the name sits next to it. */
export function TopicTile({
  sectionId,
  icon,
  size = "default",
  tone = "pastel",
}: {
  sectionId: string;
  icon: TopicIcon;
  size?: keyof typeof sizes;
  /** "icon" is the shared icon tile look (`IconTile`); "pastel" is the topic's own colour. */
  tone?: "pastel" | "icon";
}) {
  const Icon = icons[icon];
  const look = sizes[size];
  const shape = `${look.tile} ${size === "tile" || size === "square48" ? "" : "rounded-full"}`;
  if (tone === "icon") {
    return (
      <IconTile className={shape}>
        <Icon size={look.icon} strokeWidth={look.stroke} />
      </IconTile>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex ${shape} shrink-0 items-center justify-center text-text ${tints[topicTint(sectionId)]}`}
    >
      <Icon size={look.icon} strokeWidth={look.stroke} />
    </span>
  );
}
