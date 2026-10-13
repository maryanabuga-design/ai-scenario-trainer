"use client";

import { GripVertical } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

type Item = { id: string; text: string };

/**
 * Items to put in order. Each row has a drag handle: drag it with a mouse or a finger, or use
 * the keyboard drag mode on the handle (Space picks up, arrow keys move, Space drops, Escape
 * cancels). Every keyboard step is announced. There is no tap-to-move alternative yet.
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
  const instructionsId = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const [dragging, setDragging] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<{ id: string; start: string[] } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const text = (id: string) => items.find((item) => item.id === id)?.text ?? id;
  const position = (id: string, list = order) =>
    `position ${list.indexOf(id) + 1} of ${list.length}`;

  // Moving a row can take focus away from its handle; give it back while it is picked up.
  useEffect(() => {
    if (grabbed) handles.current.get(grabbed.id)?.focus();
  }, [order, grabbed]);

  function moveTo(id: string, index: number) {
    const rest = order.filter((candidate) => candidate !== id);
    rest.splice(index, 0, id);
    onChange(rest);
    return rest;
  }

  function onKeyDown(event: KeyboardEvent, id: string) {
    const pick = event.key === " " || event.key === "Enter";
    if (!grabbed) {
      if (!pick) return;
      event.preventDefault();
      setGrabbed({ id, start: order });
      setAnnouncement(
        `Picked up ${text(id)}, ${position(id)}. Use the arrow keys to move it, Space to drop it, Escape to cancel.`,
      );
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const index = order.indexOf(id) + (event.key === "ArrowUp" ? -1 : 1);
      if (index < 0 || index >= order.length) return;
      const next = moveTo(id, index);
      setAnnouncement(`${text(id)} moved to ${position(id, next)}.`);
    } else if (pick) {
      event.preventDefault();
      setGrabbed(null);
      setAnnouncement(`Dropped ${text(id)} at ${position(id)}.`);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onChange(grabbed.start);
      setGrabbed(null);
      setAnnouncement(`Cancelled. ${text(id)} is back at ${position(id, grabbed.start)}.`);
    }
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
    <>
      <p id={instructionsId} className="sr-only">
        Drag a handle to reorder. With a keyboard: Space picks up an item, the arrow keys move it,
        Space drops it and Escape cancels.
      </p>
      <ol ref={listRef} className="flex flex-col gap-2">
        {order.map((id, index) => {
          const item = items.find((candidate) => candidate.id === id);
          if (!item) return null;
          const active = dragging === id || grabbed?.id === id;
          return (
            <li
              key={id}
              className={`flex min-h-14 items-center gap-2 rounded-panel border bg-surface py-1.5 pr-3 pl-1 ${
                active ? "border-2 border-primary" : "border-border"
              }`}
            >
              <button
                ref={(element) => {
                  if (element) handles.current.set(id, element);
                  else handles.current.delete(id);
                }}
                type="button"
                aria-label={`Reorder: ${item.text}`}
                aria-describedby={instructionsId}
                aria-pressed={grabbed?.id === id}
                onKeyDown={(event) => onKeyDown(event, id)}
                onBlur={() => {
                  if (grabbed?.id === id) setGrabbed(null);
                }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDragging(id);
                }}
                onPointerMove={(event) => onPointerMove(event, id)}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                className="flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-text-secondary hover:bg-neutral-surface active:cursor-grabbing"
              >
                <GripVertical size={20} strokeWidth={2} aria-hidden="true" />
              </button>
              <span className="type-small w-6 shrink-0 text-text-secondary tabular-nums">
                {index + 1}.
              </span>
              <span className="type-body flex-1">{item.text}</span>
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
