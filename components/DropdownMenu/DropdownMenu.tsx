"use client";

import { Ellipsis } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { circleLook } from "@/components/CircleBackButton/CircleBackButton";

export type MenuItem = {
  id: string;
  label: string;
  /** The destructive label colour (Delete). */
  destructive?: boolean;
  /** A hairline above the item (the destructive last item of the exam menu). */
  dividerAbove?: boolean;
  onSelect: () => void;
};

/**
 * A small menu under an icon button (DESIGN.md: Calmer package review screens): the "⋯" button
 * (a 40px circle in a 44px tap area, `aria-haspopup="menu"`, `aria-expanded`) opens a white panel
 * with 16px radius, a 1px border and a soft shadow, right-aligned under the button, never a bottom
 * sheet. It closes on a tap outside, on Escape and on choosing an item; the focus returns to the
 * button. ArrowUp, ArrowDown and Enter work inside. Nothing is animated.
 */
export function DropdownMenu({
  label,
  items,
  initiallyOpen = false,
}: {
  /** The accessible name of the button ("More actions"). */
  label: string;
  items: MenuItem[];
  /** For the review page and tests: the menu drawn open. */
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  // the keyboard-active row; -1 while nothing is highlighted (a mouse or touch opening)
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const close = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) button.current?.focus();
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

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (active >= 0) choose(items[active]);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };
  const choose = (item: MenuItem) => {
    close(true);
    item.onSelect();
  };

  return (
    <div ref={root} data-dropdown-menu className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={(event) => {
          // Enter or Space on the button (detail 0) is a keyboard opening: the first row is marked
          setActive(event.detail === 0 ? 0 : -1);
          setOpen((value) => !value);
        }}
        className="flex h-11 w-11 items-center justify-center has-focus-visible:outline-2 focus-visible:outline-2"
      >
        <span aria-hidden="true" className={circleLook("small")}>
          <Ellipsis size={20} strokeWidth={2} />
        </span>
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="menu"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={active >= 0 ? `${listId}-${items[active]?.id}` : undefined}
          onKeyDown={onKey}
          data-menu
          className="absolute top-full right-0 z-30 mt-1 w-max max-w-[min(280px,calc(100vw-32px))] min-w-48 overflow-hidden rounded-[16px] border border-selectable-stroke bg-card shadow-(--card-shadow) outline-none"
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              id={`${listId}-${item.id}`}
              role="menuitem"
              data-menu-item={item.id}
              onClick={() => choose(item)}
              className={`type-body-strong flex min-h-12 cursor-pointer items-center px-4 py-2 hover:bg-menu-highlight active:bg-menu-highlight ${
                item.destructive ? "text-wrong-text" : "text-text"
              } ${item.dividerAbove ? "border-t border-soft-divider" : ""} ${
                index === active
                  ? "bg-menu-highlight outline-2 -outline-offset-2 outline-primary"
                  : ""
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
