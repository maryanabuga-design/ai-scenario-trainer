"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/Button/Button";
import { ActionBar } from "@/components/ActionBar/ActionBar";

const MAX_HEIGHT = 128;

/** How much of the layout viewport the on-screen keyboard covers (0 where the page resizes). */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return inset;
}

/**
 * The answer input docked at the bottom, above the on-screen keyboard: a growing text field with
 * "I don't know" and a round send button inside it. Enter sends, Shift+Enter adds a line.
 */
export function AnswerDock({
  label,
  placeholder,
  value,
  onChange,
  onSend,
  onDontKnow,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  onDontKnow: () => void;
}) {
  const id = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const inset = useKeyboardInset();
  const empty = !value.trim();

  // Grow with the text, from one line up to about four.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!empty) onSend(value.trim());
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  }

  return (
    <ActionBar>
      <form
        onSubmit={submit}
        style={inset ? { transform: `translateY(-${inset}px)` } : undefined}
        className="flex items-end gap-1 rounded-card border border-border-strong bg-surface py-1 pr-1 pl-4 has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-accent"
      >
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <textarea
          ref={fieldRef}
          id={id}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="type-body dock-field min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2.5 placeholder:text-text-secondary"
        />
        <span className="shrink-0">
          <Button variant="text" small onClick={onDontKnow}>
            I don&apos;t know
          </Button>
        </span>
        <button
          type="submit"
          aria-label="Send"
          disabled={empty}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-text active:opacity-80 disabled:cursor-not-allowed disabled:bg-secondary-olive disabled:text-text-secondary"
        >
          <ArrowUp size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>
    </ActionBar>
  );
}
