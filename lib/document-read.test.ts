import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_BYTES,
  MESSAGES,
  analyse,
  checkDocument,
  checkFile,
  missingLine,
  readDocument,
} from "@/lib/document-read";
import type { PackageFile } from "@/lib/package-read";
import { readWorkbook } from "@/lib/xlsx-read";

const bytes = (path: string) => new Uint8Array(readFileSync(path));
const picture = (name: string): PackageFile => {
  const data = readFileSync(`public/templates/sample-package/${name}`);
  return { name, size: data.length, dataUrl: `data:image/png;base64,${data.toString("base64")}` };
};
const PICTURES = [picture("exit-sign.png"), picture("assembly-point.png")];
const FIX = "e2e/fixtures/";

describe("reading a workbook", () => {
  it("lists the sheets with their rows as plain text", () => {
    const sheets = readWorkbook(bytes("public/templates/sample-document.xlsx"))!;
    expect(sheets.map((s) => s.name)).toEqual(["Topic", "Guide", "Steps", "Scenario", "Questions"]);
    expect(sheets[0].rows[1][0]).toBe("Evacuating a crowded hall");
    expect(sheets[1].rows[0]).toEqual([
      "Section number",
      "Title",
      "Text",
      "Image file",
      "Image description",
    ]);
  });

  it("gives null for a file that is not a workbook, never throws", () => {
    expect(readWorkbook(bytes(`${FIX}not-excel.xlsx`))).toBeNull();
    expect(readWorkbook(new Uint8Array())).toBeNull();
  });
});

describe("the checks before analysing", () => {
  it("accepts only .xlsx up to 10 MB", () => {
    expect(checkFile("notes.docx", 100)).toBe(MESSAGES.type);
    expect(checkFile("data.csv", 100)).toBe(MESSAGES.type);
    expect(checkFile("a.xlsx", MAX_DOCUMENT_BYTES + 1)).toBe(MESSAGES.size);
    expect(checkFile("A.XLSX", 1000)).toBe("");
  });

  it("says when a workbook is empty or has no Guide sheet, and nothing for a good one", () => {
    expect(checkDocument(bytes(`${FIX}empty.xlsx`))).toBe(MESSAGES.empty);
    expect(checkDocument(bytes(`${FIX}no-guide.xlsx`))).toBe(MESSAGES.noGuide);
    expect(checkDocument(bytes(`${FIX}clean.xlsx`))).toBe("");
    expect(checkDocument(bytes(`${FIX}not-excel.xlsx`))).toBeNull();
  });

  it("the messages are the plain wording of the screen", () => {
    expect(MESSAGES.type).toBe("This file type is not supported. Use an Excel file (.xlsx).");
    expect(MESSAGES.size).toBe("This file is too large (max 10 MB).");
    expect(MESSAGES.empty).toBe("No content found in this file.");
    expect(MESSAGES.noGuide).toBe(
      "No Guide sheet found. Download the template to see the expected sheets.",
    );
  });
});

describe("analysing the sample document and the template", () => {
  it("finds the four parts of the sample with real counts and nothing to review", () => {
    const result = analyse(readDocument(bytes("public/templates/sample-document.xlsx"))!, PICTURES);
    expect(result.data.title).toBe("Evacuating a crowded hall");
    expect(result.counts).toEqual({ guide: 4, steps: 7, scenario: 4, questions: 10 });
    expect(result.missing).toEqual([]);
    expect(result.toReview).toBe(0);
  });

  it("without the pictures the sample names pictures that were not selected", () => {
    const result = analyse(readDocument(bytes("public/templates/sample-document.xlsx"))!, []);
    expect(result.toReview).toBeGreaterThan(0);
  });

  it("the template reads: the grey instruction row is skipped and the example row is a row", () => {
    const read = readDocument(bytes("public/templates/guide-template.xlsx"))!;
    const result = analyse(read, []);
    expect(result.counts).toEqual({ guide: 1, steps: 1, scenario: 1, questions: 1 });
    expect(result.data.guide![0].title).toBe("Know your exits");
  });

  it("reports the parts that are missing, and the problems of a document with problems", () => {
    const partial = analyse(readDocument(bytes(`${FIX}no-questions.xlsx`))!, PICTURES);
    expect(partial.missing).toEqual(["questions"]);
    expect(missingLine(partial.missing)).toBe("We could not find questions in this document.");
    const problems = analyse(readDocument(bytes(`${FIX}problems.xlsx`))!, PICTURES);
    expect(problems.missing).toEqual(["scenario"]);
    expect(problems.toReview).toBe(6);
    expect(problems.linkProblems).toBeGreaterThan(0);
  });

  it("says the missing parts in a list", () => {
    expect(missingLine(["steps", "scenario"])).toBe(
      "We could not find steps or a scenario in this document.",
    );
    expect(missingLine(["steps", "scenario", "questions"])).toBe(
      "We could not find steps, a scenario or questions in this document.",
    );
  });

  it("reads text as plain text: markup stays markup", () => {
    const sheets = readWorkbook(bytes("public/templates/sample-document.xlsx"))!;
    expect(JSON.stringify(sheets)).not.toContain("<script");
  });
});
