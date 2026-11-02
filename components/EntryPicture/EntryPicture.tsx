"use client";

import { useState } from "react";

/** The decorative pictures of the entry screens (DESIGN.md: Entry pictures and no language choice). */
export const ENTRY_PICTURES = {
  profile: "/images/entry/entry-profile.webp",
  signIn: "/images/entry/entry-signin.webp",
  group: "/images/entry/entry-group.webp",
  invite: "/images/entry/entry-invite.webp",
} as const;

/**
 * The large decorative picture of an entry screen (DESIGN.md: Onboarding-style entry screens):
 * centred, 160px square (120px on screens lower than 700px, 96px lower than 600px, so the Primary
 * stays in view), empty alt text, 8px below it (the title block adds another 8px: 16px in all). If
 * the file is missing or fails to load nothing is drawn, so no empty space is left.
 */
export function EntryPicture({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a decorative picture, no optimiser needed
    <img
      ref={(el) => {
        // an error that happened before hydration is not reported by onError
        if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      }}
      data-entry-picture
      src={src}
      alt=""
      width={160}
      height={160}
      onError={() => setFailed(true)}
      className="mx-auto mb-2 h-[160px] w-[160px] object-contain [@media(max-height:599px)]:h-[96px] [@media(max-height:599px)]:w-[96px] [@media(min-height:600px)_and_(max-height:699px)]:h-[120px] [@media(min-height:600px)_and_(max-height:699px)]:w-[120px]"
    />
  );
}
