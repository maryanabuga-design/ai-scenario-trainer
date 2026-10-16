import { readFileSync } from "node:fs";
import { join } from "node:path";

/** A `### Title` block inside a section: the extended guide text (for example the S1 demo extension). */
export type GuideSubsection = {
  title: string;
  lines: string[];
};

export type GuideSection = {
  id: string;
  title: string;
  /** The text under the `##` heading, before any `###` subsection. */
  lines: string[];
  /** The `###` subsections, in order; empty when the section has none. */
  subsections: GuideSubsection[];
  /** The raw markdown under the `##` heading (the heading itself is not part of it), for reading. */
  body: string;
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
      const lines: string[] = [];
      const subsections: GuideSubsection[] = [];
      for (const raw of rest) {
        const line = raw.trim();
        if (line.length === 0) continue;
        const sub = line.match(/^### (.+)$/);
        if (sub) {
          subsections.push({ title: sub[1], lines: [] });
          continue;
        }
        const text = line.replace(/^(- |\d+\. )/, "").replaceAll("**", "");
        (subsections.at(-1)?.lines ?? lines).push(text);
      }
      return {
        id: match?.[1] ?? heading,
        title: match?.[2] ?? heading,
        lines,
        subsections,
        body: rest.join("\n").trim(),
      };
    });
  return { title, sections };
}

export function loadGuide(): Guide {
  return readGuide("sample-evacuation-guide.md");
}

export type GuideId = "evacuation" | "flood";

/** Every guide of the content, in the order they are listed in Materials. */
export function loadGuides(): (Guide & { id: GuideId })[] {
  return [
    { id: "evacuation", ...loadGuide() },
    { id: "flood", ...loadFloodGuide() },
  ];
}

export function loadFloodGuide(): Guide {
  return readGuide("sample-flood-guide.md");
}

/** Every section of every sample guide, for the source sheet. Section ids do not overlap. */
export function loadAllSections(): GuideSection[] {
  return [...loadGuide().sections, ...loadFloodGuide().sections];
}
