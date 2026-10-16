import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { MiniQuizView } from "@/components/MiniQuizView/MiniQuizView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { amountOptions, fitAmount, miniQuizPool, miniQuizSections } from "@/lib/mini-quiz";

const noop = () => undefined;
const titles = loadAllSections();

function render(selected: string[] = miniQuizSections, chosen: number | null = null) {
  const pool = miniQuizPool(selected).length;
  return renderToStaticMarkup(
    <SourceSheetProvider sections={titles}>
      <ActionBarProvider>
        <MiniQuizView
          backHref="/training?mode=quiz"
          backLabel="Back to Training"
          topics={miniQuizSections.map((id) => ({
            id,
            title: titles.find((section) => section.id === id)?.title ?? id,
            detail: `${miniQuizPool([id]).length} questions`,
          }))}
          selected={selected}
          onSelectedChange={noop}
          pool={pool}
          amount={fitAmount(chosen, pool)}
          onAmountChange={noop}
          onStart={noop}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

describe("the Mini-quiz screen", () => {
  const html = render();

  it("has the Back circle, the title and the muted subtitle", () => {
    expect(html).toContain('aria-label="Back to Training"');
    expect(html).toContain('href="/training?mode=quiz"');
    expect(html).toContain(">Mini-quiz</h1>");
    expect(html).toContain("Pick topics and how many questions");
    expect(html.indexOf('aria-label="Back to Training"')).toBeLessThan(html.indexOf(">Mini-quiz<"));
  });

  it("goes Topics card, Questions card, the availability line", () => {
    const order = [">Topics<", ">Questions<", "questions available in your selected topics"].map(
      (text) => html.indexOf(text),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html.match(/rounded-card bg-card p-4 shadow/g)).toHaveLength(2);
  });
});

describe("the Topics card", () => {
  it("has a row per guide section with its number circle, title, question count and check box", () => {
    const html = render();
    expect(html.match(/type="checkbox"/g)).toHaveLength(10);
    for (const id of miniQuizSections) expect(html).toContain(`>${id}</span>`);
    expect(html).toContain("bg-olive-tint");
    expect(html).toMatch(/\d+ questions/);
    expect(html).toContain(titles.find((section) => section.id === "S3")!.title);
  });

  it("selects every topic by default", () => {
    const html = render();
    const boxes = html.match(/<input type="checkbox"[^>]*>/g) ?? [];
    expect(boxes).toHaveLength(10);
    boxes.forEach((box) => expect(box).toContain('checked=""'));
    expect(html).toContain(">Deselect all<");
  });

  it("offers Select all when something is not selected, and Deselect all when everything is", () => {
    expect(render(["S1"])).toContain(">Select all<");
    expect(render([])).toContain(">Select all<");
    expect(render()).toContain(">Deselect all<");
  });
});

describe("the Questions card", () => {
  it("offers 5, 10 and 15 for all topics, 15 chosen by default, in one row of radios", () => {
    const html = render();
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    for (const label of [">5<", ">10<", ">15<"]) expect(html).toContain(label);
    expect(html).toContain("flex gap-2");
    const radios = html.match(/<input type="radio"[^>]*>/g) ?? [];
    const checked = radios.filter((radio) => radio.includes('checked=""'));
    expect(checked).toHaveLength(1);
    expect(checked[0]).toContain('value="15"');
  });

  it("shows only the amounts the pool allows, and All N below 5", () => {
    for (const sections of [["S1", "S2"], ["S1"], ["S3"], ["S1", "S2", "S3"]]) {
      const html = render(sections);
      const size = miniQuizPool(sections).length;
      const expected = amountOptions(size);
      expect(html.match(/type="radio"/g)).toHaveLength(expected.length);
      for (const option of expected) expect(html).toContain(`>${option.label}<`);
      expect(html).toContain(`${size} questions available in your selected topics`);
    }
  });

  it("recomputes the choice when the topics change: it stays while offered, else the largest", () => {
    const three = miniQuizPool(["S1", "S2", "S3"]).length;
    expect(fitAmount(10, three)).toBe(three >= 10 ? 10 : 5);
    expect(fitAmount(10, 7)).toBe(5);
    const radios = render(["S1", "S2", "S3"], 5).match(/<input type="radio"[^>]*>/g) ?? [];
    expect(radios.find((radio) => radio.includes('checked=""'))).toContain('value="5"');
  });

  it("shows no amounts and the hint when no topic is selected", () => {
    const html = render([]);
    expect(html).not.toContain('type="radio"');
    expect(html).toContain("Select at least one topic");
    expect(html).toContain("0 questions available in your selected topics");
  });
});

describe("Start mini-quiz and the random order", () => {
  it("is a sticky primary button, disabled without a topic, with the muted hint", () => {
    const source = readFileSync("components/MiniQuizView/MiniQuizView.tsx", "utf8");
    expect(source).toContain("Start mini-quiz");
    expect(source).toContain("disabled={none || amount === null}");
    expect(source).toContain("<ActionBar>");
  });

  it("has no shuffle control", () => {
    expect(render()).not.toMatch(/Shuffle|role="switch"/i);
  });

  it("starts a session with no part, back to where it was opened from", () => {
    const page = readFileSync("app/(app)/mini-quiz/page.tsx", "utf8");
    expect(page).toContain("drawMiniQuiz(selected, amount)");
    expect(page).toContain("returnTo: from.href");
    expect(page).not.toContain("partId");
    expect(page).toContain('"/training?mode=quiz"');
    expect(page).toContain('from === "home"');
  });
});
