import { Tag } from "@/components/Tag/Tag";
import { fileTypeLabel } from "@/lib/materials";

/** The cover of every material: its file type on the one icon-tile colour. */
export function FileCover({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-panel bg-icon-tile ${
        size === "lg" ? "h-24 w-24" : "h-14 w-14"
      }`}
    >
      <Tag>{fileTypeLabel(type)}</Tag>
    </span>
  );
}
