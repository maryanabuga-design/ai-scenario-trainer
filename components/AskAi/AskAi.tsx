"use client";

import { Sparkles } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import {
  deferredText,
  matchQuestion,
  notCoveredText,
  replyToChip,
  suggestedChips,
} from "@/lib/chat";
import type { ChatChip, ChatPhase, ChatReply } from "@/lib/chat";
import type { Step } from "@/lib/scenario";

export type ChatMessage =
  { role: "trainee"; text: string; chipId?: string } | { role: "ai"; reply: ChatReply };

type Conversations = Record<string, ChatMessage[]>;
type OpenChat = { step: Step; phase: ChatPhase };

const TYPING_MS = 700;

const AskAiContext = createContext<{
  open: (step: Step, phase: ChatPhase) => void;
} | null>(null);

export function useAskAi() {
  const context = useContext(AskAiContext);
  if (!context) throw new Error("useAskAi must be used inside AskAiProvider");
  return context;
}

function AiMessage({ reply }: { reply: ChatReply }) {
  const lead =
    reply.kind === "answer"
      ? reply.text
      : reply.kind === "notCovered"
        ? notCoveredText
        : deferredText;
  const sourcesLabel =
    reply.kind === "notCovered"
      ? "Closest sections in the guide:"
      : reply.kind === "deferred"
        ? "For now, these guide sections belong to this step:"
        : null;

  return (
    <div className="flex flex-col gap-2">
      <p>{lead}</p>
      {sourcesLabel && <p className="text-sm text-text-secondary">{sourcesLabel}</p>}
      <div className="flex flex-wrap gap-2">
        {reply.sources.map((sectionId) => (
          <SourceChip key={sectionId} sectionId={sectionId} showTitle={reply.kind !== "answer"} />
        ))}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-1 py-2" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-pulse rounded-full bg-text-secondary"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

/** A suggested question. Wrapped in full in the empty chat, on one line in the scrolling row. */
function ChipButton({
  chip,
  disabled,
  onAsk,
  wrap = false,
}: {
  chip: ChatChip;
  disabled: boolean;
  onAsk: (question: { text: string; chipId?: string }) => void;
  wrap?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAsk({ text: chip.question, chipId: chip.id })}
      className={`min-h-11 rounded-full border border-border bg-surface px-4 py-2 text-left text-sm text-text hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-text-secondary ${
        wrap ? "max-w-full" : "shrink-0 whitespace-nowrap"
      }`}
    >
      {chip.question}
    </button>
  );
}

function ChatPanel({
  chat,
  messages,
  typing,
  onAsk,
  onClose,
}: {
  chat: OpenChat;
  messages: ChatMessage[];
  typing: boolean;
  onAsk: (question: { text: string; chipId?: string }) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const askedIds = messages.flatMap((message) =>
    message.role === "trainee" && message.chipId ? [message.chipId] : [],
  );
  const chips = suggestedChips(chat.step, chat.phase, askedIds);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, typing]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    onAsk({ text });
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="flex flex-col">
          <h2 id="ask-ai-title" className="font-serif text-xl">
            Ask AI
          </h2>
          <p className="text-sm text-text-secondary">{chat.step.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mt-2 -mr-2 min-h-11 min-w-11 rounded-full px-3 text-base text-text underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Close
        </button>
      </div>
      <p className="border-b border-border px-4 pt-1 pb-3 text-sm text-text-secondary">
        Answers are simulated for this prototype.
      </p>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              {chat.phase === "decide"
                ? "Ask about the situation or the guide. Until you check your answer, I explain the material but do not say which action is right."
                : "Ask about this step, including why the other actions are worse."}
            </p>
            <p className="text-sm font-medium">Suggested questions</p>
            <div className="flex flex-col items-start gap-2">
              {chips.map((chip) => (
                <ChipButton key={chip.id} chip={chip} disabled={typing} onAsk={onAsk} wrap />
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) =>
          message.role === "trainee" ? (
            <p
              key={index}
              className="max-w-[85%] self-end rounded-panel bg-surface-muted px-4 py-2"
            >
              {message.text}
            </p>
          ) : (
            <AiMessage key={index} reply={message.reply} />
          ),
        )}
        {typing && <Typing />}
        <p role="status" className="sr-only">
          {typing ? "AI is typing" : ""}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {messages.length > 0 && chips.length > 0 && (
          <div
            role="group"
            aria-label="More suggested questions"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          >
            {chips.map((chip) => (
              <ChipButton key={chip.id} chip={chip} disabled={typing} onAsk={onAsk} />
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex items-center gap-2">
          <label htmlFor="ask-ai-input" className="sr-only">
            Your question
          </label>
          <input
            id="ask-ai-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about this step"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-full border border-border-strong bg-surface px-4 text-base hover:border-text focus-visible:border-primary"
          />
          <button
            type="submit"
            disabled={!draft.trim() || typing}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-primary px-5 font-medium text-primary-text hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary disabled:opacity-100"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * The Ask AI sheet and its conversations, one per step, kept while the provider stays mounted
 * (the session page). With inline, the sheet is drawn inside its nearest positioned parent,
 * for the screen review page.
 */
export function AskAiProvider({
  children,
  inline = false,
  initial,
}: {
  children: ReactNode;
  inline?: boolean;
  initial?: { chat: OpenChat; messages: ChatMessage[]; typing?: boolean };
}) {
  const [chat, setChat] = useState<OpenChat | null>(initial?.chat ?? null);
  const [conversations, setConversations] = useState<Conversations>(
    initial ? { [initial.chat.step.id]: initial.messages } : {},
  );
  const [typing, setTyping] = useState(initial?.typing ?? false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (inline || !dialog) return;
    if (chat && !dialog.open) dialog.showModal();
    if (!chat || !dialog.open) return;

    // Keep the sheet above the on-screen keyboard: size it to the visible part of the screen.
    const viewport = window.visualViewport;
    function fit() {
      if (!dialog) return;
      const visible = viewport?.height ?? window.innerHeight;
      const hidden = viewport ? window.innerHeight - viewport.height - viewport.offsetTop : 0;
      dialog.style.height = `${Math.min(window.innerHeight * 0.85, visible * 0.94)}px`;
      dialog.style.bottom = `${Math.max(0, hidden)}px`;
    }
    fit();
    viewport?.addEventListener("resize", fit);
    viewport?.addEventListener("scroll", fit);
    return () => {
      viewport?.removeEventListener("resize", fit);
      viewport?.removeEventListener("scroll", fit);
    };
  }, [chat, inline]);

  function add(stepId: string, ...messages: ChatMessage[]) {
    setConversations((current) => ({
      ...current,
      [stepId]: [...(current[stepId] ?? []), ...messages],
    }));
  }

  function open(step: Step, phase: ChatPhase) {
    setChat({ step, phase });
  }

  function ask(question: { text: string; chipId?: string }) {
    if (!chat || typing) return;
    const { step, phase } = chat;
    const reply = question.chipId
      ? replyToChip(step, question.chipId, phase)
      : matchQuestion(step, question.text, phase);
    add(step.id, { role: "trainee", text: question.text, chipId: question.chipId });
    setTyping(true);
    timer.current = setTimeout(() => {
      add(step.id, { role: "ai", reply });
      setTyping(false);
    }, TYPING_MS);
  }

  const panel = chat && (
    <ChatPanel
      chat={chat}
      messages={conversations[chat.step.id] ?? []}
      typing={typing}
      onAsk={ask}
      onClose={() => (inline ? setChat(null) : dialogRef.current?.close())}
    />
  );

  return (
    <AskAiContext.Provider value={{ open }}>
      {children}
      {inline ? (
        chat && (
          <div className="scrim absolute inset-0 z-20 flex items-end">
            <div
              role="dialog"
              aria-labelledby="ask-ai-title"
              className="h-[85%] w-full rounded-t-card bg-surface text-text"
            >
              {panel}
            </div>
          </div>
        )
      ) : (
        <dialog
          ref={dialogRef}
          data-sheet
          aria-labelledby="ask-ai-title"
          onClose={() => setChat(null)}
          onClick={(event) => {
            if (event.target === dialogRef.current) dialogRef.current?.close();
          }}
          className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto h-[85dvh] max-h-none w-full max-w-app overflow-hidden rounded-t-card bg-surface p-0 text-text"
        >
          {panel}
        </dialog>
      )}
    </AskAiContext.Provider>
  );
}

/** Secondary pill that opens the Ask AI sheet for the current step, if it has prepared answers. */
export function AskAiButton({
  step,
  phase,
  size = "regular",
}: {
  step: Step;
  phase: ChatPhase;
  /** small: a 40px pill for the answer sheet, with the tap area kept at 44px. */
  size?: "regular" | "small";
}) {
  const { open } = useAskAi();
  // Only steps with prepared answers offer the chat (the flood scenario has none).
  if (step.chat.length === 0 && !step.suggestedQuestion) return null;
  return (
    <button
      type="button"
      onClick={() => open(step, phase)}
      className={`relative inline-flex items-center justify-center gap-2 self-start rounded-full border border-text bg-surface font-medium text-text hover:bg-surface-muted active:bg-border ${
        size === "small"
          ? "min-h-10 px-4 text-sm after:absolute after:-inset-y-0.5 after:inset-x-0"
          : "min-h-11 px-5 text-base"
      }`}
    >
      <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
      Ask AI about this step
    </button>
  );
}
