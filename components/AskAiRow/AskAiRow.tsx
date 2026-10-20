"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { questionThread, questionThreadId, withThread } from "@/lib/ask-ai";
import { readThreads, writeThreads } from "@/lib/ask-ai-store";
import type { Item } from "@/lib/items";

/**
 * "Ask AI about this question" (DESIGN.md: Ask AI, Question threads): a white card row on the Answer
 * review and the Saved question screen. It opens the ONE thread of the question, created here on first
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
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title;
  return (
    <Link
      href={`/ask-ai/${questionThreadId(item.id)}`}
      data-ask-ai-row
      onClick={() => {
        const threads = readThreads();
        if (threads.some((thread) => thread.id === questionThreadId(item.id))) return;
        writeThreads(
          withThread(threads, questionThread(item, number, choice, titleOf, Date.now())),
        );
      }}
      className="flex h-14 items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center text-neutral-tile-ink"
      >
        <Sparkles size={24} strokeWidth={1.75} />
      </span>
      <span className="type-body-strong min-w-0 flex-1 truncate">Ask AI about this question</span>
      <Chevron />
    </Link>
  );
}
