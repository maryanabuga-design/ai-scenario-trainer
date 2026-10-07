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

/** Reads the sample guide on the server. Sections start with "## S1. Title" and hold "- " bullet lines. */
export function loadGuide(): Guide {
  const markdown = readFileSync(join(process.cwd(), "content", "sample-evacuation-guide.md"), "utf8");
  const title = markdown.match(/^# (.+)$/m)?.[1] ?? "Training guide";
  const sections = markdown
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [heading, ...rest] = block.split("\n");
      const match = heading.match(/^(S\d+)\. (.+)$/);
      return {
        id: match?.[1] ?? heading,
        title: match?.[2] ?? heading,
        lines: rest.filter((line) => line.startsWith("- ")).map((line) => line.slice(2)),
      };
    });
  return { title, sections };
}
