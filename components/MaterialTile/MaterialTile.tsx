import { FileText, Link2 } from "lucide-react";
import { fileTypeLabel, materialKind } from "@/lib/materials";

/** The icon and plain type label of a material: a document, or a link for a web page. */
export function MaterialTileContent({ type }: { type: string }) {
  const Icon = materialKind(type) === "link" ? Link2 : FileText;
  return (
    <>
      <Icon size={24} strokeWidth={2} className="text-primary" />
      <span className="type-label text-primary">{fileTypeLabel(type)}</span>
    </>
  );
}

/** A material's tile on the list, the material page and the upload sheet. Decorative. */
export function MaterialTile({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-panel bg-surface-muted ${
        size === "lg" ? "h-24 w-24" : "h-14 w-14"
      }`}
    >
      <MaterialTileContent type={type} />
    </span>
  );
}
