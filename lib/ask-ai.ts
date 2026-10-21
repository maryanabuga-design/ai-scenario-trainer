import content from "@/content/ask-ai.json";
import { keywordMatches, tokens } from "@/lib/chat";
import { shortLabels } from "@/lib/field-of-work";
import type { FieldOfWork } from "@/lib/field-of-work";
import type { Item } from "@/lib/items";

/**
 * The simulated Ask AI (DESIGN.md: Ask AI): prepared content from `content/ask-ai.json` and the
 * question data, keyword matching, conversations and their rules. Pure: no storage, no network.
 */

export const MAX_THREADS = 30;
export const DISCLAIMER =
  "Prototype answer: a prepared example, not a live AI. It may be inaccurate.";
export const FALLBACK_TEXT = "I do not have a prepared answer for this. Try one of these:";
export const EMPTY_TEXT = "Ask about any topic in the guides";
/** The wait before an answer, in ms (0 with reduced motion). */
export const TYPING_MS = 600;

export type AiMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  /** Guide section ids shown as source pills (1 to 3). */
  sources: string[];
  /** The guide topic the answer is about: the quick actions use it. */
  topic?: string;
  /** Ids of suggested questions offered by a fallback reply. */
  suggestions?: string[];
  /** A user message waiting for its answer (the typing indicator shows, then this is added). */
  reply?: AiMessage;
};

export type Thread = {
  id: string;
  title: string;
  /** The muted second line: the topic or question reference. */
  subtitle: string;
  createdAt: number;
  updatedAt: number;
  /** One thread per question: the id of the question it is about. */
  questionId?: string;
  messages: AiMessage[];
};

type Topic = {
  keywords: string[];
  answer: string;
  example: string;
  simple: string;
  guide: string[];
};
const topics = content.topics as Record<string, Topic>;
export const topicIds = Object.keys(topics);
export type Suggested = { id: string; topic: string; question: string };
export const suggested = content.suggested as Suggested[];
const fallbackIds = content.fallbackSuggested as string[];
const suggestedByField = content.suggestedByField as Record<string, Suggested[]>;
const examplesByField = content.examples as Record<string, Record<string, string>>;

/** The suggested questions for a field: its own four, or the general list for "other" and no field. */
export function suggestedFor(field: FieldOfWork | null): Suggested[] {
  return (field && suggestedByField[field]) || suggested;
}

/**
 * The example line of a topic for a field: "Example for rescue services: <sentence>", or null while no
 * field is set. "Other" uses the general example of the topic. Safe, educational sentences only.
 */
export function exampleLine(field: FieldOfWork | null, topic: string | undefined): string | null {
  if (!field || !topic || !(topic in topics)) return null;
  const sentence =
    examplesByField[field]?.[topic] ?? topics[topic].example.replace(/^Example:\s*/, "");
  return `Example for ${shortLabels[field].toLowerCase()}: ${sentence}`;
}

/** A prepared answer with the example line of the field at its end (the text as it is without a field). */
export function withExample(text: string, field: FieldOfWork | null, topic: string | undefined) {
  const line = exampleLine(field, topic);
  return line ? `${text}\n\n${line}` : text;
}

export type QuickAction = "example" | "simple" | "guide";
export const quickActions: { id: QuickAction; label: string }[] = [
  { id: "example", label: "Give an example" },
  { id: "simple", label: "Explain simply" },
  { id: "guide", label: "Show the guide" },
];

let counter = 0;
export function newId(prefix: string, now: number) {
  counter += 1;
  return `${prefix}-${now.toString(36)}-${counter}`;
}

export const suggestedById = (id: string) =>
  [...suggested, ...Object.values(suggestedByField).flat()].find((entry) => entry.id === id);

/** The topic whose keywords match the text best (a section id such as "s3" counts too); null when none. */
export function matchTopic(text: string): string | null {
  const words: string[] = tokens(text);
  const normalised = words.join(" ");
  let best: { id: string; score: number } | null = null;
  for (const id of topicIds) {
    let score = topics[id].keywords.filter((keyword) =>
      keywordMatches(keyword, words, normalised),
    ).length;
    if (words.includes(id.toLowerCase())) score += 2;
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  return best?.id ?? null;
}

/** The prepared reply to a free question. */
export function answerTo(text: string, now: number, field: FieldOfWork | null = null): AiMessage {
  const topic = matchTopic(text);
  if (!topic) {
    return {
      id: newId("m", now),
      role: "ai",
      text: FALLBACK_TEXT,
      sources: [],
      suggestions: fallbackIds,
    };
  }
  return {
    id: newId("m", now),
    role: "ai",
    text: withExample(topics[topic].answer, field, topic),
    sources: [topic],
    topic,
  };
}

/** The prepared answer for a suggested question. */
export function answerToSuggested(
  id: string,
  now: number,
  field: FieldOfWork | null = null,
): AiMessage {
  const entry = suggestedById(id);
  if (!entry) return answerTo("", now, field);
  return {
    id: newId("m", now),
    role: "ai",
    text: withExample(topics[entry.topic].answer, field, entry.topic),
    sources: [entry.topic],
    topic: entry.topic,
  };
}

/** A follow-up from the same topic data: an example, a simple explanation, or the guide's own lines. */
export function followUp(
  action: QuickAction,
  topic: string,
  now: number,
  field: FieldOfWork | null = null,
): AiMessage {
  const data = topics[topic];
  const text =
    action === "example"
      ? (exampleLine(field, topic) ?? data.example)
      : withExample(
          action === "simple"
            ? data.simple
            : `From the guide:\n${data.guide.map((line) => `• ${line}`).join("\n")}`,
          field,
          topic,
        );
  return { id: newId("m", now), role: "ai", text, sources: [topic], topic };
}

export const actionLabel = (action: QuickAction) =>
  quickActions.find((entry) => entry.id === action)!.label;

/** A user message that will be answered by `reply` once the typing indicator has run. */
export function userMessage(text: string, reply: AiMessage, now: number): AiMessage {
  return { id: newId("u", now), role: "user", text, sources: [], reply };
}

const shorten = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

/** A new conversation from a first question (free text or a suggested one). */
export function newThread(
  question: string,
  reply: AiMessage,
  titleOf: (id: string) => string | undefined,
  now: number,
): Thread {
  const topic = reply.topic;
  return {
    id: newId("t", now),
    title: shorten(question, 60),
    subtitle: topic ? `${topic} · ${titleOf(topic) ?? ""}`.trim() : "Not covered yet",
    createdAt: now,
    updatedAt: now,
    messages: [userMessage(question, reply, now)],
  };
}

/** The one thread of a question (DESIGN.md: Question threads): created on first use, never duplicated. */
export const questionThreadId = (questionId: string) => `q-${questionId}`;

export function questionThread(
  item: Item,
  number: number,
  choice: string | null,
  titleOf: (id: string) => string | undefined,
  now: number,
  field: FieldOfWork | null = null,
): Thread {
  const optionText = (id: string | null) => item.options.find((option) => option.id === id)?.text;
  const lines: string[] = [];
  const chosen = choice ? optionText(choice) : undefined;
  if (chosen) {
    lines.push(
      choice === item.correctOptionId
        ? `You answered: ${chosen} That is the correct answer.`
        : `You answered: ${chosen}`,
    );
  }
  if (choice !== item.correctOptionId) {
    lines.push(`The correct answer: ${optionText(item.correctOptionId) ?? ""}`);
  }
  lines.push(`Why: ${item.why}`);
  const sources = item.guideRef.slice(0, 3);
  const topic = sources.find((id) => id in topics);
  const first = sources[0];
  return {
    id: questionThreadId(item.id),
    title: `Question ${number}: ${shorten(item.question, 40)}`,
    subtitle: first ? `${first} · ${titleOf(first) ?? ""}`.trim() : item.question,
    createdAt: now,
    updatedAt: now,
    questionId: item.id,
    messages: [
      {
        id: newId("m", now),
        role: "ai",
        text: withExample(lines.join("\n\n"), field, topic),
        sources,
        ...(topic && { topic }),
      },
    ],
  };
}

/** Puts a thread first, replaces one with the same id, and keeps at most MAX_THREADS (the least recently updated go first). */
export function withThread(list: Thread[], thread: Thread): Thread[] {
  const rest = list.filter((entry) => entry.id !== thread.id);
  const next = [thread, ...rest].sort((a, b) => b.updatedAt - a.updatedAt);
  return next.slice(0, MAX_THREADS);
}

export function updateThread(list: Thread[], id: string, change: (thread: Thread) => Thread) {
  return list.map((thread) => (thread.id === id ? change(thread) : thread));
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function cleanMessage(value: unknown, depth = 0): AiMessage | null {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.text !== "string") return null;
  if (value.role !== "user" && value.role !== "ai") return null;
  const sources = Array.isArray(value.sources)
    ? value.sources
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .slice(0, 3)
    : [];
  const reply = depth === 0 && value.reply ? cleanMessage(value.reply, 1) : null;
  return {
    id: value.id,
    role: value.role,
    text: value.text,
    sources,
    ...(typeof value.topic === "string" && value.topic in topics && { topic: value.topic }),
    ...(Array.isArray(value.suggestions) && {
      suggestions: value.suggestions.filter(
        (id): id is string => typeof id === "string" && suggestedById(id) !== undefined,
      ),
    }),
    ...(reply && value.role === "user" && { reply }),
  };
}

/** Tolerant loading: a broken thread or message is dropped, never a crash. Sorted, capped. */
export function cleanThreads(value: unknown): Thread[] | null {
  if (!Array.isArray(value)) return null;
  const threads: Thread[] = [];
  for (const entry of value) {
    if (!isObject(entry)) continue;
    if (typeof entry.id !== "string" || typeof entry.title !== "string") continue;
    if (typeof entry.createdAt !== "number" || typeof entry.updatedAt !== "number") continue;
    const messages = Array.isArray(entry.messages)
      ? entry.messages.map((m) => cleanMessage(m)).filter((m): m is AiMessage => m !== null)
      : [];
    if (messages.length === 0) continue;
    threads.push({
      id: entry.id,
      title: entry.title,
      subtitle: typeof entry.subtitle === "string" ? entry.subtitle : "",
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      ...(typeof entry.questionId === "string" && { questionId: entry.questionId }),
      messages,
    });
  }
  const unique = threads.filter((t, i) => threads.findIndex((o) => o.id === t.id) === i);
  const sorted = unique.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_THREADS);
  return sorted.length > 0 ? sorted : null;
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** "Just now", "5 min ago", "2 h ago", "Yesterday" or "21 Oct". */
export function timeLabel(then: number, now: number): string {
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const a = new Date(then);
  const b = new Date(now);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);
  if (days === 0) return `${Math.floor(minutes / 60)} h ago`;
  if (days === 1) return "Yesterday";
  return dayMonth.format(a);
}

/** The latest AI message of a thread, for the quick actions. */
export function lastAi(thread: Thread): AiMessage | undefined {
  return [...thread.messages].reverse().find((message) => message.role === "ai");
}
