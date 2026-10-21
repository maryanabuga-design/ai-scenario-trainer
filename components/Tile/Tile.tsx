import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Media3D } from "@/components/Media3D/Media3D";
import { TileIcon } from "@/components/TileIcon/TileIcon";

/**
 * The dashboard tile (DESIGN.md: Home tiles), shared by the Student Home and the Instructor Overview:
 * the neutral icon circle, the title and a one-line subtitle in a card of a fixed minimum height. The
 * whole card is the link.
 */
export function Tile({
  href,
  title,
  subtitle,
  icon,
  tileId,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** For tests. */
  tileId?: string;
}) {
  return (
    <Link
      href={href}
      data-tile={tileId}
      className="flex h-full min-h-32 flex-col justify-between gap-4 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <Media3D variant="icon" fallback={<TileIcon icon={icon} />} />
      <span className="flex flex-col gap-0.5">
        <span className="type-body-strong">{title}</span>
        <span className="type-small text-text-secondary">{subtitle}</span>
      </span>
    </Link>
  );
}
