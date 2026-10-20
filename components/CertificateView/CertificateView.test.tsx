import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CertificateView } from "@/components/CertificateView/CertificateView";
import { CertificatesList } from "@/components/CertificatesList/CertificatesList";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import type { Certificate } from "@/lib/certificates";
import { scoreItem } from "@/lib/scoring";
import { getItem } from "@/lib/items";
import { modeItems } from "@/lib/parts";
import { readFileSync } from "node:fs";

const certificate: Certificate = {
  id: "QT-2026-0042",
  accountId: "ana@example.com",
  examTitle: "Evacuation basics exam",
  date: new Date(2026, 9, 23, 12, 0).getTime(),
  correct: 17,
  total: 20,
  passMark: 80,
  attemptAt: 1,
};

const view = () =>
  renderToStaticMarkup(
    <CertificateView certificate={certificate} name="Ana Test" onBack={() => undefined} />,
  );

describe("the certificate screen", () => {
  const html = view();

  it("has the band with Back and ONE light card with the name, the exam and the three facts", () => {
    expect(html).toContain("data-page-header-band");
    expect(html).toContain('aria-label="Back"');
    expect(html.match(/data-certificate=/g)).toHaveLength(1);
    expect(html).toContain("rounded-card border border-sand-200 bg-sand-50 p-8");
    for (const text of [
      "Training completion certificate",
      ">Ana Test<",
      ">has passed<",
      ">Evacuation basics exam<",
      "23 Oct 2026",
      "17 of 20 correct",
      "QT-2026-0042",
      "Prototype certificate, not an official document.",
    ]) {
      expect(html, text).toContain(text);
    }
    const order = [
      "Training completion certificate",
      "Ana Test",
      "has passed",
      "Evacuation basics exam",
      "17 of 20 correct",
      "Prototype certificate",
    ].map((t) => html.indexOf(t, html.indexOf("data-certificate=")));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("has a Primary Save as PDF and a Secondary Share under the card, outside the printed part", () => {
    const save = html.slice(0, html.indexOf(">Save as PDF<"));
    expect(save.slice(save.lastIndexOf("<button"))).toContain("bg-primary");
    const share = html.slice(0, html.indexOf(">Share<"));
    expect(share.slice(share.lastIndexOf("<button"))).toContain("bg-olive-tint");
    expect(html.indexOf(">Save as PDF<")).toBeGreaterThan(html.indexOf("</article>"));
    expect(html.match(/data-print-hide/g)).toHaveLength(2);
  });

  it("has a print style for A4 that shows only the card", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const print = css.slice(css.indexOf("@media print"));
    expect(print).toContain("size: A4");
    expect(print).toContain("body * {\n    visibility: hidden;");
    expect(print).toContain("[data-certificate]");
    expect(print).toContain("[data-print-hide] {\n    display: none !important;");
  });
});

describe("the certificate list", () => {
  it("has rows of a fixed 72px with the title, the date and a chevron, or the empty text", () => {
    const html = renderToStaticMarkup(
      <CertificatesList certificates={[certificate]} onBack={() => undefined} />,
    );
    expect(html).toContain("h-[72px]");
    expect(html).toContain('href="/profile/certificates/QT-2026-0042"');
    expect(html).toContain("Evacuation basics exam");
    expect(html).toContain("23 Oct 2026");
    expect(html).toContain("lucide-chevron-right");
    const empty = renderToStaticMarkup(
      <CertificatesList certificates={[]} onBack={() => undefined} />,
    );
    expect(empty).toContain("Pass an exam to earn a certificate.");
    expect(empty).not.toContain("h-[72px]");
  });
});

describe("the Results card", () => {
  const pool = modeItems("quiz").slice(0, 5);
  const items = (right: number) =>
    pool.map((q, i) =>
      scoreItem(
        getItem(q.id),
        i < right ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id,
      ),
    );
  const render = (right: number, href?: string) =>
    renderToStaticMarkup(
      <SourceSheetProvider sections={loadAllSections()}>
        <ActionBarProvider>
          <ResultsView
            kind="exam"
            items={items(right)}
            topics={[]}
            onRepeat={() => undefined}
            certificateHref={href}
          />
        </ActionBarProvider>
      </SourceSheetProvider>,
    );

  it("shows 'Certificate earned' with a Secondary View certificate on a pass only", () => {
    const html = render(5, "/profile/certificates/QT-2026-0001");
    expect(html).toContain(">Certificate earned<");
    const link = html.slice(0, html.indexOf(">View certificate<"));
    const a = link.slice(link.lastIndexOf("<a "));
    expect(a).toContain("bg-olive-tint");
    expect(a).toContain('href="/profile/certificates/QT-2026-0001"');
    expect(render(1, "/profile/certificates/x")).not.toContain("Certificate earned");
    expect(render(5)).not.toContain("Certificate earned");
  });
});
