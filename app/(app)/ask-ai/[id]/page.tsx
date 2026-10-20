"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { AskAiThread } from "@/components/AskAiThread/AskAiThread";
import { ButtonLink } from "@/components/Button/Button";
import {
  TYPING_MS,
  actionLabel,
  answerTo,
  answerToSuggested,
  followUp,
  suggestedById,
  updateThread,
  userMessage,
} from "@/lib/ask-ai";
import type { AiMessage, QuickAction, Thread } from "@/lib/ask-ai";
import { readThreads, useThreads, writeThreads } from "@/lib/ask-ai-store";

/** Adds a user message with its answer waiting; the answer arrives after the typing indicator. */
function ask(id: string, text: string, reply: AiMessage) {
  const now = Date.now();
  writeThreads(
    updateThread(readThreads(), id, (thread) => ({
      ...thread,
      updatedAt: now,
      messages: [...thread.messages, userMessage(text, reply, now)],
    })),
  );
}

/** Moves a waiting answer into the conversation. */
function deliver(id: string, userId: string) {
  writeThreads(
    updateThread(readThreads(), id, (thread) => {
      const waiting = thread.messages.find((m) => m.id === userId);
      if (!waiting?.reply) return thread;
      return {
        ...thread,
        updatedAt: Date.now(),
        messages: thread.messages.flatMap((m) =>
          m.id === userId ? [{ ...m, reply: undefined }, waiting.reply!] : [m],
        ),
      };
    }),
  );
}

function Conversation({ thread }: { thread: Thread }) {
  const last = thread.messages.at(-1);
  const waitingId = last?.role === "user" && last.reply ? last.id : null;
  const delivered = useRef<string | null>(null);

  // The typing indicator runs for 600ms (not at all with reduced motion), then the answer is added.
  // Leaving the screen early still delivers it, so a question never stays unanswered.
  useEffect(() => {
    if (!waitingId) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      if (delivered.current === waitingId) return;
      delivered.current = waitingId;
      deliver(thread.id, waitingId);
    };
    const timer = window.setTimeout(finish, calm ? 0 : TYPING_MS);
    return () => {
      window.clearTimeout(timer);
      finish();
    };
  }, [waitingId, thread.id]);

  return (
    <AskAiThread
      thread={thread}
      typing={waitingId !== null}
      onSend={(text) => ask(thread.id, text, answerTo(text, Date.now()))}
      onSuggested={(suggestedId) =>
        ask(
          thread.id,
          suggestedById(suggestedId)!.question,
          answerToSuggested(suggestedId, Date.now()),
        )
      }
      onAction={(action: QuickAction) => {
        const topic = [...thread.messages].reverse().find((m) => m.topic)?.topic;
        if (!topic) return;
        ask(thread.id, actionLabel(action), followUp(action, topic, Date.now()));
      }}
    />
  );
}

export default function AskAiThreadPage() {
  const threads = useThreads();
  const params = useParams<{ id: string }>();
  if (threads === "loading") return null;
  const thread = threads.find((entry) => entry.id === params.id);
  if (!thread) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="type-page-title">Conversation not found</h1>
        <p className="text-text-secondary">It may have been cleared from the history.</p>
        <ButtonLink href="/ask-ai">Back to Ask AI</ButtonLink>
      </div>
    );
  }
  return <Conversation thread={thread} />;
}
