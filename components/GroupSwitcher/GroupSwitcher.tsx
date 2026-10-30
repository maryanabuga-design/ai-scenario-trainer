"use client";

import { Check, ChevronDown, UsersRound } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { IconTile } from "@/components/IconTile/IconTile";
import { scopeName } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import type { SwitcherRow } from "@/lib/overview";

/** The margin the list keeps from the screen edges. */
const EDGE = 16;

/**
 * The group switcher (DESIGN.md: Instructor, Overview refinements; the pill exists only on the Overview): a pill "<Group> ⌄" with a small
 * neutral group icon, and under it a list over the page content (not a bottom sheet, not a page).
 * Rows: the group name, "15 students · Almost ready" and a check on the current one; "All groups" is
 * last. A row switches at once and closes the list, as do a tap outside and Escape. The pill is a
 * button (`aria-haspopup="listbox"`, `aria-expanded`); the list is a listbox with ArrowUp, ArrowDown,
 * Enter and Escape, and focus returns to the pill. Nothing is animated.
 */
export function GroupSwitcher({
  scope,
  rows,
  onSelect,
  initiallyOpen = false,
}: {
  scope: Scope;
  rows: SwitcherRow[];
  onSelect: (scope: Scope) => void;
  /** For the review page and tests: draw the list open. */
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      rows.findIndex((row) => row.id === scope),
    ),
  );
  const [shift, setShift] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const close = (focusPill: boolean) => {
    setOpen(false);
    if (focusPill) button.current?.focus();
  };
  const choose = (id: string) => {
    onSelect(id);
    close(true);
  };

  // keep the list inside the screen: left-aligned with the pill unless that pushes it past the margin
  useLayoutEffect(() => {
    if (!open || !list.current || !button.current) return;
    const pill = button.current.getBoundingClientRect();
    const width = list.current.getBoundingClientRect().width;
    const room = document.documentElement.clientWidth - EDGE;
    setShift(Math.min(0, room - (pill.left + width)));
  }, [open, rows]);

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
      setActive((index) => (index + 1) % rows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + rows.length) % rows.length);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(rows[active].id);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} data-group-switcher className="relative w-fit max-w-full">
      <button
        ref={button}
        type="button"
        data-group-pill
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Group: ${scopeName(scope)}. Change group`}
        onClick={() => {
          setActive(
            Math.max(
              0,
              rows.findIndex((row) => row.id === scope),
            ),
          );
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setActive(
              Math.max(
                0,
                rows.findIndex((row) => row.id === scope),
              ),
            );
            setOpen(true);
          }
        }}
        className="flex min-h-11 max-w-full min-w-0 items-center has-focus-visible:outline-2"
      >
        <span className="type-small-strong flex h-10 min-w-0 items-center gap-2 rounded-full bg-secondary-sand pr-4 pl-2 text-text">
          <IconTile className="h-6 w-6 rounded-[8px]">
            <UsersRound size={14} strokeWidth={2} />
          </IconTile>
          <span className="truncate">{scopeName(scope)}</span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className={`shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label="Group"
          aria-activedescendant={`${listId}-${rows[active]?.id}`}
          onKeyDown={onListKey}
          data-group-list
          style={{ left: shift }}
          className="absolute top-full z-30 mt-1 w-max max-w-[min(320px,calc(100vw-32px))] min-w-full overflow-hidden rounded-[16px] border border-selectable-stroke bg-card shadow-(--card-shadow) outline-none"
        >
          {rows.map((row, index) => {
            const selected = row.id === scope;
            return (
              <li
                key={row.id}
                id={`${listId}-${row.id}`}
                role="option"
                aria-selected={selected}
                data-group-option={row.id}
                onClick={() => choose(row.id)}
                className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 ${
                  index === active ? "bg-secondary-sand" : ""
                } ${index > 0 ? "border-t border-soft-divider" : ""}`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="type-body-strong truncate">{row.name}</span>
                  <span className="type-small truncate text-text-secondary">{row.line}</span>
                </span>
                {selected && (
                  <Check size={18} strokeWidth={2.25} aria-hidden="true" className="shrink-0" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
