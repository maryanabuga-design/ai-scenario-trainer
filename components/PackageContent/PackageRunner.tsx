"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { OptionCard, OptionResult } from "@/components/OptionCard/OptionCard";
import { SituationCard } from "@/components/SituationCard/SituationCard";
import { GuidePill, PackageImage } from "@/components/PackageContent/PackageParts";
import { optionState } from "@/lib/option-state";
import { LETTERS } from "@/lib/package-read";
import type { Letter, PackageData } from "@/lib/package-read";

/** One question of a scenario or a quiz as the runner needs it. */
export type RunItem = {
  situation?: string;
  question: string;
  options: string[];
  correct: Letter;
  explanation: string;
  guideRef: string;
  imageFile: string;
  alt: string;
};

/** "7 of 10 correct". */
export const resultText = (correct: number, total: number) => `${correct} of ${total} correct`;

/**
 * A scenario or a quiz of a demo topic, answered on one screen with its own result ("7 of 10
 * correct", "Try again") (DESIGN.md: Instructor, content package import and demo topics). The
 * answers live in this component only: nothing is written to progress, history, readiness or any
 * other store, and reloading starts again.
 */
export function PackageRunner({
  data,
  items,
  guideHref,
  noun,
}: {
  data: PackageData;
  items: RunItem[];
  guideHref: (section: string) => string;
  /** "step" or "question". */
  noun: "step" | "question";
}) {
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<(Letter | null)[]>(() => items.map(() => null));
  const [done, setDone] = useState(false);
  const item = items[index];
  const correct = items.reduce((n, entry, i) => n + (choices[i] === entry.correct ? 1 : 0), 0);

  if (done) {
    return (
      <div className="flex flex-col gap-4" data-runner-result>
        <p data-result-text className="type-numeral text-center tabular-nums">
          {resultText(correct, items.length)}
        </p>
        <ul className="flex flex-col gap-3">
          {items.map((entry, i) => (
            <li
              key={i}
              data-result-item={i}
              className="flex flex-col gap-2 rounded-card border border-selectable-stroke bg-card p-3"
            >
              <p className="type-body-strong">
                {i + 1}. {entry.question}
              </p>
              <ul className="flex flex-col gap-2">
                {entry.options.flatMap((text, o) =>
                  text === ""
                    ? []
                    : [
                        <OptionResult
                          key={o}
                          state={optionState({
                            mode: "training",
                            optionId: LETTERS[o],
                            choice: choices[i],
                            checked: true,
                            correctOptionId: entry.correct,
                          })}
                        >
                          {text}
                        </OptionResult>,
                      ],
                )}
              </ul>
              <p className="type-small text-text-secondary">{entry.explanation}</p>
              {entry.guideRef.trim() !== "" && (
                <GuidePill
                  section={entry.guideRef.trim()}
                  href={guideHref(entry.guideRef.trim())}
                />
              )}
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          icon={RotateCcw}
          onClick={() => {
            setChoices(items.map(() => null));
            setIndex(0);
            setDone(false);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const last = index === items.length - 1;
  return (
    <div className="flex flex-col gap-4" data-runner>
      <p data-runner-position className="type-label text-text-secondary">
        {noun === "step" ? "STEP" : "QUESTION"} {index + 1} OF {items.length}
      </p>
      <PackageImage data={data} file={item.imageFile} alt={item.alt} />
      {item.situation && <SituationCard text={item.situation} />}
      <h2 className="type-item-title">{item.question}</h2>
      <fieldset className="flex min-w-0 flex-col gap-3" aria-label="Answers">
        {item.options.flatMap((text, o) =>
          text === ""
            ? []
            : [
                <OptionCard
                  key={`${index}-${o}`}
                  name={`package-answer-${index}`}
                  value={LETTERS[o]}
                  state={choices[index] === LETTERS[o] ? "selected" : "idle"}
                  locked={false}
                  onChange={(value) =>
                    setChoices((current) =>
                      current.map((c, i) => (i === index ? (value as Letter) : c)),
                    )
                  }
                >
                  {text}
                </OptionCard>,
              ],
        )}
      </fieldset>
      <ActionBar>
        <Button
          disabled={choices[index] === null}
          onClick={() => {
            if (last) setDone(true);
            else setIndex(index + 1);
          }}
        >
          {last ? "Finish" : "Next"}
        </Button>
      </ActionBar>
    </div>
  );
}
