import { Button, ButtonLink } from "@/components/Button/Button";
import { Media3D } from "@/components/Media3D/Media3D";
import { homeImages } from "@/lib/home";
import { homeArtwork } from "@/lib/media-frames";
import { TODAY_COUNT } from "@/lib/todays-practice";

/** The Mini-quiz picker, where "Choose length" and "Practise more" lead. */
export const pickerPath = "/mini-quiz?from=home";

/**
 * Today's practice (DESIGN.md: Today's practice), the card on Home: 5 questions and a Primary "Start
 * practice" that starts at once, with a small "Choose length" link to the picker; once today's 5 are
 * finished it says "Done for today" with the count and a Secondary "Practise more". It is back to the
 * start state the next calendar day.
 */
export function TodaysPractice({
  result,
  onStart,
}: {
  /** Today's count when the 5 questions are finished, otherwise null (the start state). */
  result: { correct: number; total: number } | null;
  onStart: () => void;
}) {
  return (
    <section
      aria-labelledby="todays-title"
      data-todays={result ? "done" : "start"}
      className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-(--card-shadow)"
    >
      <div className="flex items-center gap-3">
        <Media3D variant="row" src={homeImages.iconMiniQuiz} artwork={homeArtwork.iconMiniQuiz} />
        <div data-todays-text className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id="todays-title" className="type-body-strong">
            {result ? "Done for today" : "Today's practice"}
          </h2>
          <p className="type-small text-text-secondary">
            {result ? `${result.correct} of ${result.total} correct` : `${TODAY_COUNT} questions`}
          </p>
        </div>
      </div>
      {result ? (
        <ButtonLink href={pickerPath} variant="secondary">
          Practise more
        </ButtonLink>
      ) : (
        <>
          <Button onClick={onStart}>Start practice</Button>
          <div className="-my-2 flex justify-center">
            <ButtonLink href={pickerPath} variant="tertiary">
              Choose length
            </ButtonLink>
          </div>
        </>
      )}
    </section>
  );
}
