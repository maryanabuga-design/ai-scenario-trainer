"use client";

import { useId, useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Media3D } from "@/components/Media3D/Media3D";
import { Ring } from "@/components/Ring/Ring";
import { SectionList } from "@/components/SectionList/SectionList";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { Toggle } from "@/components/Toggle/Toggle";
import type { GuideStats } from "@/lib/progress-stats";
import { keepOneHint } from "@/lib/sections";
import {
  fitLength,
  lengthOptions,
  onlyWeakSections,
  poolFor,
  questionCountLabel,
} from "@/lib/setup";
import type { SetupChoice, SetupMode } from "@/lib/setup";
import type { Training } from "@/lib/training";

export type SetupValue = {
  mode: SetupMode;
  length: number;
  sections: string[];
  shuffle: boolean;
  onlyWeak: boolean;
};

export const defaultSetup: SetupValue = {
  mode: "scenario",
  length: 10,
  sections: [],
  shuffle: false,
  onlyWeak: false,
};

/** The setup as the choices that build a session: only the weak sections when asked. */
export function setupChoice(
  value: SetupValue,
  scenarioId: string | undefined,
  weakSectionIds: string[],
): SetupChoice & { available: number } {
  const sections = value.onlyWeak
    ? onlyWeakSections(value.sections, weakSectionIds)
    : value.sections;
  const available = poolFor(value.mode, scenarioId, sections).length;
  return {
    mode: value.mode,
    scenarioId,
    sections,
    length: fitLength(value.length, available),
    shuffle: value.mode === "quiz" && value.shuffle,
    available,
  };
}

function AnswerCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <dd className="type-numeral order-1 tabular-nums">{value}</dd>
      <dt className="type-small order-2 text-text-secondary">{label}</dt>
    </div>
  );
}

export function SessionSetup({
  value,
  onChange,
  onStart,
  replacesUnfinished = false,
  training,
  materialName,
  scenarioId,
  guideSectionIds,
  stats,
  practised,
  weakSectionIds,
}: {
  value: SetupValue;
  onChange: (value: SetupValue) => void;
  onStart: () => void;
  replacesUnfinished?: boolean;
  /** The created training this setup belongs to; limits the modes. */
  training?: Pick<Training, "materialId" | "scenario" | "quiz">;
  /** The guide's name: the title and the subtitle. */
  materialName: string;
  scenarioId?: string;
  /** Every section of the guide, which the Guide sections screen lists. */
  guideSectionIds: string[];
  /** Answers given to this guide's questions in the saved sessions. */
  stats: GuideStats;
  /** The share of the guide practised, in percent. */
  practised: number;
  /** Guide sections with a wrong answer: "Only topics to repeat" limits the questions to them. */
  weakSectionIds: string[];
}) {
  const { sections: guideSections } = useSourceSheet();
  const group = useId();
  const [view, setView] = useState<"main" | "sections">("main");
  const modes = [
    { value: "scenario" as const, label: "Scenario", allowed: !training || training.scenario },
    { value: "quiz" as const, label: "Quiz", allowed: !training || training.quiz },
  ].filter((mode) => mode.allowed);
  const choice = setupChoice(value, scenarioId, weakSectionIds);
  const options = lengthOptions(choice.available);
  const blocked = value.sections.length === 0 || choice.available === 0;
  const quiz = value.mode === "quiz";
  const rows = guideSections
    .filter((section) => guideSectionIds.includes(section.id))
    .map((section) => ({ id: section.id, title: section.title }));

  if (view === "sections") {
    return (
      <div className="flex flex-col gap-6">
        <CircleBackButton label="Back to Session setup" onClick={() => setView("main")} />
        <h1 className="type-page-title">Guide sections</h1>
        <SectionList
          title="Sections"
          titleId="setup-sections"
          sections={rows}
          selected={value.sections}
          onChange={(sections) => onChange({ ...value, sections })}
        />
        <ActionBar>
          {value.sections.length === 0 && (
            <p className="type-small text-center text-text-secondary">{keepOneHint}</p>
          )}
          <Button disabled={value.sections.length === 0} onClick={() => setView("main")}>
            Done
          </Button>
        </ActionBar>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[44px_1fr_40px] items-center gap-2">
        <CircleBackButton
          href={`/materials/${training?.materialId ?? "evacuation-guide"}`}
          label="Back to material"
        />
        <div className="flex min-w-0 flex-col items-center">
          <h1 className="type-item-title">Session setup</h1>
          <p className="type-small max-w-full truncate text-text-secondary">{materialName}</p>
        </div>
        <Ring percent={practised} label={`${practised}% of the guide practised`} />
      </div>

      <div className="flex flex-col items-center gap-4">
        <Media3D variant="hero" />
        <h2 className="type-page-title break-words text-center">{materialName}</h2>
      </div>

      {modes.length > 1 ? (
        <SegmentedControl
          name="mode"
          legend="What do you want to do?"
          options={modes}
          value={value.mode}
          onChange={(mode) => onChange({ ...value, mode })}
        />
      ) : (
        <p className="text-center text-text-secondary">
          This training has a {modes[0]?.value === "quiz" ? "quiz" : "scenario"} only.
        </p>
      )}

      <section aria-labelledby="answers-title" className="flex flex-col gap-3">
        <h2 id="answers-title" className="type-label text-text-secondary">
          YOUR ANSWERS
        </h2>
        <dl className="flex rounded-card bg-card p-4 shadow-(--card-shadow)">
          <AnswerCount label="Questions" value={stats.questions} />
          <AnswerCount label="Correct" value={stats.correct} />
          <AnswerCount label="Incorrect" value={stats.incorrect} />
        </dl>
      </section>

      <section className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-(--card-shadow)">
        <fieldset className="flex flex-col gap-3">
          <legend className="type-body-strong mb-3">Length</legend>
          {options.length === 0 ? (
            <p className="type-small text-text-secondary">No questions in the selected sections.</p>
          ) : (
            options.map((option) => (
              <SelectableCard
                key={option.value}
                size="row"
                name={`length-${group}`}
                value={String(option.value)}
                checked={choice.length === option.value}
                onChange={() => onChange({ ...value, length: option.value })}
              >
                <span className="tabular-nums">{option.label}</span>
              </SelectableCard>
            ))
          )}
        </fieldset>
        {quiz && (
          <Toggle
            label="Shuffle questions"
            checked={value.shuffle}
            onChange={(shuffle) => onChange({ ...value, shuffle })}
          />
        )}
        <Toggle
          label="Only topics to repeat"
          checked={value.onlyWeak && weakSectionIds.length > 0}
          disabled={weakSectionIds.length === 0}
          hint={weakSectionIds.length === 0 ? "Nothing to repeat yet." : undefined}
          onChange={(onlyWeak) => onChange({ ...value, onlyWeak })}
        />
        <button
          type="button"
          onClick={() => setView("sections")}
          className="flex min-h-11 items-center justify-between gap-3 text-left"
        >
          <span className="type-body">
            Guide sections · <span className="tabular-nums">{value.sections.length} selected</span>
          </span>
          <Chevron />
        </button>
      </section>

      <ActionBar>
        {replacesUnfinished && (
          <p className="type-small text-center text-text-secondary">
            Starting replaces your unfinished session.
          </p>
        )}
        {value.sections.length === 0 && (
          <p className="type-small text-center text-text-secondary">{keepOneHint}</p>
        )}
        {value.sections.length > 0 && choice.available === 0 && (
          <p className="type-small text-center text-text-secondary">
            {questionCountLabel(0)} in the selected sections.
          </p>
        )}
        <Button disabled={blocked} onClick={onStart}>
          Start session
        </Button>
      </ActionBar>
    </div>
  );
}
