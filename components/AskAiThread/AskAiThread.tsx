"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/Button/Button";
import { ChatInput } from "@/components/ChatInput/ChatInput";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SourcePill } from "@/components/SourcePill/SourcePill";
import { DISCLAIMER, lastAi, quickActions, suggestedById } from "@/lib/ask-ai";
import type { AiMessage, QuickAction, Thread } from "@/lib/ask-ai";

/** The three dots shown while the answer is "typed"; they stand still under reduced motion. */
export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="Typing"
      data-typing
      className="flex w-fit items-center gap-1.5 self-start rounded-card border border-border bg-card px-4 py-3"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          aria-hidden="true"
          style={{ animationDelay: `${dot * 150}ms` }}
          className="h-2 w-2 animate-pulse rounded-full bg-text-secondary motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function AiMessageView({
  message,
  onSuggested,
}: {
  message: AiMessage;
  onSuggested: (id: string) => void;
}) {
  return (
    <div data-message="ai" className="flex max-w-full flex-col items-start gap-2 self-start">
      <div className="flex max-w-full flex-col gap-3 rounded-card border border-border bg-card p-4">
        <p className="whitespace-pre-line">{message.text}</p>
        {message.suggestions && (
          <div className="flex flex-col gap-2">
            {message.suggestions.map((id) => (
              <Button key={id} variant="secondary" onClick={() => onSuggested(id)}>
                {suggestedById(id)?.question}
              </Button>
            ))}
          </div>
        )}
        {message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.sources.map((id) => (
              <SourcePill key={id} sectionId={id} />
            ))}
          </div>
        )}
      </div>
      <p data-disclaimer className="type-small text-text-secondary">
        {DISCLAIMER}
      </p>
    </div>
  );
}

/**
 * A conversation (DESIGN.md: Ask AI, Thread screen): the header band with Back and the title, the
 * messages (the person's on the right in olive-tint bubbles, the AI's in white bordered cards with its
 * source pills and the prototype line), the typing indicator, the quick actions under the latest
 * answer, and the pinned input.
 */
export function AskAiThread({
  thread,
  typing,
  onSend,
  onAction,
  onSuggested,
}: {
  thread: Thread;
  typing: boolean;
  onSend: (text: string) => void;
  onAction: (action: QuickAction) => void;
  onSuggested: (id: string) => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  const count = thread.messages.length + (typing ? 1 : 0);
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    end.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "end" });
  }, [count]);

  const latest = lastAi(thread);
  const last = thread.messages.at(-1);
  const showActions = !typing && last === latest && latest?.topic !== undefined;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={thread.title}
        subtitle={thread.subtitle}
        back={{ label: "Back to Ask AI", href: "/ask-ai" }}
      />
      <div className="flex flex-col gap-4" aria-live="polite">
        {thread.messages.map((message) =>
          message.role === "user" ? (
            <div
              key={message.id}
              data-message="user"
              className="type-body max-w-[85%] self-end rounded-[20px] rounded-br-[6px] bg-olive-tint px-4 py-3"
            >
              {message.text}
            </div>
          ) : (
            <AiMessageView key={message.id} message={message} onSuggested={onSuggested} />
          ),
        )}
        {typing && <TypingIndicator />}
        {showActions && (
          <div data-quick-actions className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                wide={false}
                compact
                onClick={() => onAction(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        <div ref={end} className="scroll-mb-4" />
      </div>
      <ChatInput onSend={onSend} label="Ask a follow-up question" />
    </div>
  );
}
