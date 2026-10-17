import { FileText, Link2 } from "lucide-react";
import { IconTile } from "@/components/IconTile/IconTile";
import { fileTypeLabel, materialKind } from "@/lib/materials";

/**
 * A material's tile: a document or link icon with its plain type label, on the one material tile
 * colour (the same for every type). Decorative: the type is also in the meta line.
 */
export function MaterialTile({ type }: { type: string }) {
  const Icon = materialKind(type) === "link" ? Link2 : FileText;
  return (
    <IconTile className="h-16 w-16 flex-col gap-0.5 rounded-[20px]">
      <Icon size={24} strokeWidth={2} />
      <span className="type-label text-primary">{fileTypeLabel(type)}</span>
    </IconTile>
  );
}
