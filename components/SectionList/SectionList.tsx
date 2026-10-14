"use client";

import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { Button } from "@/components/Button/Button";
import { selectionToggle, toggleSection } from "@/lib/sections";
import type { TopicTint } from "@/lib/weak-topics";
import { topicTint } from "@/lib/weak-topics";

export type SectionRow = { id: string; title: string; detail?: string };

/** Pastel code circles, in the same cycle as the topic tiles. */
const codeTints: Record<TopicTint, string> = {
  yellow: "bg-code-yellow",
  blue: "bg-code-blue",
  lilac: "bg-code-lilac",
  sage: "bg-code-sage",
  peach: "bg-code-peach",
};

/**
 * The guide sections to keep, on Create training and Session setup: a title with one Select all /
 * Deselect all toggle, then one row card per section (code circle, title, check box).
 */
export function SectionList({
  title,
  titleId,
  helper,
  sections,
  selected,
  onChange,
}: {
  title: string;
  titleId: string;
  helper?: string;
  sections: SectionRow[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const ids = sections.map((section) => section.id);
  const toggle = selectionToggle(ids, selected);

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id={titleId} className="type-item-title">
          {title}
        </h2>
        <div className="-mr-3">
          <Button variant="text" onClick={() => onChange(toggle.next)}>
            {toggle.label}
          </Button>
        </div>
      </div>
      {helper && <p className="type-small text-text-secondary">{helper}</p>}
      <ul className="flex flex-col gap-2">
        {sections.map((section) => {
          const checked = selected.includes(section.id);
          return (
            <li key={section.id}>
              <SelectableCard
                type="checkbox"
                size="row"
                name={titleId}
                value={section.id}
                checked={checked}
                onChange={() => onChange(toggleSection(ids, selected, section.id))}
              >
                <span
                  aria-hidden="true"
                  className={`type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text ${codeTints[topicTint(section.id)]}`}
                >
                  {section.id}
                </span>
                <span className="type-body min-w-0 flex-1">
                  <span className="sr-only">{section.id} </span>
                  {section.title}
                </span>
                {section.detail && (
                  <span className="type-small shrink-0 text-right text-text-secondary tabular-nums">
                    {section.detail}
                  </span>
                )}
              </SelectableCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
