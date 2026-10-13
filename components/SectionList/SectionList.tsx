"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { selectionToggle, toggleSection } from "@/lib/sections";

export type SectionRow = { id: string; title: string; detail?: string };

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
              <label
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[20px] border-[1.5px] px-4 py-3 shadow-(--card-shadow) active:bg-tint has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${checked ? "border-stroke-tint bg-tint" : "border-transparent bg-card"}`}
              >
                <input
                  type="checkbox"
                  name={titleId}
                  value={section.id}
                  checked={checked}
                  onChange={() => onChange(toggleSection(ids, selected, section.id))}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-icon-tile text-primary`}
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
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
                    checked ? "border-primary bg-primary text-primary-text" : "border-primary"
                  }`}
                >
                  {checked && <Check size={14} strokeWidth={2.5} />}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
