import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_WORDS,
  FIELDS,
  cleanField,
  fullLabels,
  shortLabel,
  shortLabels,
  tunedLine,
} from "@/lib/field-of-work";
import {
  answerTo,
  answerToSuggested,
  exampleLine,
  followUp,
  questionThread,
  suggested,
  suggestedById,
  suggestedFor,
  topicIds,
} from "@/lib/ask-ai";
import content from "@/content/ask-ai.json";
import { getItem } from "@/lib/items";

const NOW = 1_000;
const TUNED = ["rescue", "paramedic", "military", "civil"] as const;

describe("the field of work", () => {
  it("has the five values with their full and short labels", () => {
    expect(FIELDS).toEqual(["rescue", "paramedic", "military", "civil", "other"]);
    expect(fullLabels).toEqual({
      rescue: "Rescue and emergency services",
      paramedic: "Paramedic or medical",
      military: "Military",
      civil: "Civil protection or volunteer",
      other: "Other",
    });
    expect(shortLabels).toEqual({
      rescue: "Rescue services",
      paramedic: "Paramedic",
      military: "Military",
      civil: "Civil protection",
      other: "Other",
    });
    expect(shortLabel(null)).toBe("Not set");
    expect(shortLabel("civil")).toBe("Civil protection");
  });

  it("reads anything else as not set, without a crash", () => {
    for (const bad of [undefined, null, "", "pilot", 3, {}, [], "RESCUE"]) {
      expect(cleanField(bad)).toBeNull();
    }
    expect(cleanField("military")).toBe("military");
  });

  it("words the Ask AI row", () => {
    expect(tunedLine("paramedic")).toBe("Answers tuned for: Paramedic");
    expect(tunedLine(null)).toBe("Set your field to tune answers");
  });
});

describe("Ask AI tuned by the field", () => {
  it("has four suggested questions per tuned field, on known topics, and the general list for the rest", () => {
    for (const field of TUNED) {
      const list = suggestedFor(field);
      expect(list).toHaveLength(4);
      for (const entry of list) {
        expect(topicIds).toContain(entry.topic);
        expect(suggestedById(entry.id)).toEqual(entry);
      }
    }
    expect(suggestedFor("other")).toBe(suggested);
    expect(suggestedFor(null)).toBe(suggested);
    const stems = TUNED.map((f) =>
      suggestedFor(f)
        .map((s) => s.question)
        .join("|"),
    );
    expect(new Set(stems).size).toBe(4);
  });

  it("has one example sentence for every topic and tuned field, all different between fields", () => {
    for (const topic of topicIds) {
      const lines = TUNED.map((field) => exampleLine(field, topic));
      expect(lines.every((l) => l && l.length > 30)).toBe(true);
      expect(new Set(lines).size).toBe(4);
    }
  });

  it("words the line with the short label in lower case; other uses the general example; none gives no line", () => {
    expect(exampleLine("rescue", "S1")).toMatch(/^Example for rescue services: /);
    expect(exampleLine("civil", "S4")).toMatch(/^Example for civil protection: /);
    const other = exampleLine("other", "S1")!;
    expect(other).toMatch(/^Example for other: /);
    expect(other).not.toContain("Example: ");
    expect(exampleLine(null, "S1")).toBeNull();
    expect(exampleLine("rescue", undefined)).toBeNull();
    expect(exampleLine("rescue", "S99")).toBeNull();
  });

  it("ends every prepared answer with the line while a field is set, and leaves it alone without one", () => {
    const plain = answerTo("how do I move through smoke", NOW);
    const tuned = answerTo("how do I move through smoke", NOW, "paramedic");
    expect(tuned.topic).toBe("S3");
    expect(tuned.text.startsWith(plain.text)).toBe(true);
    expect(tuned.text.endsWith(exampleLine("paramedic", "S3")!)).toBe(true);
    expect(plain.text).not.toContain("Example for");
    const sg = answerToSuggested("sg-alarm", NOW, "military");
    expect(sg.text.endsWith(exampleLine("military", "S1")!)).toBe(true);
    expect(answerToSuggested("sg-alarm", NOW).text).toBe(sg.text.split("\n\nExample for")[0]);
    // a question that matches nothing has no topic and no line
    expect(answerTo("zzz qqq", NOW, "rescue").text).not.toContain("Example for");
  });

  it("gives 'Give an example' a field sentence that differs between fields, and the general one without a field", () => {
    const texts = TUNED.map((f) => followUp("example", "S5", NOW, f).text);
    expect(new Set(texts).size).toBe(4);
    expect(followUp("example", "S5", NOW).text).toMatch(/^Example: /);
    expect(followUp("example", "S5", NOW, "other").text).toMatch(/^Example for other: /);
    expect(followUp("simple", "S5", NOW, "civil").text).toContain("Example for civil protection:");
  });

  it("adds the line to the first message of a question thread, and not without a field", () => {
    const item = getItem("q-s3-3");
    const titleOf = (id: string) => id;
    const plain = questionThread(item, 1, "a", titleOf, NOW);
    const tuned = questionThread(item, 1, "a", titleOf, NOW, "rescue");
    const topic = item.guideRef[0];
    expect(tuned.messages[0].text.startsWith(plain.messages[0].text)).toBe(true);
    expect(tuned.messages[0].text.endsWith(exampleLine("rescue", topic)!)).toBe(true);
    expect(plain.messages[0].text).not.toContain("Example for");
    // the text is a plain string saved with the thread: a later change of field cannot alter it
    expect(typeof tuned.messages[0].text).toBe("string");
  });

  it("stays educational and non-combat in every sentence, for every field", () => {
    const all = JSON.stringify([content.examples, content.suggestedByField]).toLowerCase();
    for (const word of FORBIDDEN_WORDS) expect(all, word).not.toContain(word);
    expect(Object.keys(content.examples).sort()).toEqual([
      "civil",
      "military",
      "paramedic",
      "rescue",
    ]);
    for (const field of Object.values(content.examples))
      expect(Object.keys(field)).toHaveLength(10);
  });
});
