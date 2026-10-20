import { describe, expect, it } from "vitest";
import {
  DISCLAIMER,
  FALLBACK_TEXT,
  MAX_THREADS,
  answerTo,
  answerToSuggested,
  cleanThreads,
  followUp,
  matchTopic,
  newThread,
  questionThread,
  questionThreadId,
  suggested,
  timeLabel,
  topicIds,
  withThread,
} from "@/lib/ask-ai";
import type { Thread } from "@/lib/ask-ai";
import { getItem } from "@/lib/items";
import content from "@/content/ask-ai.json";

const titleOf = (id: string) => `Title of ${id}`;
const now = new Date(2026, 9, 23, 12, 0).getTime();

const thread = (n: number): Thread => ({
  id: `t${n}`,
  title: `Thread ${n}`,
  subtitle: "S1 · x",
  createdAt: n,
  updatedAt: n,
  messages: [{ id: `m${n}`, role: "ai", text: "hi", sources: [] }],
});

describe("the prepared Ask AI content", () => {
  it("has the four suggested questions and the topics S1 to S10, each with the three variants", () => {
    expect(suggested).toHaveLength(4);
    expect(topicIds).toEqual(Array.from({ length: 10 }, (_, i) => `S${i + 1}`));
    for (const id of topicIds) {
      const topic = content.topics[id as keyof typeof content.topics];
      expect(topic.answer.length, id).toBeGreaterThan(20);
      expect(topic.example.length, id).toBeGreaterThan(20);
      expect(topic.simple.length, id).toBeGreaterThan(20);
      expect(topic.guide.length, id).toBeGreaterThan(0);
      expect(topic.keywords.length, id).toBeGreaterThan(2);
    }
    expect(content.fallbackSuggested).toHaveLength(3);
    for (const entry of suggested) expect(topicIds).toContain(entry.topic);
  });

  it("restates the guide: every guide line of a topic is in the guide file", async () => {
    const { readFileSync } = await import("node:fs");
    const guide = readFileSync("content/sample-evacuation-guide.md", "utf8").replaceAll("**", "");
    for (const id of topicIds) {
      for (const line of content.topics[id as keyof typeof content.topics].guide) {
        expect(guide, `${id}: ${line.slice(0, 40)}`).toContain(line);
      }
    }
  });

  it("is educational only: no weapon or combat words", () => {
    expect(JSON.stringify(content).toLowerCase()).not.toMatch(
      /\b(weapon|gun|rifle|combat|attack|kill|bomb|explosive)\b/,
    );
  });
});

describe("matching a free question", () => {
  it("finds the topic by keyword", () => {
    expect(matchTopic("How do I move through smoke?")).toBe("S3");
    expect(matchTopic("what about a burn on my hand")).toBe("S8");
    expect(matchTopic("Should I take the elevator when the alarm sounds")).toBe("S1");
    expect(matchTopic("tell me about S9")).toBe("S9");
  });

  it("answers with the topic text and ONE source pill", () => {
    const reply = answerTo("how do I call 112", now);
    expect(reply.role).toBe("ai");
    expect(reply.topic).toBe("S5");
    expect(reply.sources).toEqual(["S5"]);
    expect(reply.text).toContain("112");
  });

  it("falls back with the prepared message and 3 suggestions when nothing matches", () => {
    const reply = answerTo("what is the capital of France", now);
    expect(reply.text).toBe(FALLBACK_TEXT);
    expect(reply.suggestions).toHaveLength(3);
    expect(reply.sources).toEqual([]);
    expect(reply.topic).toBeUndefined();
    expect(answerTo("", now).text).toBe(FALLBACK_TEXT);
  });

  it("answers a suggested question from its topic", () => {
    const reply = answerToSuggested(suggested[0].id, now);
    expect(reply.topic).toBe(suggested[0].topic);
    expect(reply.sources).toEqual([suggested[0].topic]);
  });

  it("states the prototype disclaimer in one place", () => {
    expect(DISCLAIMER).toBe(
      "Prototype answer: a prepared example, not a live AI. It may be inaccurate.",
    );
  });
});

describe("follow-ups", () => {
  it("adds an example, a simple explanation and the guide's own lines, each with the section pill", () => {
    const example = followUp("example", "S3", now);
    const simple = followUp("simple", "S3", now);
    const guide = followUp("guide", "S3", now);
    expect(example.text).toBe(content.topics.S3.example);
    expect(simple.text).toBe(content.topics.S3.simple);
    expect(guide.text).toContain("From the guide:");
    expect(guide.text).toContain(content.topics.S3.guide[0]);
    for (const reply of [example, simple, guide]) {
      expect(reply.sources).toEqual(["S3"]);
      expect(reply.topic).toBe("S3");
    }
  });
});

describe("threads", () => {
  it("starts with the user message and the answer waiting", () => {
    const reply = answerTo("smoke", now);
    const t = newThread("How do I move through smoke?", reply, titleOf, now);
    expect(t.title).toBe("How do I move through smoke?");
    expect(t.subtitle).toBe("S3 · Title of S3");
    expect(t.messages).toHaveLength(1);
    expect(t.messages[0].role).toBe("user");
    expect(t.messages[0].reply?.text).toBe(reply.text);
    expect(newThread("zzz", answerTo("zzz", now), titleOf, now).subtitle).toBe("Not covered yet");
  });

  it("shortens a long first question to one line", () => {
    const t = newThread("a".repeat(200), answerTo("smoke", now), titleOf, now);
    expect(t.title.length).toBeLessThanOrEqual(60);
    expect(t.title.endsWith("…")).toBe(true);
  });

  it("keeps at most 30, newest first, dropping the least recently updated", () => {
    let list: Thread[] = [];
    for (let n = 1; n <= 35; n++) list = withThread(list, thread(n));
    expect(list).toHaveLength(MAX_THREADS);
    expect(list[0].id).toBe("t35");
    expect(list.at(-1)!.id).toBe("t6");
    expect(list.some((t) => t.id === "t1")).toBe(false);
  });

  it("replaces a thread with the same id instead of duplicating it", () => {
    const list = withThread(withThread([], thread(1)), { ...thread(1), title: "Changed" });
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Changed");
  });
});

describe("a question thread", () => {
  const item = getItem("q-scn-s01-001");
  const wrong = item.options.find((o) => o.id !== item.correctOptionId)!.id;

  it("composes the first message from the question data only", () => {
    const t = questionThread(item, 3, wrong, titleOf, now);
    expect(t.id).toBe(questionThreadId(item.id));
    expect(t.questionId).toBe(item.id);
    expect(t.title.startsWith("Question 3: ")).toBe(true);
    expect(t.messages).toHaveLength(1);
    const message = t.messages[0];
    const answered = item.options.find((o) => o.id === wrong)!.text;
    const correct = item.options.find((o) => o.id === item.correctOptionId)!.text;
    expect(message.text).toContain(`You answered: ${answered}`);
    expect(message.text).toContain(`The correct answer: ${correct}`);
    expect(message.text).toContain(`Why: ${item.why}`);
    expect(message.sources).toEqual(item.guideRef.slice(0, 3));
    expect(message.sources.length).toBeGreaterThanOrEqual(1);
    expect(t.subtitle).toContain(item.guideRef[0]);
  });

  it("says the answer was right when it was, and has no answer line without a choice", () => {
    const right = questionThread(item, 1, item.correctOptionId, titleOf, now).messages[0].text;
    expect(right).toContain("That is the correct answer.");
    expect(right).not.toContain("The correct answer:");
    const saved = questionThread(item, 1, null, titleOf, now).messages[0].text;
    expect(saved).not.toContain("You answered");
    expect(saved).toContain("The correct answer:");
  });
});

describe("tolerant loading", () => {
  it("drops broken threads and messages without throwing", () => {
    const loaded = cleanThreads([
      thread(1),
      null,
      "x",
      { id: 5 },
      { ...thread(2), messages: "nope" },
      { ...thread(3), messages: [{ id: "a", role: "robot", text: "x" }, null] },
      { ...thread(4), updatedAt: "now" },
      {
        ...thread(7),
        messages: [{ id: "m", role: "ai", text: "ok", sources: ["S1", 4, "", "S2", "S3", "S4"] }],
      },
    ]);
    expect(loaded!.map((t) => t.id)).toEqual(["t7", "t1"]);
    expect(loaded![0].messages[0].sources).toEqual(["S1", "S2", "S3"]);
    expect(cleanThreads("garbage")).toBeNull();
    expect(cleanThreads(null)).toBeNull();
    expect(cleanThreads([])).toBeNull();
  });

  it("caps and de-duplicates what it reads", () => {
    const many = Array.from({ length: 40 }, (_, i) => thread(i + 1));
    expect(cleanThreads([...many, thread(40)])!).toHaveLength(MAX_THREADS);
  });
});

describe("time labels", () => {
  it("reads just now, minutes, hours, yesterday and a date", () => {
    expect(timeLabel(now - 20_000, now)).toBe("Just now");
    expect(timeLabel(now - 5 * 60_000, now)).toBe("5 min ago");
    expect(timeLabel(now - 2 * 3_600_000, now)).toBe("2 h ago");
    expect(timeLabel(new Date(2026, 9, 22, 9, 0).getTime(), now)).toBe("Yesterday");
    expect(timeLabel(new Date(2026, 9, 20, 9, 0).getTime(), now)).toBe("20 Oct");
  });
});
