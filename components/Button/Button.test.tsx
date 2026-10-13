import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Sparkles } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "@/components/Button/Button";

/** The button's own class attribute. */
function classes(html: string) {
  return /class="([^"]*)"/.exec(html)?.[1] ?? "";
}

describe("the three locked button types", () => {
  it("filled: deep green, darker green when pressed, olive with a muted label when disabled", () => {
    const filled = classes(renderToStaticMarkup(<Button>Continue</Button>));
    expect(filled).toContain("bg-primary");
    expect(filled).toContain("text-primary-text");
    expect(filled).toContain("min-h-12");
    expect(filled).toContain("active:bg-primary-pressed");
    expect(filled).toContain("disabled:bg-secondary-olive");
    expect(filled).toContain("disabled:text-text-secondary");
  });

  it("outline: 1.5px dark green stroke, olive when pressed, olive-pressed stroke when disabled", () => {
    const outline = classes(renderToStaticMarkup(<Button variant="secondary">Repeat</Button>));
    expect(outline).toContain("border-[1.5px] border-primary bg-transparent text-primary");
    expect(outline).toContain("min-h-11");
    expect(outline).toContain("active:bg-secondary-olive");
    expect(outline).toContain("disabled:border-secondary-olive-pressed");
    expect(outline).toContain("disabled:text-text-secondary");
  });

  it("text: dark green underlined label, olive behind it when pressed, no underline when disabled", () => {
    const html = renderToStaticMarkup(
      <Button variant="text" icon={Sparkles}>
        Ask AI about this step
      </Button>,
    );
    expect(classes(html)).toContain("text-primary");
    expect(classes(html)).toContain("active:bg-secondary-olive");
    expect(classes(html)).toContain("disabled:text-text-secondary");
    expect(html).toContain("underline");
    expect(html).toContain("group-disabled:no-underline");
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain(">Ask AI about this step</span>");
  });

  it("has no hover state and a link looks the same as a button", () => {
    for (const variant of ["primary", "secondary", "text"] as const) {
      const button = classes(renderToStaticMarkup(<Button variant={variant}>Go</Button>));
      const link = classes(
        renderToStaticMarkup(
          <ButtonLink href="/" variant={variant}>
            Go
          </ButtonLink>,
        ),
      );
      expect(button).not.toContain("hover:");
      expect(link).not.toContain("hover:");
      expect(link).toContain(variant === "primary" ? "bg-primary" : "text-primary");
    }
  });
});

describe("no ad-hoc buttons", () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
    });
  }

  it("draws underlined text actions and hover states only in the Button component", () => {
    const own = [...files("components"), ...files("app")].filter((file) => {
      if (file.includes("Button/Button.tsx")) return false;
      const code = readFileSync(file, "utf8");
      return /\bunderline\b|hover:/.test(code);
    });
    expect(own).toEqual([]);
  });
});
