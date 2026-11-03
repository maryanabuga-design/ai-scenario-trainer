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

/** The two sizes of the one neutral icon tile: "default" 48px and "compact" 40px. */
type TileSize = "default" | "compact";

/**
 * Any outline icon on the one neutral icon tile (`IconTile`) at one of its two sizes: 48px by
 * default (Materials rows, Field of work rows, Overview rows) and 40px compact (Weak topics rows).
 */
export function LucideTile({
  icon: Icon,
  size = "default",
  tileId,
}: {
  icon: LucideIcon;
  size?: TileSize;
  tileId?: string;
}) {
  return (
    <IconTile size={size} tileId={tileId}>
      <Icon strokeWidth={2} />
    </IconTile>
  );
}

/** A topic's icon on the one neutral icon tile (`IconTile`). Decorative: the name sits next to it. */
export function TopicTile({ icon, size = "default" }: { icon: TopicIcon; size?: TileSize }) {
  return <LucideTile icon={icons[icon]} size={size} />;
}
