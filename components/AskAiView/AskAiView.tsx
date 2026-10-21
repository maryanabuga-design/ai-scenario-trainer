"use client";

import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { ChatInput } from "@/components/ChatInput/ChatInput";
import { Chevron } from "@/components/Chevron/Chevron";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { EMPTY_TEXT, suggestedFor, timeLabel } from "@/lib/ask-ai";
import { tunedLine } from "@/lib/field-of-work";
import type { FieldOfWork } from "@/lib/field-of-work";
import type { Thread } from "@/lib/ask-ai";

/**
 * The Ask AI tab (DESIGN.md: Ask AI): the header band with the avatar, the suggested questions, the
 * history of conversations (newest first, 72px rows) with Clear history at its end, and the pinned
 * input. Simulated: every answer is prepared.
 */
export function AskAiView({
  threads,
  now,
  onSend,
  onSuggested,
  confirming,
  onAskClear,
  onCancelClear,
  onClear,
  field = null,
  dialogInline = false,
}: {
  threads: Thread[];
  now: number;
  onSend: (text: string) => void;
  onSuggested: (id: string) => void;
  confirming: boolean;
  onAskClear: () => void;
  onCancelClear: () => void;
  onClear: () => void;
  /** The field of work: it tunes the suggested questions and shows in the row under the header. */
  field?: FieldOfWork | null;
  /** Only for the screen review page: draw the dialog in place. */
  dialogInline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Ask AI"
        subtitle="Prototype answers from the guides"
        action={<ProfileAvatar />}
      />

      <Link
        href="/profile/field?from=ask-ai"
        data-tuned-row
        className="flex h-11 items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <span data-tuned-text className="type-small min-w-0 flex-1 truncate">
          {tunedLine(field)}
        </span>
        <Chevron />
      </Link>

      <div className="flex flex-col gap-6">
        <section aria-labelledby="suggested-title" className="flex flex-col gap-3">
          {threads.length === 0 && <p className="text-text-secondary">{EMPTY_TEXT}</p>}
          <h2 id="suggested-title" className="type-label text-text-secondary">
            Suggested questions
          </h2>
          <ul className="flex flex-col gap-2">
            {suggestedFor(field).map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  data-suggested={entry.id}
                  onClick={() => onSuggested(entry.id)}
                  className="flex h-14 w-full items-center gap-3 rounded-card border border-selectable-stroke bg-card px-4 text-left active:bg-secondary-sand has-focus-visible:outline-2"
                >
                  <span className="type-body min-w-0 flex-1 truncate">{entry.question}</span>
                  <Chevron />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {threads.length > 0 && (
          <section aria-labelledby="history-title" className="flex flex-col gap-3">
            <h2 id="history-title" className="type-label text-text-secondary">
              History
            </h2>
            <ul className="flex flex-col gap-2">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/ask-ai/${thread.id}`}
                    data-thread={thread.id}
                    className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="type-body-strong truncate">{thread.title}</span>
                      <span className="type-small truncate text-text-secondary">
                        {thread.subtitle}
                      </span>
                    </span>
                    <span className="type-caption shrink-0 text-text-secondary">
                      {timeLabel(thread.updatedAt, now)}
                    </span>
                    <Chevron />
                  </Link>
                </li>
              ))}
            </ul>
            <Button variant="secondary" onClick={onAskClear}>
              Clear history
            </Button>
          </section>
        )}
      </div>

      <ChatInput onSend={onSend} />

      {(confirming || !dialogInline) && (
        <ConfirmDialog
          open={confirming}
          inline={dialogInline}
          title="Clear history?"
          description="This deletes all your Ask AI conversations on this device."
          confirmLabel="Clear"
          onConfirm={onClear}
          onCancel={onCancelClear}
        />
      )}
    </div>
  );
}
