"use client";

import { useState } from "react";

/** The decorative pictures of the entry screens (DESIGN.md: Entry pictures and no language choice). */
export const ENTRY_PICTURES = {
  profile: "/images/entry/entry-profile.webp",
  signIn: "/images/entry/entry-signin.webp",
} as const;

/**
 * A decorative picture above the title of an entry screen: about 112px (88px on screens lower than
 * 700px, so the Primary stays in view), left-aligned, empty alt text, with 8px below it (the title
 * block adds another 8px, 16px in all). If the file is missing or fails to load nothing is drawn, so
 * no empty space is left.
 */
export function EntryPicture({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a small decorative picture, no optimiser needed
    <img
      ref={(el) => {
        // an error that happened before hydration is not reported by onError
        if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      }}
      data-entry-picture
      src={src}
      alt=""
      width={112}
      height={112}
      onError={() => setFailed(true)}
      className="mb-2 h-[112px] w-[112px] object-contain [@media(max-height:699px)]:h-[88px] [@media(max-height:699px)]:w-[88px]"
    />
  );
}
