import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Every source file (no tests, no screen review page, no node_modules). */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(tsx?|css)$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });
}

const code = [...sources("app"), ...sources("components"), ...sources("lib")].filter(
  (file) => !file.startsWith("app/screens/"),
);

/** Files that contain a pattern, for a readable failure. */
const containing = (pattern: RegExp) =>
  code.filter((file) => pattern.test(readFileSync(file, "utf8")));

describe("one binary pattern: right or wrong, nothing else", () => {
  it("has no bottom sheet for answers any more", () => {
    expect(existsSync("components/AnswerSheet")).toBe(false);
    expect(existsSync("components/AnswerDock")).toBe(false);
    expect(containing(/AnswerSheet|answer-sheet|answer-dock|AnswerDock/)).toEqual([]);
  });

  it("has no confidence question", () => {
    expect(existsSync("components/ConfidenceSelector")).toBe(false);
    expect(containing(/[Cc]onfidence|How sure are you/)).toEqual([]);
  });

  it("has no free-text explanation, keyword matching, verdicts or overrides", () => {
    expect(containing(/explanationCheck|checkExplanation|Better explanation/)).toEqual([]);
    expect(containing(/Matches the guide|Doesn't match the guide/)).toEqual([]);
    expect(containing(/still correct|MarkCorrect|markedCorrect|Marked correct/)).toEqual([]);
    // (the Instructor's Edit question form has the question and explanation fields: Content, not a session)
    expect(
      containing(/Explain your choice|<textarea/).filter(
        (file) => file !== "components/InstructorContent/EditQuestionView.tsx",
      ),
    ).toEqual([]);
  });

  it("has no error types, chips, card, details or analysis pages", () => {
    expect(containing(/errorType|ErrorType|error_type|knowledge_gap|misconception/i)).toEqual([]);
    expect(containing(/Error types|Error analysis|Sure, but wrong/)).toEqual([]);
    expect(existsSync("components/ErrorTypesCard")).toBe(false);
    expect(existsSync("components/AnalysisView")).toBe(false);
    expect(existsSync("app/(app)/session/results/analysis")).toBe(false);
  });

  it("has no other question types: multiple choice, ordering or short text", () => {
    expect(existsSync("components/OrderingList")).toBe(false);
    expect(existsSync("components/QuizQuestion")).toBe(false);
    expect(containing(/"ordering"|"multiple"|"truefalse"|OrderingList/)).toEqual([]);
  });

  it("has no unused content fields in the content files", () => {
    const content = readdirSync("content")
      .filter((name) => name.endsWith(".json"))
      .map((name) => readFileSync(join("content", name), "utf8"))
      .join("\n");
    for (const field of [
      "explanationKeyBeats",
      "explanationKeywords",
      "referenceExplanation",
      "misconception",
      "confidenceScale",
      "errorTypeRule",
    ]) {
      expect(content, field).not.toContain(`"${field}"`);
    }
  });

  it("has no error-type colour tokens left in the style sheet", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).not.toMatch(/--(secure|misconception|guess-ink|gap-row|secure-row|guess-row)\b/);
  });
});

describe("the session screens", () => {
  it("has no Back button in the bottom bar: Back is in the top row", () => {
    const bar = readFileSync("components/SessionBar/SessionBar.tsx", "utf8");
    expect(bar).not.toMatch(/CircleBackButton|Previous|onBack/);
    const top = readFileSync("components/SessionTopBar/SessionTopBar.tsx", "utf8");
    expect(top).toContain("CircleBackButton");
  });

  it("starts the page with no feedback shown during a session", () => {
    const page = readFileSync("app/(app)/session/page.tsx", "utf8");
    expect(page).not.toMatch(/Correct|Incorrect|correctOptionId|scoreItem|AskAi/);
  });
});

describe("Session setup is gone", () => {
  it("has no screen, component or link to it", () => {
    expect(existsSync("components/SessionSetup")).toBe(false);
    expect(existsSync("app/(app)/session/setup")).toBe(false);
    expect(existsSync("lib/setup.ts")).toBe(false);
    expect(containing(/session\/setup|SessionSetup/)).toEqual([]);
  });

  it("has none of its settings: lengths 10/20/30, Shuffle, Only topics to repeat, Guide sections row", () => {
    expect(
      containing(/Shuffle questions|Only topics to repeat|lengthOptions|fitLength|LENGTHS/),
    ).toEqual([]);
    expect(containing(/Guide sections ·/)).toEqual([]);
    expect(containing(/pickScenarioItems|buildSession|onlyWeakSections/)).toEqual([]);
  });
});
