import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { artworkTransform, homeFrames } from "@/lib/media-frames";
import type { Artwork } from "@/lib/media-frames";

export type Media3DVariant =
  "hero" | "step" | "icon" | "tile" | "row" | "panel" | "verify" | "card";

const frames = {
  hero: "h-[200px] w-[200px] rounded-[28px]",
  step: "aspect-[4/3] w-full rounded-[16px]",
  tile: "h-20 w-20 rounded-[16px]",
  row: "h-[72px] w-[72px] rounded-[16px]",
  // the 3D slot of Welcome and the onboarding slides (280px, shrinking with the screen height
  // down to 200px, 35dvh), and the Verify slot
  panel: "aspect-square w-[max(200px,min(280px,35dvh))] rounded-[28px]",
  verify: "h-[120px] w-[120px] rounded-[28px]",
  card: "h-14 w-14 rounded-[16px]",
} as const;

/**
 * Home's two pictures sit in FIXED frames fitted to the text next to them (`homeFrames`: the hero
 * card 76 by 60, the Mini-quiz row 64 by 60): the frame never changes size, the picture fills it and
 * never pushes the text. The files have transparent margins, so the picture is scaled inside the
 * clipped frame until its artwork fills it.
 */

/**
 * The one slot for 3D pictures. A hero (200px square, 28px radius) sits on Session setup and
 * Results; a step picture (full width, 4:3, 16px radius) sits above a question; an icon is the
 * existing icon tile, which stays the fallback. Hero and step show a dashed olive placeholder with
 * "3D" until a picture (`src`) is supplied. Home adds a `tile` (the hero card picture) and a
 * `row` icon (the Mini-quiz row picture); with a picture they are drawn bare (no background, border
 * or shadow) and decorative; without one the dashed olive square with only the "3D" caption shows.
 */
export function Media3D({
  variant,
  src,
  alt = "",
  fallback,
  artwork,
  priority = false,
}: {
  variant: Media3DVariant;
  src?: string;
  alt?: string;
  /** Where the artwork sits in the file; the picture is scaled so it fills the frame. */
  artwork?: Artwork;
  /** The flat icon tile an icon slot shows until it has a picture. */
  fallback?: ReactNode;
  /** Load at once (the first visible screen of a flow); otherwise the picture loads lazily. */
  priority?: boolean;
}) {
  if (variant === "icon") {
    return src ? (
      <Image src={src} alt={alt} width={48} height={48} className="h-12 w-12 object-contain" />
    ) : (
      <>{fallback}</>
    );
  }
  const frame = frames[variant];
  const bare =
    variant === "tile" ||
    variant === "row" ||
    variant === "panel" ||
    variant === "verify" ||
    variant === "card";
  // the Results hero with a picture is bare too (200px, no tile); without one it keeps the placeholder
  if (bare || (variant === "hero" && src)) {
    const size = homeFrames[variant];
    const fit = artwork ? artworkTransform(artwork, size) : null;
    return src ? (
      <span
        data-picture-frame
        aria-hidden="true"
        className="block shrink-0 overflow-hidden"
        style={
          variant === "panel"
            ? { width: "max(200px, min(280px, 35dvh))", aspectRatio: "1" }
            : { width: size.width, height: size.height }
        }
      >
        <Image
          src={src}
          alt={alt}
          width={size.width}
          height={size.height}
          unoptimized
          loading={priority ? "eager" : "lazy"}
          aria-hidden={alt === "" ? true : undefined}
          className="block h-full w-full object-contain"
          style={
            fit ? { transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` } : undefined
          }
        />
      </span>
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
