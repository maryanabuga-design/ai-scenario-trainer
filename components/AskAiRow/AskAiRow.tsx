"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { questionThread, questionThreadId, withThread } from "@/lib/ask-ai";
import { readThreads, writeThreads } from "@/lib/ask-ai-store";
import { useField } from "@/lib/auth";
import type { Item } from "@/lib/items";

/**
 * "Ask AI about this question" (DESIGN.md: Ask AI, Question threads): the tertiary inline action with an icon (DESIGN.md:
 * Tertiary inline action with an icon) on the Answer review and the Saved question screen. It opens the ONE thread of the question, created here on first
 * use from the question's own data, so reopening never duplicates it.
 */
export function AskAiRow({
  item,
  number,
  choice,
}: {
  item: Item;
  /** The number in the title: the position in the review, or in the saved list. */
  number: number;
  choice: string | null;
}) {
  const { sections } = useSourceSheet();
  const field = useField();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title;
  return (
    <Link
      href={`/ask-ai/${questionThreadId(item.id)}`}
      data-ask-ai-row
      onClick={() => {
        const threads = readThreads();
        if (threads.some((thread) => thread.id === questionThreadId(item.id))) return;
        writeThreads(
          withThread(
            threads,
            questionThread(
              item,
              number,
              choice,
              titleOf,
              Date.now(),
              field === "loading" ? null : field,
            ),
          ),
        );
      }}
      className="group type-action flex min-h-11 w-full items-center gap-2 rounded-[8px] text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Sparkles size={24} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 underline decoration-1 underline-offset-4 group-active:decoration-2">
        Ask AI about this question
      </span>
    </Link>
  );
}
