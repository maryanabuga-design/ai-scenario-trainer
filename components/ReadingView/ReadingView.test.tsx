import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const raw = readFileSync("components/ReadingView/ReadingView.tsx", "utf8");
// the same code on one line, so the checks do not depend on how it is wrapped
const source = raw.replace(/\s+/g, " ");
// the code without its comments
const code = source.replace(/\/\*\*.*?\*\//g, "");
const page = readFileSync("app/(app)/materials/read/[topic]/page.tsx", "utf8");

describe("the reading screen", () => {
  it("has the 40px Back, the title, one meta line with the guide, the topic id and the reading time", () => {
    expect(source).toContain('size="small"');
    expect(source).toContain("router.back()");
    expect(source).toContain('router.push("/materials")');
    expect(source).toContain("{topic.guideTitle} · {topic.id} · {readingLabel(topic.minutes)}");
    expect(source).toContain('<h1 className="type-page-title">{topic.title}</h1>');
  });

  it("ends with the action block: Practise (primary button), Steps (secondary), each hidden when it does not apply, then the pager", () => {
    expect(source).toContain(
      "{topic.canPractise && <Button onClick={practise}>Practise this topic</Button>}",
    );
    expect(source).toContain("{topic.stepsHref && (");
    expect(source).toContain('variant="secondary"');
    expect(source).toContain("Steps for this topic");
    expect(source).toContain("<TopicPager previous={topic.previous} next={topic.next} />");
    // the old stacked block and the "Next: ..." link are gone
    expect(source).not.toContain("Next: {topic.next.title}");
    expect(source).not.toContain('variant="tertiary"');
  });

  it("is a sticky-footer column: the block is pushed to the end, with no fixed or sticky panel", () => {
    expect(source).toContain('className="flex flex-1 flex-col pb-6"');
    expect(source).toContain('className="mt-auto flex flex-col pt-6"');
    expect(code).not.toMatch(/ActionBar|\b(sticky|fixed)\b|shadow|bg-/);
  });

  it("Practise starts or resumes a part session that returns to this reading screen", () => {
    expect(source).toContain("practicePlan(topic.id, records, unfinished)");
    expect(source).toContain("const returnTo = readingPath(topic.id)");
    expect(source).toContain("saveSession({ ...unfinished, returnTo })");
    expect(source).toContain('router.push("/session")');
    // it never opens the Training topic list
    expect(source).not.toContain("/training");
  });

  it("only a tap on Practise changes progress: reading does not", () => {
    expect(source).not.toMatch(/finishSession|ast\./);
    expect(page).not.toMatch(/saveSession|startSession|finishSession/);
  });

  it("is built from the guide on the server, with a 404 for an unknown topic", () => {
    expect(page).toContain("notFound()");
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("topic.section.body");
  });
});
