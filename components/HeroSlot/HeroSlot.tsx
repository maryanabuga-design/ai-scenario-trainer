import { Check, Repeat2, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

export type HeroKind = "passed" | "notPassed" | "setup";

/**
 * The pictures for each slot. Set `src` to a file in public/heroes/ (hero-passed.webp,
 * hero-not-passed.webp, hero-setup.webp) once it exists; without one the fallback is drawn.
 */
export const heroImages: Record<HeroKind, { src?: string; alt: string }> = {
  passed: { alt: "" },
  notPassed: { alt: "" },
  setup: { alt: "" },
};

const fallbackIcons: Record<HeroKind, LucideIcon> = {
  passed: Check,
  notPassed: Repeat2,
  setup: Target,
};

/**
 * A picture slot about 200px high (a transparent WebP from public/heroes/). Without a picture it
 * draws a light olive circle with an icon, so the layout is the same either way.
 */
export function HeroSlot({ kind, src, alt = "" }: { kind: HeroKind; src?: string; alt?: string }) {
  const Icon = fallbackIcons[kind];
  return (
    <div className="flex h-[200px] items-center justify-center">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={200}
          height={200}
          className="h-[200px] w-auto object-contain"
        />
      ) : (
        <span
          data-hero-fallback
          aria-hidden="true"
          className="flex h-24 w-24 items-center justify-center rounded-full bg-olive-tint text-primary"
        >
          <Icon size={40} strokeWidth={2} />
        </span>
      )}
    </div>
  );
}
