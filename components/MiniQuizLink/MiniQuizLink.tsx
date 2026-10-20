import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { homeImages } from "@/lib/home";
import { homeArtwork } from "@/lib/media-frames";

/**
 * The Mini-quiz row of Home and the Mini-quiz card of Training (DESIGN.md: Media3D): one component, so
 * the clipboard picture (64 by 60 frame), its 12px gap to the text, the vertical centring and the
 * text position are the same in both places. `minHeight` is each place's own height rule.
 */
export function MiniQuizLink({
  href,
  subtitle,
  minHeight,
  clampSubtitle = false,
}: {
  href: string;
  subtitle: string;
  /** The place's own minimum height as a Tailwind class (Home 104px, Training 64px). */
  minHeight: string;
  clampSubtitle?: boolean;
}) {
  return (
    <Link
      href={href}
      data-mini-quiz
      className={`flex ${minHeight} items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2`}
    >
      {/* the picture and the text are one block, centred on each other; the block is centred in the row */}
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <Media3D variant="row" src={homeImages.iconMiniQuiz} artwork={homeArtwork.iconMiniQuiz} />
        <span data-mini-quiz-text className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-body-strong">Mini-quiz</span>
          <span className={`type-small text-text-secondary ${clampSubtitle ? "line-clamp-2" : ""}`}>
            {subtitle}
          </span>
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
