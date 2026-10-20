"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";

/**
 * The pinned question input of Ask AI (DESIGN.md: Ask AI): a text field of at least 44px and a Primary
 * "Send", in the action bar above the bottom navigation. Focusing the field scrolls it to the middle
 * of the visible area so the on-screen keyboard never covers it.
 */
export function ChatInput({
  onSend,
  label = "Ask a question",
}: {
  onSend: (text: string) => void;
  label?: string;
}) {
  const [text, setText] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <ActionBar>
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={(event) => {
            const field = event.currentTarget;
            // after the keyboard has opened, keep the field in view
            window.setTimeout(() => field.scrollIntoView({ block: "nearest" }), 300);
          }}
          aria-label={label}
          placeholder="Ask about a topic"
          enterKeyHint="send"
          autoComplete="off"
          className="type-body h-[52px] min-w-0 flex-1 rounded-[14px] border border-selectable-stroke bg-card px-4 text-text placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
        />
        <div className="w-[104px] shrink-0">
          <Button type="submit" disabled={text.trim() === ""}>
            Send
          </Button>
        </div>
      </form>
    </ActionBar>
  );
}
