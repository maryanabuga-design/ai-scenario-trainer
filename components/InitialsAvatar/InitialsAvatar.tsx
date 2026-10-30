"use client";

import { useState } from "react";

const sizes = {
  32: "h-8 w-8 type-caption-strong",
  48: "h-12 w-12 type-body-strong",
  64: "h-16 w-16 type-body-strong text-[length:var(--text-xl)]",
} as const;

/**
 * The initials avatar (DESIGN.md: "photo-ready, initials for now"): an olive-tint circle with the
 * initials. It takes an optional image URL and shows the initials when there is none or when the
 * image fails to load. Decorative: the name next to it carries the meaning.
 */
export function InitialsAvatar({
  initials,
  size = 48,
  image,
}: {
  initials: string;
  size?: keyof typeof sizes;
  /** An optional picture. No pictures exist in the prototype yet. */
  image?: string;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const showImage = image !== undefined && image !== "" && failedImage !== image;
  return (
    <span
      aria-hidden="true"
      data-initials-avatar
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-olive-tint text-primary ${sizes[size]}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small decorative avatar, any source
        <img
          src={image}
          alt=""
          data-avatar-image
          ref={(el) => {
            // a picture that failed before the page was ready never fires onError
            if (el && el.complete && el.naturalWidth === 0) setFailedImage(image);
          }}
          onError={() => setFailedImage(image)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
