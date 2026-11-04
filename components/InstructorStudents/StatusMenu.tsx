"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { StudentsFilter } from "@/lib/students";

type Option = { value: StudentsFilter; label: string; count: number };

/**
 * The status filter of the desktop Students list (DESIGN.md: Responsive instructor, step 3): the
 * filter button and, under it, a menu of radio options with their counts. Choosing applies at once
 * and closes the menu; Escape, a click outside and Tab close it, and the focus returns to the
 * button; the arrow keys move between the options. The phone uses the filter sheet instead; both
 * read and write the same filter. Drawn only from 1024px in the instructor shell.
 */
export function StatusMenu({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: StudentsFilter;
  onChange: (value: StudentsFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  // the menu opens to the right of the button, or flips to the right edge when it would leave the content area
  const [flip, setFlip] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const area = button.current.closest("main")?.getBoundingClientRect().right ?? window.innerWidth;
    setFlip(button.current.getBoundingClientRect().left + 280 > area);
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const choose = (next: StudentsFilter) => {
    onChange(next);
    close();
  };

  useEffect(() => {
    if (!open) return;
    items.current[
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      )
    ]?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
    // the focus moves in once, when the menu opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    const at = items.current.findIndex((item) => item === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items.current[(at + 1) % options.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items.current[(at <= 0 ? options.length : at) - 1]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items.current[options.length - 1]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={root}
      data-status-menu
      data-desk-only
      className="relative hidden shrink-0 idesk:block"
    >
      <button
        ref={button}
        type="button"
        data-filter-button-desk
        aria-label="Filter by status"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-[14px] text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          value === "all" ? "bg-olive-tint" : "bg-filter-active"
        }`}
      >
        <SlidersHorizontal size={22} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Filter by status"
          onKeyDown={onKeyDown}
          data-status-options
          data-flip={flip}
          className={`absolute top-full z-30 mt-2 w-[280px] overflow-hidden rounded-[14px] border border-selectable-stroke bg-card py-1 shadow-(--card-shadow) ${flip ? "right-0" : "left-0"}`}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => {
                items.current[index] = element;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              data-status-option={option.value}
              onClick={() => choose(option.value)}
              className="type-body flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 text-left hover:bg-menu-highlight focus-visible:bg-menu-highlight focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center"
              >
                {option.value === value && <Check size={18} strokeWidth={2.25} />}
              </span>
              <span className="min-w-0 flex-1">
                {option.label}
                <span className="text-text-secondary">
                  {" · "}
                  {option.count}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
