"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const CONTENT_EMPTY_IMAGE = "/images/instructor/content-empty.webp";
export const EMPTY_TITLE = "You have no topics yet.";
export const EMPTY_LINE = "Import a document to create your first topic.";

/** Three short rounded dashes, muted sage, on one side of the circle. */
function Dashes({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      data-dashes={side}
      className={`absolute top-1/2 flex -translate-y-1/2 flex-col gap-3 ${
        side === "left" ? "-left-9 items-end" : "-right-9 items-start"
      }`}
    >
      {[10, 16, 10].map((width, i) => (
        <span key={i} className="h-[3px] rounded-full bg-sage-dash" style={{ width }} />
      ))}
    </span>
  );
}

/**
 * The empty state of "Your topics" (DESIGN.md: One icon tile, a round topic code and a shared note):
 * the 3D picture centred at 160px (empty alt text), a semibold title and a muted line. If the file
 * is missing or fails to load, the earlier version shows instead so nothing breaks: a 144px round
 * sand circle with the flat document icon and short dashes on each side.
 */
export function ContentEmpty() {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  // an error that happened before this component was hydrated is not reported by onError
  useEffect(() => {
    const el = image.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <div data-content-empty className="flex flex-col items-center gap-3 px-4 py-6 text-center">
      {failed ? (
        <div className="relative" data-empty-fallback-art>
          <Dashes side="left" />
          <div
            data-empty-circle
            className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-secondary-sand"
          >
            <FileText
              data-empty-fallback
              size={56}
              strokeWidth={1.75}
              aria-hidden="true"
              className="text-text-secondary"
            />
          </div>
          <Dashes side="right" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a decorative picture, no optimiser needed
        <img
          ref={image}
          data-empty-picture
          src={CONTENT_EMPTY_IMAGE}
          alt=""
          width={160}
          height={160}
          className="h-40 w-40 object-contain"
          onError={() => setFailed(true)}
        />
      )}
      <h3 className="type-body-strong mt-3">{EMPTY_TITLE}</h3>
      <p className="type-body text-text-secondary">{EMPTY_LINE}</p>
    </div>
  );
}
