import { readFileSync } from "node:fs";
import { join } from "node:path";

export type GuideSection = {
  id: string;
  title: string;
  lines: string[];
};

export type Guide = {
  title: string;
  sections: GuideSection[];
};

/**
 * Reads one sample guide on the server. Sections start with "## S1. Title" (or F1 and so on) and
 * hold bullet lines, numbered lines or paragraphs; each becomes one line, without Markdown marks.
 */
function readGuide(file: string): Guide {
  const markdown = readFileSync(join(process.cwd(), "content", file), "utf8");
  const title = markdown.match(/^# (.+)$/m)?.[1] ?? "Training guide";
  const sections = markdown
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [heading, ...rest] = block.split("\n");
      const match = heading.match(/^([A-Z]\d+)\. (.+)$/);
      return {
        id: match?.[1] ?? heading,
        title: match?.[2] ?? heading,
        lines: rest
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => line.replace(/^(- |\d+\. )/, "").replaceAll("**", "")),
      };
    });
  return { title, sections };
}

export function loadGuide(): Guide {
  return readGuide("sample-evacuation-guide.md");
}

export function loadFloodGuide(): Guide {
  return readGuide("sample-flood-guide.md");
}

/** Every section of every sample guide, for the source sheet. Section ids do not overlap. */
export function loadAllSections(): GuideSection[] {
  return [...loadGuide().sections, ...loadFloodGuide().sections];
}
