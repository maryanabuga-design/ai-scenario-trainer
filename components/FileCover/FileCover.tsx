import { Tag } from "@/components/Tag/Tag";
import { fileTypeLabel } from "@/lib/materials";

/** Plain square cover for a material: its file-type tag on a soft tile. */
export function FileCover({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-panel bg-surface-muted ${
        size === "lg" ? "h-24 w-24" : "h-14 w-14"
      }`}
    >
      <Tag tone="sage">{fileTypeLabel(type)}</Tag>
    </span>
  );
}
