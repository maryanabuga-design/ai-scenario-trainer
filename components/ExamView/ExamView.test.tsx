import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExamView } from "@/components/ExamView/ExamView";
import { EXAM_MINUTES, EXAM_QUESTIONS, PASS_MARK } from "@/lib/config";
import { deadlineText } from "@/lib/exam-deadline";

const now = new Date(2026, 9, 19, 10, 0);
const attempt = (correct: number, day: number) => ({
  correct,
  questions: 20,
  finishedAt: new Date(2026, 9, day).getTime(),
});

const render = (props: Partial<Parameters<typeof ExamView>[0]> = {}) =>
  renderToStaticMarkup(
    <ExamView
      title="Evacuation basics exam"
      assignedBy="Instructor"
      deadline={deadlineText("2026-10-25", now)}
      readiness={0}
      canRepeat
      last={null}
      best={null}
      onStart={() => undefined}
      onRepeat={() => undefined}
      {...props}
    />,
  );

describe("the exam screen", () => {
  it("has the band with Back to Home, the exam title and 'Assigned by Instructor · Due 25 Oct'", () => {
    const html = render();
    expect(html).toContain("data-page-header-band");
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain(">Evacuation basics exam</h1>");
    expect(html.replace(/<[^>]+>/g, "")).toContain("Assigned by Instructor · Due 25 Oct");
    // not overdue: no clock in the subtitle
    expect(html.slice(0, html.indexOf("<section"))).not.toContain("lucide-clock");
  });

  it("shows a clock and 'Overdue since' in the subtitle when the deadline has passed, in plain text", () => {
    const html = render({ deadline: deadlineText("2026-10-15", now) });
    const band = html.slice(0, html.indexOf("<section"));
    expect(band.replace(/<[^>]+>/g, "")).toContain("Overdue since 15 Oct");
    expect(band).toContain("lucide-clock");
    // never red
    expect(html).not.toMatch(/text-wrong|bg-wrong|rose/);
  });

  it("shows the Not ready yet card below the pass mark, with the readiness, the pass mark and the bar", () => {
    const html = render({ readiness: 62 });
    const card = html.slice(html.indexOf('aria-label="Readiness"'), html.indexOf(">How it works<"));
    expect(card).toContain(">Not ready yet<");
    expect(card).toContain("Your readiness is 62%. The pass mark is 80%.");
    expect(card).toContain('role="progressbar"');
    expect(card).toContain('aria-valuenow="62"');
    expect(card).not.toContain("You&#x27;re ready");
  });

  it("is a white card of the same family as the other two cards, with no sand and no red", () => {
    const html = render({ readiness: 10 });
    const card = html.slice(html.indexOf('aria-label="Readiness"'), html.indexOf(">How it works<"));
    expect(card).toContain("rounded-card bg-card p-4 shadow-(--card-shadow)");
    expect(card).not.toMatch(/secondary-sand|border-selectable-stroke/);
    // the same card class as "How it works" and "Your results"
    const classes = html.match(
      /class="(rounded-card bg-card p-4 shadow-\(--card-shadow\)[^"]*)"/g,
    )!;
    expect(classes).toHaveLength(3);
    expect(card).not.toMatch(/wrong|rose|red-/);
    expect(html).not.toMatch(/text-wrong|bg-wrong|border-wrong/);
  });

  it("not ready: a muted sand-gold 44px rounded-square tile with the info icon", () => {
    const html = render({ readiness: 30 });
    const card = html.slice(html.indexOf('aria-label="Readiness"'), html.indexOf(">How it works<"));
    expect(card).toContain("bg-status-attention-bg text-status-attention-ink");
    expect(card).toContain("h-11 w-11 rounded-[12px]");
    expect(card).toContain("lucide-info");
    expect(card).not.toContain("lucide-circle-check");
    expect(card).not.toContain("status-success");
    expect(card).not.toContain("correct");
  });

  it("ready: a muted sage tile (its own status tokens, not the answer green) with a check-circle icon", () => {
    const html = render({ readiness: 84 });
    const card = html.slice(html.indexOf('aria-label="Readiness"'), html.indexOf(">How it works<"));
    expect(card).toContain("bg-status-success-bg text-status-success-ink");
    expect(card).not.toContain("correct");
    expect(card).toContain("h-11 w-11 rounded-[12px]");
    expect(card).toContain("lucide-circle-check");
    expect(card).not.toContain("lucide-info");
    expect(card).not.toContain("status-attention");
  });

  it("keeps the status in words too: the title and the sentence change with the state", () => {
    expect(render({ readiness: 30 })).toContain("Your readiness is 30%. The pass mark is 80%.");
    expect(render({ readiness: 84 })).toContain("Your readiness is 84%.");
  });

  it("is a full-height column with the buttons at its end: margin-top auto, no panel, no border, no shadow", () => {
    const html = render({ readiness: 30 });
    expect(html).toContain("flex flex-1 flex-col gap-4 pb-[var(--gutter,1rem)]");
    const buttons = html.slice(html.lastIndexOf('<div class="mt-auto'));
    expect(buttons.slice(0, buttons.indexOf(">") + 1)).toBe(
      '<div class="mt-auto flex flex-col gap-3 pt-2">',
    );
    expect(buttons.slice(0, buttons.indexOf("<button"))).not.toMatch(/bg-|border|shadow/);
  });

  it("warns at 79 and not at 80", () => {
    expect(render({ readiness: 79 })).toContain(">Not ready yet<");
    const ready = render({ readiness: 80 });
    expect(ready).toContain("You&#x27;re ready");
    expect(ready).toContain("Your readiness is 80%.");
    expect(ready).not.toContain("Not ready yet");
    expect(ready).not.toContain("The pass mark is");
  });

  it("below the pass mark: Primary Repeat weak topics, then Secondary Start exam anyway, no card button", () => {
    const html = render({ readiness: 40 });
    const buttons = html.slice(html.indexOf("</section>"));
    expect(html.match(/Repeat weak topics/g)).toHaveLength(1);
    expect(buttons.indexOf(">Repeat weak topics<")).toBeLessThan(
      buttons.indexOf(">Start exam anyway<"),
    );
    const repeat = html.slice(0, html.indexOf(">Repeat weak topics<"));
    expect(repeat.slice(repeat.lastIndexOf("<button"))).toContain("bg-primary");
    const anyway = html.slice(0, html.indexOf(">Start exam anyway<"));
    expect(anyway.slice(anyway.lastIndexOf("<button"))).toContain("bg-olive-tint");
    expect(html).not.toContain(">Start exam<");
  });

  it("at the pass mark or more: only the Primary Start exam", () => {
    const html = render({ readiness: 90 });
    expect(html).toContain(">Start exam<");
    expect(html).not.toMatch(/Repeat weak topics|Start exam anyway/);
  });

  it("hides Repeat weak topics when there is nothing to repeat, and still allows the exam", () => {
    const html = render({ readiness: 0, canRepeat: false });
    expect(html).not.toMatch(/Repeat weak topics|Start exam anyway/);
    expect(html).toContain(">Start exam<");
  });

  it("lists the rules, read from the constants, with no hints or feedback", () => {
    const html = render();
    expect(html).toContain(">How it works<");
    expect(html).toContain(`${EXAM_QUESTIONS} questions from all topics`);
    expect(html).toContain(`${EXAM_MINUTES} minutes`);
    expect(html).toContain("No hints or feedback during the exam");
    expect(html).toContain(`Pass mark ${PASS_MARK}%`);
    expect(html.match(/h-9 w-9/g)).toHaveLength(4);
    // the four rules sit in neutral warm grey circles, not the olive tile
    const rules = html.slice(html.indexOf(">How it works<"), html.indexOf(">Your results<"));
    expect(rules.match(/bg-neutral-tile-bg text-neutral-tile-ink/g)).toHaveLength(4);
    expect(rules.match(/rounded-full/g)).toHaveLength(4);
  });

  it("shows the last and best attempt as counts, never as a percentage", () => {
    const none = render();
    expect(none).toContain("You have not taken the exam yet");
    const after = render({ last: attempt(14, 14), best: attempt(17, 12) });
    expect(after).toContain("14 of 20");
    expect(after).toContain("14 Oct");
    expect(after).toContain("17 of 20");
    expect(after).toContain("12 Oct");
    expect(after.replace(/<[^>]+>/g, "")).not.toMatch(/\d%\s*·/);
  });

  it("has the buttons in the page flow, not in a sticky panel", () => {
    const html = render({ readiness: 50 });
    expect(html).not.toMatch(/sticky|fixed|ActionBar/);
  });
});
