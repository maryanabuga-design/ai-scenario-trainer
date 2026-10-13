import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ExplainStep } from "@/components/ExplainStep/ExplainStep";
import { getStep } from "@/lib/scenario";

describe("Your choice on the Explain screen", () => {
  it("is the Your choice block: Guide chip fill, 3px dark green line, dark text", () => {
    const html = renderToStaticMarkup(
      <ActionBarProvider>
        <ExplainStep
          step={getStep("s1")}
          answer={{ stepId: "s1", optionId: "d", confidence: 2, explanation: "" }}
          index={0}
          total={3}
          onSend={() => undefined}
          onDontKnow={() => undefined}
        />
      </ActionBarProvider>,
    );
    const quote = /<blockquote class="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(quote).toContain("bg-secondary-sand");
    expect(quote).toContain("border-l-[3px]");
    expect(quote).toContain("border-l-primary");
    expect(quote).not.toContain("text-text-secondary");
  });
});
