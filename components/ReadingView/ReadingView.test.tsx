import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/ReadingView/ReadingView.tsx", "utf8");
const page = readFileSync("app/(app)/materials/read/[topic]/page.tsx", "utf8");

describe("the reading screen", () => {
  it("has the 40px Back, the title, one meta line with the guide, the topic id and the reading time", () => {
    expect(source).toContain('size="small"');
    expect(source).toContain("router.back()");
    expect(source).toContain('router.push("/materials")');
    expect(source).toContain("{topic.guideTitle} · {topic.id} · {readingLabel(topic.minutes)}");
    expect(source).toContain('<h1 className="type-page-title">{topic.title}</h1>');
  });

  it("ends with Practise (primary), Steps (secondary) and Next (tertiary), each hidden when it does not apply, and nothing sticky", () => {
    expect(source).toMatch(
      /\{topic\.practiseHref && \(\s*<ButtonLink href=\{topic\.practiseHref\}>/,
    );
    expect(source).toContain("{topic.stepsHref && (");
    expect(source).toContain('variant="secondary"');
    expect(source).toContain("{topic.next && (");
    expect(source).toContain('variant="tertiary"');
    expect(source).toContain("Practise this topic");
    expect(source).toContain("Steps for this topic");
    expect(source).toContain("Next: {topic.next.title}");
    expect(source).not.toMatch(/ActionBar|className="[^"]*(sticky|fixed)/);
  });

  it("changes no progress: it reads the guide only", () => {
    expect(source).not.toMatch(/saveSession|startSession|finishSession|ast\./);
    expect(page).not.toMatch(/saveSession|startSession|finishSession/);
  });

  it("is built from the guide on the server, with a 404 for an unknown topic", () => {
    expect(page).toContain("notFound()");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("topic.section.body");
  });
});
