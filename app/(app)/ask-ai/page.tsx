"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AskAiView } from "@/components/AskAiView/AskAiView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { answerTo, answerToSuggested, newThread, suggestedById, withThread } from "@/lib/ask-ai";
import { readThreads, useThreads, writeThreads } from "@/lib/ask-ai-store";
import { useField } from "@/lib/auth";
import type { FieldOfWork } from "@/lib/field-of-work";
import type { AiMessage } from "@/lib/ask-ai";

/** Rendered once the conversations are read, so the time is never part of the prerender. */
function Loaded({
  threads,
  field,
}: {
  threads: ReturnType<typeof readThreads>;
  field: FieldOfWork | null;
}) {
  const router = useRouter();
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title;

  function start(question: string, reply: AiMessage) {
    const thread = newThread(question, reply, titleOf, Date.now());
    writeThreads(withThread(readThreads(), thread));
    router.push(`/ask-ai/${thread.id}`);
  }

  return (
    <AskAiView
      threads={threads}
      field={field}
      now={now}
      onSend={(text) => start(text, answerTo(text, Date.now(), field))}
      onSuggested={(id) =>
        start(suggestedById(id)!.question, answerToSuggested(id, Date.now(), field))
      }
      confirming={confirming}
      onAskClear={() => setConfirming(true)}
      onCancelClear={() => setConfirming(false)}
      onClear={() => {
        writeThreads([]);
        setConfirming(false);
      }}
    />
  );
}

export default function AskAiPage() {
  const threads = useThreads();
  const field = useField();
  if (threads === "loading" || field === "loading") return null;
  return <Loaded threads={threads} field={field} />;
}
