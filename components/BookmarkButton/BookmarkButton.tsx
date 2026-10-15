import { Bookmark } from "lucide-react";

/**
 * The 40px bookmark circle beside a question: white, a 1px stroke like the ArrowCircle, an outline
 * icon when the question is not saved and a filled one when it is. Tapping toggles it.
 */
export function BookmarkButton({ saved, onToggle }: { saved: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save question"}
      onClick={onToggle}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-arrow-stroke bg-surface text-primary shadow-(--arrow-shadow)"
    >
      <Bookmark
        size={20}
        strokeWidth={2}
        aria-hidden="true"
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}
