import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  blockingIssues,
  checkPackage,
  coverage,
  coverageLine,
  detectKind,
  imagesLabel,
  partsLine,
  partsOf,
  readPackage,
  usedByText,
} from "@/lib/package-read";
import type { PackageFile } from "@/lib/package-read";

const DIR = "public/templates/sample-package";
const file = (name: string): PackageFile => {
  const bytes = readFileSync(`${DIR}/${name}`);
  return name.endsWith(".png")
    ? { name, size: bytes.length, dataUrl: `data:image/png;base64,${bytes.toString("base64")}` }
    : { name, size: bytes.length, text: bytes.toString("utf8") };
};
const csv = (name: string, text: string): PackageFile => ({ name, size: text.length, text });
const files = (...names: string[]) => names.map(file);
const clean = () =>
  files(
    "topic.csv",
    "guide.csv",
    "steps.csv",
    "scenario.csv",
    "questions.csv",
    "exit-sign.png",
    "assembly-point.png",
  );
const reasons = (list: ReturnType<typeof checkPackage>) =>
  blockingIssues(list).map((i) => `${i.where}: ${i.reason}`);

describe("the sample package", () => {
  it("has the nine files and the pictures are small", () => {
    expect(readdirSync(DIR).sort()).toEqual([
      "assembly-point.png",
      "exit-sign.png",
      "guide.csv",
      "questions-with-problems.csv",
      "questions.csv",
      "scenario.csv",
      "steps-with-problems.csv",
      "steps.csv",
      "topic.csv",
    ]);
    for (const name of ["exit-sign.png", "assembly-point.png"]) {
      expect(readFileSync(`${DIR}/${name}`).length).toBeLessThan(60 * 1024);
    }
  });

  it("reads whole: the five clean files and the two pictures give no blocking issue", () => {
    const { data, recognised, messages } = readPackage(clean());
    expect(messages).toEqual([]);
    expect(recognised.map((r) => r.label)).toEqual([
      "Topic · Evacuating a crowded hall",
      "Guide · 4 sections",
      "Steps · 2 step guides, 7 steps",
      "Scenario · 4 steps",
      "Questions · 10 questions",
    ]);
    expect(data.title).toBe("Evacuating a crowded hall");
    expect(data.scenarioTitle).toBe("Alarm in a crowded hall");
    expect(imagesLabel(data)).toBe("Images · 2 of 2 found");
    expect(checkPackage(data)).toEqual([]);
    expect(partsOf(data)).toEqual(["guide", "steps", "scenario", "quiz"]);
    expect(partsLine(data)).toBe("Guide · Steps · Scenario · 10 questions");
  });

  it("covers every guide section: 4 of 4, with the number of items that use each", () => {
    const { data } = readPackage(clean());
    expect(coverageLine(data)).toBe("Guide sections used: 4 of 4");
    const { sections } = coverage(data);
    expect(sections.map((s) => [s.steps, s.scenario, s.questions])).toEqual([
      [1, 1, 3],
      [2, 1, 2],
      [1, 1, 2],
      [3, 1, 3],
    ]);
    expect(usedByText(sections[0])).toBe("Used by 1 step, 1 scenario step, 3 questions");
    expect(usedByText({ ...sections[0], steps: 0, scenario: 0, questions: 0, total: 0 })).toBe(
      "Not used by any item yet",
    );
  });

  it("flags exactly four problems in questions-with-problems.csv", () => {
    const { data } = readPackage(files("questions-with-problems.csv"));
    expect(reasons(checkPackage(data))).toEqual([
      "Q004: No correct answer",
      "Q005: No question text",
      "Q007: No explanation",
      "Q010: Image door-check.png was not selected",
    ]);
  });

  it("flags exactly two problems in steps-with-problems.csv when the guide is chosen with it", () => {
    const { data } = readPackage(
      files("guide.csv", "steps-with-problems.csv", "exit-sign.png", "assembly-point.png"),
    );
    expect(reasons(checkPackage(data))).toEqual([
      "When the alarm sounds, step 3: Guide section 7 does not exist",
      "At the assembly point, step 2: No action",
    ]);
  });

  it("does not flag a missing image once it is chosen too, and informs about an unused picture without blocking", () => {
    const withPicture: PackageFile = {
      name: "door-check.png",
      size: 100,
      dataUrl: "data:image/png;base64,AAAA",
    };
    const { data } = readPackage([...files("questions-with-problems.csv"), withPicture]);
    expect(reasons(checkPackage(data))).toHaveLength(3);
    const extra = readPackage([
      ...clean(),
      { name: "spare.png", size: 10, dataUrl: "data:image/png;base64,AA" },
    ]);
    const issues = checkPackage(extra.data);
    expect(blockingIssues(issues)).toEqual([]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      part: "images",
      blocking: false,
      reason: "Image spare.png is not used by any item",
    });
  });
});

describe("detecting the type of a CSV from its header", () => {
  it("tells the five types apart, whatever the case, spaces and order", () => {
    expect(detectKind(["topic_title", "topic_summary", "scenario_title"])).toBe("topic");
    expect(detectKind(["Section", "Title", "Text", "image_file", "alt_text"])).toBe("guide");
    expect(detectKind([" Checklist_Title ", "Step", "Action", "Detail", "Guide_Reference"])).toBe(
      "steps",
    );
    expect(detectKind(["step", "situation", "question", "option_a", "correct", "why"])).toBe(
      "scenario",
    );
    expect(detectKind(["question_id", "question", "option_a", "correct", "explanation"])).toBe(
      "questions",
    );
    expect(detectKind(["Checklist Title", "Step", "Action"])).toBe("steps");
    expect(detectKind(["a", "b"])).toBeNull();
  });

  it("uses the header, not the file name", () => {
    const { recognised } = readPackage([
      { ...file("guide.csv"), name: "my-notes.csv" },
      { ...file("questions.csv"), name: "steps.csv" },
    ]);
    expect(recognised.map((r) => r.part)).toEqual(["guide", "questions"]);
  });
});

describe("reading CSV text", () => {
  it("accepts a BOM, semicolons, quotes, doubled quotes and line breaks inside quotes, and ignores empty lines", () => {
    const text =
      '﻿section;title;text;image_file;alt_text\n\n1;"A; B";"Line one\nline ""two""";;\n\n2;Next;Plain;;\n';
    const { data, messages } = readPackage([csv("g.csv", text)]);
    expect(messages).toEqual([]);
    expect(data.guide).toEqual([
      { section: 1, title: "A; B", text: 'Line one\nline "two"', imageFile: "", alt: "" },
      { section: 2, title: "Next", text: "Plain", imageFile: "", alt: "" },
    ]);
  });

  it("reads at most 100 rows and says so", () => {
    const rows = Array.from({ length: 105 }, (_, i) => `${i + 1},T${i + 1},Text,,`).join("\n");
    const { data, messages } = readPackage([
      csv("g.csv", `section,title,text,image_file,alt_text\n${rows}`),
    ]);
    expect(data.guide).toHaveLength(100);
    expect(messages).toEqual(["g.csv: only the first 100 rows are read (5 rows left out)."]);
  });

  it("groups the rows of a checklist by its title", () => {
    const { data } = readPackage(files("steps.csv"));
    expect(data.steps!.map((l) => [l.title, l.steps.length])).toEqual([
      ["When the alarm sounds", 4],
      ["At the assembly point", 3],
    ]);
  });

  it("keeps script text as plain text, never as HTML", () => {
    const text =
      'section,title,text,image_file,alt_text\n1,<script>alert(1)</script>,"<img src=x onerror=alert(1)>",,\n';
    const { data } = readPackage([csv("g.csv", text)]);
    expect(data.guide![0].title).toBe("<script>alert(1)</script>");
    expect(data.guide![0].text).toBe("<img src=x onerror=alert(1)>");
    // no component of the package screens may inject HTML
    const sources = [
      "components/PackageContent/PackageParts.tsx",
      "components/InstructorContent/PackageTopicView.tsx",
      "components/InstructorContent/PackageImportView.tsx",
    ];
    for (const path of sources) {
      let code = "";
      try {
        code = readFileSync(path, "utf8");
      } catch {
        continue;
      }
      expect(code, path).not.toContain("dangerouslySetInnerHTML");
    }
  });
});

describe("files that cannot be used", () => {
  it("lists a wrong file type, an empty file, an unknown CSV and a second file of one type", () => {
    const { recognised, messages } = readPackage([
      { name: "notes.pdf", size: 10, text: "x" },
      { name: "a.csv", size: 0, text: "" },
      csv("b.csv", "foo,bar\n1,2\n"),
      file("guide.csv"),
      { ...file("guide.csv"), name: "guide-2.csv" },
    ]);
    expect(recognised.map((r) => r.part)).toEqual(["guide"]);
    expect(messages).toEqual([
      "notes.pdf is not a CSV file or a png, jpg or webp picture, so it was left out.",
      "a.csv is empty.",
      "b.csv: the first row does not match a topic, guide, steps, scenario or questions file.",
      "Two guide files were chosen. guide-2.csv was left out.",
    ]);
  });

  it("rejects a CSV over 1 MB", () => {
    const { messages } = readPackage([{ name: "big.csv", size: 1024 * 1024 + 1, text: "a" }]);
    expect(messages).toEqual(["big.csv is larger than 1 MB."]);
  });

  it("rejects a picture over 300 KB, more than 6 pictures and a package over 1.5 MB", () => {
    const big: PackageFile = {
      name: "big.png",
      size: MAX_IMAGE_BYTES + 1,
      dataUrl: "data:image/png;base64,A",
    };
    expect(readPackage([big]).messages).toEqual(["big.png is larger than 300 KB."]);
    const many = Array.from({ length: 7 }, (_, i) => ({
      name: `p${i}.png`,
      size: 100,
      dataUrl: "data:image/png;base64,A",
    }));
    const outcome = readPackage(many);
    expect(Object.keys(outcome.data.images)).toHaveLength(6);
    expect(outcome.messages).toEqual(["p6.png was left out: a package may hold 6 images at most."]);
    const heavy = Array.from({ length: 6 }, (_, i) => ({
      name: `h${i}.jpg`,
      size: 290 * 1024,
      dataUrl: "data:image/jpeg;base64,A",
    }));
    const budget = readPackage(heavy);
    expect(Object.keys(budget.data.images)).toHaveLength(5);
    expect(budget.messages).toEqual([
      "h5.jpg was left out: the package would be larger than 1.5 MB.",
    ]);
  });

  it("blocks an item that names a picture which was too big or is not a picture type", () => {
    const text =
      "question_id,question,option_a,option_b,option_c,option_d,correct,explanation,guide_reference,image_file,alt_text\nQ1,Why?,Yes,No,,,A,Because.,,big.png,Big\nQ2,Which?,A,B,,,A,Because.,,notes.pdf,Doc\n";
    const big: PackageFile = {
      name: "big.png",
      size: MAX_IMAGE_BYTES + 1,
      dataUrl: "data:image/png;base64,A",
    };
    const { data } = readPackage([csv("q.csv", text), big]);
    expect(reasons(checkPackage(data))).toEqual([
      "Q1: big.png is larger than 300 KB",
      "Q2: notes.pdf is not a png, jpg or webp picture",
    ]);
  });

  it("blocks a picture without alt text", () => {
    const text = "section,title,text,image_file,alt_text\n1,A,Text,exit-sign.png,\n";
    const { data } = readPackage([csv("g.csv", text), file("exit-sign.png")]);
    expect(reasons(checkPackage(data))).toEqual(["Section 1: Image exit-sign.png has no alt text"]);
  });
});

describe("the flags of each part", () => {
  const issuesOf = (...parts: PackageFile[]) => reasons(checkPackage(readPackage(parts).data));
  const header = {
    topic: "topic_title,topic_summary,scenario_title",
    guide: "section,title,text,image_file,alt_text",
    steps: "checklist_title,step,action,detail,guide_reference,image_file,alt_text",
    scenario:
      "step,situation,question,option_a,option_b,option_c,option_d,correct,why,guide_reference,image_file,alt_text",
    questions:
      "question_id,question,option_a,option_b,option_c,option_d,correct,explanation,guide_reference,image_file,alt_text",
  };

  it("topic: a missing title is left to the import form (the title is required there)", () => {
    const { data, recognised } = readPackage([
      csv(
        "t.csv",
        `${header.topic}
,Summary,Scenario
`,
      ),
    ]);
    expect(data.title).toBe("");
    expect(recognised[0].label).toBe("Topic · no title");
    expect(reasons(checkPackage(data))).toEqual([]);
  });

  it("guide: a missing title or text, text over 1200 characters, numbers not consecutive", () => {
    const text = `${header.guide}\n1,,Text,,\n3,Title,,,\n4,Long,${"x".repeat(1201)},,\n`;
    expect(issuesOf(csv("g.csv", text))).toEqual([
      "Section 1: No title",
      "Section 3: No text",
      "Section 4: Text is longer than 1200 characters",
      "Guide: Section numbers are not consecutive from 1",
    ]);
  });

  it("steps: numbers not consecutive, more than 10 steps, no action, a missing guide reference", () => {
    const many = Array.from({ length: 11 }, (_, i) => `Long,${i + 1},Do ${i + 1},,1,,`).join("\n");
    const text = `${header.steps}\nA,1,Do,,1,,\nA,3,Do,,1,,\nB,1,,,1,,\n${many}\n`;
    const guide = `${header.guide}\n1,Title,Text,,\n`;
    expect(issuesOf(csv("s.csv", text), csv("g.csv", guide))).toEqual([
      "A: Step numbers are not consecutive from 1",
      "B, step 1: No action",
      "Long: More than 10 steps",
    ]);
  });

  it("scenario: numbers, more than 10 steps, situation, question, options, correct letter, why", () => {
    const text = `${header.scenario}\n1,,,Only,,,,B,,1,,\n3,Sit,Q?,A,B,,,Z,Why,1,,\n4,Sit,Q?,A,B,,,C,Why,1,,\n`;
    const guide = `${header.guide}\n1,Title,Text,,\n`;
    expect(issuesOf(csv("sc.csv", text), csv("g.csv", guide))).toEqual([
      "Scenario: Step numbers are not consecutive from 1",
      "Scenario step 1: No situation",
      "Scenario step 1: No question",
      "Scenario step 1: Fewer than 2 answers",
      "Scenario step 1: Correct answer B has no text",
      "Scenario step 1: No explanation (why)",
      "Scenario step 3: No correct answer",
      "Scenario step 4: Correct answer C has no text",
    ]);
    const long = Array.from({ length: 11 }, (_, i) => `${i + 1},Sit,Q?,A,B,,,A,Why,1,,`).join("\n");
    expect(issuesOf(csv("sc.csv", `${header.scenario}\n${long}\n`))).toEqual([
      "Scenario: More than 10 steps",
    ]);
  });

  it("questions: a duplicate, over-long question and option, fewer than 2 options", () => {
    const text = `${header.questions}\nQ1,Same?,A,B,,,A,Because.,,,\nQ2,same ?,A,B,,,A,Because.,,,\nQ3,Same?,A,B,,,A,Because.,,,\nQ4,${"q".repeat(301)},A,B,,,A,Because.,,,\nQ5,Opt?,${"o".repeat(141)},B,,,A,Because.,,,\nQ6,One?,A,,,,A,Because.,,,\n`;
    expect(issuesOf(csv("q.csv", text))).toEqual([
      "Q3: Duplicate of an earlier question",
      "Q4: Question is longer than 300 characters",
      "Q5: An answer is longer than 140 characters",
      "Q6: Fewer than 2 answers",
    ]);
  });

  it("consistency: an item without a guide reference is 'Not linked to the guide' and blocks; no guide, no link checks", () => {
    const q = `${header.questions}\nQ1,Why?,A,B,,,A,Because.,,,\nQ2,What?,A,B,,,A,Because.,2,,\nQ3,Who?,A,B,,,A,Because.,9,,\n`;
    const guide = `${header.guide}\n1,One,Text,,\n2,Two,Text,,\n`;
    expect(issuesOf(csv("q.csv", q), csv("g.csv", guide))).toEqual([
      "Q1: Not linked to the guide",
      "Q3: Guide section 9 does not exist",
    ]);
    expect(issuesOf(csv("q.csv", q))).toEqual([]);
  });

  it("an unused guide section is informational and does not block", () => {
    const q = `${header.questions}\nQ1,Why?,A,B,,,A,Because.,1,,\n`;
    const guide = `${header.guide}\n1,One,Text,,\n2,Two,Text,,\n`;
    const issues = checkPackage(
      readPackage([csv("q.csv", q), csv("g.csv", guide), csv("t.csv", `${header.topic}\nT,,\n`)])
        .data,
    );
    expect(blockingIssues(issues)).toEqual([]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      blocking: false,
      reason: "Section 2 is not used by any item",
    });
  });

  it("any subset of the parts is a package (at least one part)", () => {
    expect(readPackage([]).recognised).toEqual([]);
    expect(partsOf(readPackage(files("guide.csv")).data)).toEqual(["guide"]);
    expect(partsOf(readPackage(files("steps.csv", "questions.csv")).data)).toEqual([
      "steps",
      "quiz",
    ]);
  });
});

describe("csvPart", () => {
  it("names the part of a CSV from its header and nothing for pictures", async () => {
    const { csvPart } = await import("./package-read");
    const text = readFileSync("public/templates/sample-package/steps.csv", "utf8");
    expect(csvPart({ name: "a.csv", size: text.length, text })).toBe("steps");
    expect(csvPart({ name: "a.png", size: 3, dataUrl: "data:" })).toBeNull();
  });
});
