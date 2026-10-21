import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  MAX_OTHER_BYTES,
  detectTopic,
  isRead,
  titleFromFileName,
  canPublish,
  checkFile,
  detectDelimiter,
  parseCsv,
  problemsOf,
  publishHint,
  readCsv,
  reviewCounts,
  sampleQuestions,
  sizeText,
} from "@/lib/content-import";
import type { ImportedQuestion } from "@/lib/content-import";

const HEADER =
  "topic,question,option_a,option_b,option_c,option_d,correct,explanation,guide_reference,image_url";
const row = (n: number, extra = "") =>
  `S1,Question ${n}?,One,Two,Three,Four,B,Because ${n}.,S1,${extra}`;

const read = (text: string) => {
  const result = readCsv(text, "set1");
  if (!result.ok) throw new Error(result.error);
  return result;
};

describe("reading a CSV file", () => {
  it("reads comma files, with or without a BOM, and Windows line breaks", () => {
    const text = [HEADER, row(1), row(2)].join("\r\n");
    for (const input of [text, `﻿${text}`]) {
      const { questions } = read(input);
      expect(questions).toHaveLength(2);
      expect(questions[0]).toMatchObject({
        id: "set1-1",
        text: "Question 1?",
        options: ["One", "Two", "Three", "Four"],
        correct: "b",
        explanation: "Because 1.",
        guideRef: "S1",
      });
    }
  });

  it("detects a semicolon delimiter (Excel in many locales)", () => {
    const text = [HEADER.replaceAll(",", ";"), row(1).replaceAll(",", ";")].join("\n");
    expect(detectDelimiter(text)).toBe(";");
    expect(read(text).questions[0].options).toEqual(["One", "Two", "Three", "Four"]);
    expect(detectDelimiter(HEADER)).toBe(",");
  });

  it("reads quoted cells with commas, doubled quotes and line breaks inside", () => {
    const text = `${HEADER}\nS1,"Is it ""safe"", or not?\nThink.",A,B,,,A,"Yes, ""safe"".",,`;
    const q = read(text).questions[0];
    expect(q.text).toBe('Is it "safe", or not?\nThink.');
    expect(q.options).toEqual(["A", "B", "", ""]);
    expect(q.explanation).toBe('Yes, "safe".');
    expect(parseCsv('a;"b;c"\n').at(0)).toEqual(["a", "b;c"]);
  });

  it("accepts header variants: any case, spaces, and a different column order", () => {
    const text = ["Question , Option A,OPTION-B, Correct", "What?,Yes,No,a"].join("\n");
    const q = read(text).questions[0];
    expect(q).toMatchObject({ text: "What?", correct: "a" });
    expect(q.options).toEqual(["Yes", "No", "", ""]);
  });

  it("ignores empty lines and reads missing columns as empty", () => {
    const text = `${HEADER}\n\n${row(1)}\n\n,,,,,,,,,\n`;
    expect(read(text).questions).toHaveLength(1);
    const lean = read("question,correct\nWhat?,A").questions[0];
    expect(lean.explanation).toBe("");
    expect(lean.options).toEqual(["", "", "", ""]);
  });

  it("refuses a file without a question column, without rows, or empty", () => {
    expect(readCsv("a,b\n1,2", "s")).toEqual({
      ok: false,
      error: "No question column found. Use the CSV template.",
    });
    expect(readCsv(HEADER, "s")).toEqual({ ok: false, error: "No questions found in the file." });
    expect(readCsv("  \n ", "s")).toEqual({ ok: false, error: "The file is empty." });
    expect(readCsv("﻿", "s")).toEqual({ ok: false, error: "The file is empty." });
  });

  it("keeps at most 100 questions and says how many were dropped", () => {
    const text = [HEADER, ...Array.from({ length: 130 }, (_, i) => row(i + 1))].join("\n");
    const result = read(text);
    expect(result.questions).toHaveLength(100);
    expect(result.dropped).toBe(30);
    expect(result.questions.at(-1)!.id).toBe("set1-100");
  });

  it("keeps markup as plain text and never builds HTML", () => {
    const text = `${HEADER}\nS1,"<script>alert(1)</script>",<img src=x onerror=alert(1)>,B,,,A,"<b>why</b>",,`;
    const q = read(text).questions[0];
    expect(q.text).toBe("<script>alert(1)</script>");
    expect(q.options[0]).toBe("<img src=x onerror=alert(1)>");
    expect(q.explanation).toBe("<b>why</b>");
  });

  it("reads the shipped template: both rows are Ready", () => {
    const { questions } = read(readFileSync("public/templates/question-template.csv", "utf8"));
    expect(questions).toHaveLength(2);
    expect(questions.every((q) => problemsOf(q, questions).length === 0)).toBe(true);
    expect(readFileSync("public/templates/question-template.csv", "utf8").split("\n")[0]).toBe(
      HEADER,
    );
  });
});

describe("the flags", () => {
  const base: ImportedQuestion = {
    id: "s-1",
    text: "A question?",
    options: ["Yes", "No", "", ""],
    correct: "a",
    explanation: "Because.",
    guideRef: "",
    imageUrl: "",
  };
  const flag = (change: Partial<ImportedQuestion>, others: ImportedQuestion[] = []) => {
    const q = { ...base, ...change };
    return problemsOf(q, [...others, q]);
  };

  it("is Ready when everything is there", () => {
    expect(flag({})).toEqual([]);
  });

  it("flags no question text", () => expect(flag({ text: "  " })).toContain("No question text"));
  it("flags fewer than 2 options", () =>
    expect(flag({ options: ["Yes", "", "", ""] })).toContain("Fewer than 2 answers"));
  it("flags no correct answer and a letter with no option", () => {
    expect(flag({ correct: null })).toContain("No correct answer");
    expect(flag({ correct: "d" })).toContain("Correct answer D has no text");
  });
  it("flags a duplicate of an earlier question, not the first one", () => {
    const first = { ...base, id: "s-0", text: "  a   QUESTION? " };
    expect(flag({}, [first])).toContain("Duplicate of an earlier question");
    expect(problemsOf(first, [first, { ...base }])).not.toContain(
      "Duplicate of an earlier question",
    );
  });
  it("flags a long question and a long option", () => {
    expect(flag({ text: "x".repeat(301) })[0]).toBe("Question is longer than 300 characters");
    expect(flag({ text: "x".repeat(300) })).toEqual([]);
    expect(flag({ options: ["y".repeat(141), "No", "", ""] })).toContain(
      "An answer is longer than 140 characters",
    );
    expect(flag({ options: ["y".repeat(140), "No", "", ""] })).toEqual([]);
  });
  it("flags a missing explanation and an image without alt text", () => {
    expect(flag({ explanation: "" })).toEqual(["No explanation"]);
    expect(flag({ image: { data: "data:image/png;base64,AA", alt: " " } })).toEqual([
      "Image has no alt text",
    ]);
  });

  it("counts Ready and Needs attention and decides Publish", () => {
    const list = [base, { ...base, id: "s-2", text: "Other?", explanation: "" }];
    const counts = reviewCounts(list);
    expect(counts).toEqual({ ready: 1, attention: 1, total: 2 });
    expect(canPublish(counts)).toBe(false);
    expect(publishHint(counts)).toBe("Fix 1 question to publish");
    expect(publishHint({ ready: 0, attention: 3, total: 3 })).toBe("Fix 3 questions to publish");
    expect(canPublish(reviewCounts([base]))).toBe(true);
    expect(canPublish(reviewCounts([]))).toBe(false);
    expect(publishHint(reviewCounts([base]))).toBe("");
  });
});

describe("the file checks", () => {
  it("allows .csv, .xlsx, .docx and .pdf only", () => {
    for (const name of ["q.csv", "Q.DOCX", "q.xlsx", "q.PDF"]) {
      expect(checkFile({ name, size: 10 }), name).toBeNull();
    }
    for (const name of ["q.xls", "q.txt", "q", "q.csv.exe", "q.png"]) {
      expect(checkFile({ name, size: 10 }), name).toBe("Choose a CSV, Excel, Word or PDF file.");
    }
  });
  it("refuses an empty file; a CSV may be 1 MB, the other types 5 MB", () => {
    expect(checkFile({ name: "q.csv", size: 0 })).toBe("The file is empty.");
    expect(checkFile({ name: "q.csv", size: MAX_FILE_BYTES })).toBeNull();
    expect(checkFile({ name: "q.csv", size: MAX_FILE_BYTES + 1 })).toBe(
      "A CSV file may be up to 1 MB.",
    );
    for (const type of ["xlsx", "docx", "pdf"]) {
      expect(checkFile({ name: `q.${type}`, size: MAX_OTHER_BYTES })).toBeNull();
      expect(checkFile({ name: `q.${type}`, size: MAX_OTHER_BYTES + 1 })).toBe(
        "The file is larger than 5 MB.",
      );
    }
  });
  it("reads only a CSV for real", () => {
    expect(isRead("a.csv")).toBe(true);
    for (const name of ["a.xlsx", "a.docx", "a.pdf"]) expect(isRead(name)).toBe(false);
  });
  it("makes the title from the file name without its extension", () => {
    expect(titleFromFileName("evacuation routes.csv")).toBe("evacuation routes");
    expect(titleFromFileName("Set.v2.docx")).toBe("Set.v2");
    expect(titleFromFileName("noextension")).toBe("noextension");
    expect(titleFromFileName(".csv")).toBe(".csv");
    expect(titleFromFileName("x".repeat(200) + ".csv")).toHaveLength(120);
  });
  it("writes sizes in plain words", () => {
    expect(sizeText(120)).toBe("120 bytes");
    expect(sizeText(2048)).toBe("2 KB");
    expect(sizeText(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});

describe("the topic found in a CSV", () => {
  const csv = (...topics: string[]) =>
    ["topic,question", ...topics.map((topic, i) => `${topic},Question ${i}?`)].join("\n");
  it("is the most frequent valid topic of the topic column, the first winning a tie", () => {
    expect(detectTopic(csv("S3", "S3", "S1"))).toBe("S3");
    expect(detectTopic(csv("s2", "S10", "S10"))).toBe("S10");
    expect(detectTopic(csv("S1", "S2"))).toBe("S1");
    expect(detectTopic(csv("S3 Moving through smoke", "S3"))).toBe("S3");
  });
  it("is null without a topic column or without a valid topic", () => {
    expect(detectTopic("question\nWhat?")).toBeNull();
    expect(detectTopic(csv("", "S11", "X1", "Smoke"))).toBeNull();
    expect(detectTopic("")).toBeNull();
  });
  it("reads the shipped template: S1 is detected", () => {
    expect(detectTopic(readFileSync("public/templates/question-template.csv", "utf8"))).toBe("S1");
  });
});

describe("the sample for Word files", () => {
  it("has 20 questions, exactly 2 flagged: a missing explanation and a missing correct answer", () => {
    const questions = sampleQuestions("sample");
    expect(questions).toHaveLength(20);
    const flagged = questions.filter((q) => problemsOf(q, questions).length > 0);
    expect(flagged).toHaveLength(2);
    expect(flagged.flatMap((q) => problemsOf(q, questions)).sort()).toEqual([
      "No correct answer",
      "No explanation",
    ]);
    expect(new Set(questions.map((q) => q.id)).size).toBe(20);
  });
  it("stays educational: no weapons, harm or combat words", () => {
    const text = JSON.stringify(sampleQuestions("s")).toLowerCase();
    for (const word of ["weapon", "gun", "combat", "attack", "kill", "bomb"]) {
      expect(text).not.toContain(word);
    }
  });
});
