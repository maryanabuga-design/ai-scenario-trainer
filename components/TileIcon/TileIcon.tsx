import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/IconTile/IconTile";

/** The flat icon on the one neutral tile (36px circle, 18px icon): the Media3D icon fallback of the Home tiles. */
export function TileIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <IconTile className="h-9 w-9 rounded-full">
      <Icon size={18} strokeWidth={1.75} />
    </IconTile>
  );
}
