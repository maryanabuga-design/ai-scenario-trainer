import { FileText, Link2 } from "lucide-react";
import { fileTypeLabel, materialKind } from "@/lib/materials";

/**
 * A material's tile: a document or link icon with its plain type label, on the one material tile
 * colour (the same for every type). Decorative: the type is also in the meta line.
 */
export function MaterialTile({ type }: { type: string }) {
  const Icon = materialKind(type) === "link" ? Link2 : FileText;
  return (
    <span
      aria-hidden="true"
      className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[20px] bg-material-tile"
    >
      <Icon size={24} strokeWidth={2} className="text-primary" />
      <span className="type-label text-primary">{fileTypeLabel(type)}</span>
    </span>
  );
}
