import { Gradient } from "@/components/Gradient/Gradient";

/** Gradient square for a material. Each material keeps a fixed tone. */
export function MaterialCover({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Gradient
      tone="warm"
      className={`shrink-0 rounded-panel [--mesh-blur:12px] ${size === "lg" ? "h-24 w-24" : "h-14 w-14"}`}
    />
  );
}
