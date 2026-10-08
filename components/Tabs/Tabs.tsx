"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";

export type Tab<T extends string> = { id: T; label: string; count?: number };

/**
 * Underline tabs. Arrow keys move between tabs and select them, Home and End jump to the ends;
 * only the selected tab is in the Tab order. The panel is labelled by its tab: use tabPanelProps.
 */
export function Tabs<T extends string>({
  idPrefix,
  label,
  tabs,
  value,
  onChange,
}: {
  idPrefix: string;
  label: string;
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const refs = useRef(new Map<T, HTMLButtonElement>());

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current.get(tabs[next].id)?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-6 border-b border-border">
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) refs.current.set(tab.id, element);
              else refs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`-mb-px min-h-11 border-b-2 text-base ${
              selected
                ? "border-text font-medium text-text"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && <span className="tabular-nums"> ({tab.count})</span>}
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(idPrefix: string, selected: string) {
  return {
    role: "tabpanel" as const,
    id: `${idPrefix}-panel`,
    "aria-labelledby": `${idPrefix}-tab-${selected}`,
  };
}
