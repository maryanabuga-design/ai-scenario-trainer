import { Gradient } from "@/components/Gradient/Gradient";
import { Tag } from "@/components/Tag/Tag";
import { fileTypeLabel } from "@/lib/materials";

/** Gradient cover for the sample guide, with its file-type tag like every other cover. */
export function MaterialCover({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  return (
    <Gradient
      tone="warm"
      className={`flex shrink-0 items-center justify-center rounded-panel [--mesh-blur:12px] ${size === "lg" ? "h-24 w-24" : "h-14 w-14"}`}
    >
      <span aria-hidden="true">
        <Tag tone="sage">{fileTypeLabel(type)}</Tag>
      </span>
    </Gradient>
  );
}
