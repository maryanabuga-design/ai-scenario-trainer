"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/**
 * The single-choice filter dropdown (DESIGN.md: Students, one status dropdown): a 48px field-style
 * button ("Status" muted at the left, the chosen value in semi-bold and a chevron at the right) and,
 * under it, a list over the page content (not a bottom sheet). One 44px row per option with its
 * count at the right; the chosen row has the Secondary tint and semi-bold text, no check. A choice,
 * a tap outside and Escape close it and focus returns to the button. The button is
 * `aria-haspopup="listbox"` with `aria-expanded`; the list is a listbox of options with
 * `aria-selected`; ArrowUp, ArrowDown and Enter work. Nothing is animated.
 */
export function FilterSelect<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
  initiallyOpen = false,
}: {
  name: string;
  /** The muted word at the left of the button and the accessible name of the list. */
  label: string;
  options: { value: T; label: string; count: number }[];
  value: T;
  onChange: (value: T) => void;
  /** For the review page and tests: draw the list open. */
  initiallyOpen?: boolean;
}) {
  const current = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [open, setOpen] = useState(initiallyOpen);
  const [active, setActive] = useState(current);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const close = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) button.current?.focus();
  };
  const choose = (next: T) => {
    onChange(next);
    close(true);
  };
  const openList = () => {
    setActive(current);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  // a page kept in the background keeps its state: hidden means closed
  useEffect(() => () => setOpen(false), []);

  const onListKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[active].value);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} data-filter-select={name} className="relative">
      <button
        ref={button}
        type="button"
        data-select-button
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openList();
          }
        }}
        className="type-body flex h-12 w-full cursor-pointer items-center gap-2 rounded-[14px] border border-selectable-stroke bg-card px-4 text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
      >
        <span className="text-text-secondary">{label}</span>
        <span data-select-value className="type-body-strong ml-auto min-w-0 truncate">
          {options[current].label}
        </span>
        <ChevronDown
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className={`shrink-0 text-text-secondary ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${options[active].value}`}
          onKeyDown={onListKey}
          data-select-list
          className="absolute top-full right-0 left-0 z-30 mt-1 overflow-hidden rounded-[14px] border border-selectable-stroke bg-card shadow-(--card-shadow) outline-none"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${listId}-${option.value}`}
                role="option"
                aria-selected={selected}
                data-select-option={option.value}
                onClick={() => choose(option.value)}
                className={`type-body flex h-11 cursor-pointer items-center gap-3 px-4 ${
                  selected
                    ? "type-body-strong bg-olive-tint"
                    : index === active
                      ? "bg-secondary-sand"
                      : ""
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <span data-select-count className="type-body font-normal text-text-secondary">
                  {option.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
