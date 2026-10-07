import { readFileSync } from "node:fs";
import { join } from "node:path";

export type GuideSection = {
  id: string;
  title: string;
};

export type Guide = {
  title: string;
  sections: GuideSection[];
};

export function loadGuide(): Guide {
  const markdown = readFileSync(
    join(process.cwd(), "content", "sample-evacuation-guide.md"),
    "utf8",
  );
  const title = markdown.match(/^# (.+)$/m)?.[1] ?? "Training guide";
  const sections = [...markdown.matchAll(/^## (S\d+)\. (.+)$/gm)].map((match) => ({
    id: match[1],
    title: match[2],
  }));
  return { title, sections };
}
