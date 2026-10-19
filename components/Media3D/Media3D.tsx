import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

export type Media3DVariant = "hero" | "step" | "icon" | "tile" | "row";

const frames = {
  hero: "h-[200px] w-[200px] rounded-[28px]",
  step: "aspect-[4/3] w-full rounded-[16px]",
  tile: "h-20 w-20 rounded-[16px]",
  row: "h-[72px] w-[72px] rounded-[16px]",
} as const;

/**
 * The sizes of Home's two pictures, shown with no background, border or shadow: the hero card
 * picture (96px) and the Mini-quiz row picture (72px). The placeholders keep the frames above.
 */
const pictures = {
  tile: { size: 96, className: "h-24 w-24" },
  row: { size: 72, className: "h-[72px] w-[72px]" },
} as const;

/**
 * The one slot for 3D pictures. A hero (200px square, 28px radius) sits on Session setup and
 * Results; a step picture (full width, 4:3, 16px radius) sits above a question; an icon is the
 * existing icon tile, which stays the fallback. Hero and step show a dashed olive placeholder with
 * "3D" until a picture (`src`) is supplied. Home adds a `tile` (the hero card, 96px picture) and a
 * `row` icon (72px picture, Mini-quiz row); with a picture they are drawn bare (no background, border
 * or shadow) and decorative; without one the dashed olive square with only the "3D" caption shows.
 */
export function Media3D({
  variant,
  src,
  alt = "",
  fallback,
}: {
  variant: Media3DVariant;
  src?: string;
  alt?: string;
  /** The flat icon tile an icon slot shows until it has a picture. */
  fallback?: ReactNode;
}) {
  if (variant === "icon") {
    return src ? (
      <Image src={src} alt={alt} width={48} height={48} className="h-12 w-12 object-contain" />
    ) : (
      <>{fallback}</>
    );
  }
  const frame = frames[variant];
  if (variant === "tile" || variant === "row") {
    return src ? (
      <Image
        src={src}
        alt={alt}
        width={pictures[variant].size}
        height={pictures[variant].size}
        aria-hidden={alt === "" ? true : undefined}
        className={`shrink-0 object-contain ${pictures[variant].className}`}
      />
    ) : (
      <div
        data-media3d="placeholder"
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center border-[1.5px] border-dashed border-placeholder-stroke bg-olive-tint ${frame}`}
      >
        <span className="type-micro text-text-secondary">3D</span>
      </div>
    );
  }
  if (!src) {
    return (
      <div
        data-media3d="placeholder"
        aria-hidden="true"
        className={`flex shrink-0 flex-col items-center justify-center gap-1 border-[1.5px] border-dashed border-placeholder-stroke bg-olive-tint text-primary ${frame}`}
      >
        <ImageIcon size={28} strokeWidth={1.75} />
        <span className="type-micro text-text-secondary">3D</span>
      </div>
    );
  }
  return (
    <div className={`relative shrink-0 overflow-hidden ${frame}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={variant === "hero" ? "200px" : "430px"}
        className={variant === "hero" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}
