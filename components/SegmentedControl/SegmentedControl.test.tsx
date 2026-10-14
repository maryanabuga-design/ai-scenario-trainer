import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";

describe("segmented switch", () => {
  const html = renderToStaticMarkup(
    <SegmentedControl
      name="mode"
      legend="What do you want to do?"
      options={[
        { value: "scenario", label: "Scenario" },
        { value: "quiz", label: "Quiz" },
      ]}
      value="scenario"
      onChange={() => undefined}
    />,
  );

  it("shows the selected side as the dark green pill without a check icon", () => {
    expect(html).not.toContain("<svg");
    expect(html).toContain("bg-primary text-primary-text");
  });

  it("keeps the accessible state: real radios, the selected one checked", () => {
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toMatch(/checked="" value="scenario"/);
    expect(html).not.toMatch(/checked="" value="quiz"/);
  });
});
