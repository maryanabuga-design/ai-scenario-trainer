"use client";

import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import type { Hint, Item } from "@/lib/items";
import { checkAnnouncement } from "@/lib/option-state";

/**
 * The feedback of a checked answer in practice (DESIGN.md: Practice: answer feedback and hint as
 * bottom sheets): Correct with the explanation, or Not quite with the correct answer, the
 * explanation and the Guide chip, then the one Primary Next ("See results" on the last question).
 * It replaces the pinned bar; nothing on the page moves.
 */
export function FeedbackSheet({
  item,
  choice,
  last,
  disabled = false,
  note,
  onHeight,
  inline,
  onNext,
}: {
  /** Only for the screen review page. */
  inline?: boolean;
  item: Item;
  choice: string;
  last: boolean;
  /** The last question cannot be finished while another one has no answer. */
  disabled?: boolean;
  /** A line above the buttons: which question still needs an answer. */
  note?: string | null;
  /** The height of the sheet, so the page can leave room under the last option. */
  onHeight?: (height: number) => void;
  onNext: () => void;
}) {
  const correct = choice === item.correctOptionId;
  const right = item.options.find((option) => option.id === item.correctOptionId)?.text ?? "";
  const section = item.guideRef[0];
  return (
    <BottomSheet
      variant="feedback"
      inline={inline}
      tone={correct ? "correct" : "wrong"}
      title={correct ? "Correct" : "Not quite"}
      announcement={checkAnnouncement(item, choice)}
      onHeight={onHeight}
      actions={
        <>
          {note && <p className="type-small text-center text-text-secondary">{note}</p>}
          <Button disabled={disabled} onClick={onNext}>
            {last ? "See results" : "Next"}
          </Button>
        </>
      }
    >
      {!correct && <p className="type-body-strong">Correct answer: {right}</p>}
      <p>{item.why}</p>
      {section && <GuideLink sectionId={section} />}
    </BottomSheet>
  );
}

/** The hint of a question, in a modal sheet opened by the lightbulb: a reminder, never the answer. */
export function HintSheet({
  hint,
  onClose,
  returnFocus,
  inline,
}: {
  /** Only for the screen review page. */
  inline?: boolean;
  hint: Hint;
  onClose: () => void;
  returnFocus: HTMLElement | null;
}) {
  return (
    <BottomSheet
      variant="hint"
      inline={inline}
      title="Hint"
      onClose={onClose}
      returnFocus={returnFocus}
      actions={<Button onClick={onClose}>Got it</Button>}
    >
      <p>{hint.text}</p>
      {hint.section && <GuideLink sectionId={hint.section} />}
    </BottomSheet>
  );
}

/** The Guide chip under the text of a sheet, left aligned; it opens the linked guide section. */
function GuideLink({ sectionId }: { sectionId: string }) {
  return (
    <div className="mt-2 flex">
      <GuideChip sectionId={sectionId} />
    </div>
  );
}
