import { Gradient } from "@/components/Gradient/Gradient";
import { MaterialTileContent } from "@/components/MaterialTile/MaterialTile";

/** Gradient cover for the sample guide, with its icon and type label like every other tile. */
export function MaterialCover({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  return (
    <Gradient
      tone="warm"
      className={`flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-panel [--mesh-blur:12px] ${size === "lg" ? "h-24 w-24" : "h-14 w-14"}`}
    >
      <span aria-hidden="true" className="contents">
        <MaterialTileContent type={type} />
      </span>
    </Gradient>
  );
}
