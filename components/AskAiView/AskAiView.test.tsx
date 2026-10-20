import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { AskAiThread } from "@/components/AskAiThread/AskAiThread";
import { AskAiView } from "@/components/AskAiView/AskAiView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { answerTo, followUp, userMessage } from "@/lib/ask-ai";
import type { Thread } from "@/lib/ask-ai";
import { loadAllSections } from "@/lib/guide";

const now = new Date(2026, 9, 23, 12, 0).getTime();
const thread: Thread = {
  id: "t1",
  title: "How do I move through smoke?",
  subtitle: "S3 · Moving through smoke",
  createdAt: now - 5 * 60_000,
  updatedAt: now - 5 * 60_000,
  messages: [
    { id: "u1", role: "user", text: "How do I move through smoke?", sources: [] },
    { ...answerTo("smoke", now), id: "a1" },
  ],
};

const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>{node}</ActionBarProvider>
    </SourceSheetProvider>,
  );

const view = (threads: Thread[]) =>
  wrap(
    <AskAiView
      threads={threads}
      now={now}
      onSend={() => undefined}
      onSuggested={() => undefined}
      confirming={false}
      onAskClear={() => undefined}
      onCancelClear={() => undefined}
      onClear={() => undefined}
      dialogInline
    />,
  );

describe("the Ask AI tab", () => {
  it("has the header band with the avatar and no Back, the empty text and 4 suggested rows", () => {
    const html = view([]);
    expect(html).toContain("data-page-header-band");
    expect(html).toContain(">Ask AI</h1>");
    expect(html).toContain("data-avatar");
    expect(html).toContain("Ask about any topic in the guides");
    expect(html.match(/data-suggested=/g)).toHaveLength(4);
    expect(html.match(/h-14 w-full/g)).toHaveLength(4);
    expect(html).not.toContain("Clear history");
    expect(html).not.toContain("Back to");
  });

  it("lists the history in the given order with 72px rows: title, muted line, time, chevron", () => {
    const older = { ...thread, id: "t0", title: "Older", updatedAt: now - 3 * 86_400_000 };
    const html = view([thread, older]);
    expect(html.indexOf('data-thread="t1"')).toBeLessThan(html.indexOf('data-thread="t0"'));
    expect(html.match(/h-\[72px\]/g)).toHaveLength(2);
    expect(html).toContain("5 min ago");
    expect(html).toContain("20 Oct");
    expect(html).toContain("S3 · Moving through smoke");
    expect(html).not.toContain("Ask about any topic in the guides");
  });

  it("ends the list with a Secondary Clear history, and the dialog has a Primary and a Secondary", () => {
    const html = view([thread]);
    expect(html.indexOf("History")).toBeLessThan(html.indexOf("Clear history"));
    const clear = html.slice(0, html.indexOf(">Clear history<"));
    expect(clear.slice(clear.lastIndexOf("<button"))).toContain("bg-olive-tint");
    expect(html).not.toContain("type-action");
  });
});

describe("a thread", () => {
  const render = (t: Thread, typing = false) =>
    wrap(
      <AskAiThread
        thread={t}
        typing={typing}
        onSend={() => undefined}
        onAction={() => undefined}
        onSuggested={() => undefined}
      />,
    );

  it("shows the person's message on the right in an olive-tint bubble, the AI's in a white bordered card", () => {
    const html = render(thread);
    expect(html).toMatch(/data-message="user" class="[^"]*self-end[^"]*bg-olive-tint/);
    expect(html).toMatch(/border border-border bg-card/);
    expect(html).toContain("Back to Ask AI");
  });

  it("puts the disclaimer under EVERY AI message and 1 to 3 source pills on an answer", () => {
    const more = {
      ...thread,
      messages: [
        ...thread.messages,
        userMessage("Give an example", followUp("example", "S3", now), now),
        followUp("example", "S3", now),
      ],
    };
    const html = render(more);
    expect(html.match(/data-message="ai"/g)).toHaveLength(2);
    expect(html.match(/data-disclaimer/g)).toHaveLength(2);
    expect(
      html.match(/Prototype answer: a prepared example, not a live AI\. It may be inaccurate\./g),
    ).toHaveLength(2);
    expect(html).toContain('data-source-pill="S3"');
    expect(html).toContain('href="/materials/read/S3"');
  });

  it("offers the three quick actions under the latest AI answer only, and not while typing", () => {
    const html = render(thread);
    for (const label of ["Give an example", "Explain simply", "Show the guide"]) {
      expect(html).toContain(`>${label}<`);
    }
    expect(render(thread, true)).not.toContain("data-quick-actions");
    expect(render(thread, true)).toContain("data-typing");
    // after the person asks again, the actions wait for the new answer
    const asked = {
      ...thread,
      messages: [...thread.messages, userMessage("x", answerTo("x", now), now)],
    };
    expect(render(asked)).not.toContain("data-quick-actions");
  });

  it("offers 3 suggestions after a fallback reply, and no quick actions", () => {
    const fallback = {
      ...thread,
      messages: [thread.messages[0], { ...answerTo("zzz", now), id: "f" }],
    };
    const html = render(fallback);
    expect(html).toContain("I do not have a prepared answer for this. Try one of these:");
    expect(html.match(/bg-olive-tint text-primary/g)?.length).toBe(3);
    expect(html).not.toContain("data-quick-actions");
  });

  it("the typing dots stand still under reduced motion", () => {
    expect(render(thread, true)).toContain("motion-reduce:animate-none");
  });
});
