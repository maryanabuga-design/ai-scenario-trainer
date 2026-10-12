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
import { topicTone } from "@/lib/weak-topics";

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

const tones = { yellow: "bg-tag-yellow", blue: "bg-tag-blue" };

/** A topic's icon on a pastel tile coloured by its material. Decorative: the name sits next to it. */
export function TopicTile({ sectionId, icon }: { sectionId: string; icon: TopicIcon }) {
  const Icon = icons[icon];
  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-text ${tones[topicTone(sectionId)]}`}
    >
      <Icon size={24} strokeWidth={2} />
    </span>
  );
}
