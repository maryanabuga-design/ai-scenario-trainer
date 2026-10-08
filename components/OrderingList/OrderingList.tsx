"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type Item = { id: string; text: string };
type Direction = "up" | "down";

const arrow = (direction: Direction) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {direction === "up" ? <path d="M12 19V5M6 11l6-6 6 6" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
  </svg>
);

/**
 * Items to put in order. Each row has a drag handle (mouse or touch) and "Move up" and
 * "Move down" buttons, so the order can also be changed with a keyboard. The moved row keeps focus.
 */
export function OrderingList({
  items,
  order,
  onChange,
}: {
  items: Item[];
  order: string[];
  onChange: (order: string[]) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [dragging, setDragging] = useState<string | null>(null);
  const [focusAfterMove, setFocusAfterMove] = useState<{ id: string; direction: Direction } | null>(
    null,
  );

  useEffect(() => {
    if (!focusAfterMove) return;
    const { id, direction } = focusAfterMove;
    const other = direction === "up" ? "down" : "up";
    const target = buttons.current.get(`${id}-${direction}`);
    (target && !target.disabled ? target : buttons.current.get(`${id}-${other}`))?.focus();
  }, [order, focusAfterMove]);

  function moveTo(id: string, index: number) {
    const rest = order.filter((candidate) => candidate !== id);
    rest.splice(index, 0, id);
    onChange(rest);
  }

  function move(id: string, direction: Direction) {
    const index = order.indexOf(id);
    moveTo(id, direction === "up" ? index - 1 : index + 1);
    setFocusAfterMove({ id, direction });
  }

  function onPointerMove(event: ReactPointerEvent, id: string) {
    if (dragging !== id || !listRef.current) return;
    const rows = [...listRef.current.children];
    const target = rows.findIndex((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    const index = target === -1 ? rows.length - 1 : target;
    if (index !== order.indexOf(id)) moveTo(id, index);
  }

  return (
    <ol ref={listRef} className="flex flex-col gap-2">
      {order.map((id, index) => {
        const item = items.find((candidate) => candidate.id === id);
        if (!item) return null;
        return (
          <li
            key={id}
            className={`flex min-h-14 items-center gap-2 rounded-panel border bg-surface py-2 pr-2 pl-1 ${
              dragging === id ? "border-2 border-primary" : "border-border"
            }`}
          >
            <span
              aria-hidden="true"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setFocusAfterMove(null);
                setDragging(id);
              }}
              onPointerMove={(event) => onPointerMove(event, id)}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
              className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-text-secondary active:cursor-grabbing"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                {[6, 12, 18].map((y) =>
                  [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />),
                )}
              </svg>
            </span>
            <span className="w-6 shrink-0 text-sm text-text-secondary tabular-nums">
              {index + 1}.
            </span>
            <span className="flex-1 text-base">{item.text}</span>
            {(["up", "down"] as const).map((direction) => (
              <button
                key={direction}
                ref={(element) => {
                  if (element) buttons.current.set(`${id}-${direction}`, element);
                  else buttons.current.delete(`${id}-${direction}`);
                }}
                type="button"
                aria-label={`Move "${item.text}" ${direction}`}
                disabled={direction === "up" ? index === 0 : index === order.length - 1}
                onClick={() => move(id, direction)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-text hover:border-text-secondary disabled:cursor-not-allowed disabled:border-transparent disabled:text-border"
              >
                {arrow(direction)}
              </button>
            ))}
          </li>
        );
      })}
    </ol>
  );
}
