"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button/Button";

/**
 * "My explanation is still correct" (scenario) or "My answer is still correct" (short text) in the
 * answer sheet. Once pressed it becomes "Marked as correct by you" with Undo; focus follows.
 */
export function MarkCorrect({
  label,
  marked,
  onChange,
}: {
  /** "My explanation is still correct" or "My answer is still correct". */
  label: string;
  marked: boolean;
  onChange: (marked: boolean) => void;
}) {
  const markRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    (marked ? undoRef : markRef).current?.focus();
  }, [marked]);

  if (!marked) {
    return (
      <Button ref={markRef} variant="secondary" onClick={() => onChange(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <p role="status">Marked as correct by you</p>
      <div className="-mr-3">
        <Button ref={undoRef} variant="text" onClick={() => onChange(false)}>
          Undo
        </Button>
      </div>
    </div>
  );
}
