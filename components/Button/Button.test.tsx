import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Sparkles } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink, buttonVariants } from "@/components/Button/Button";

/** The button's own class attribute. */
function classes(html: string) {
  return /class="([^"]*)"/.exec(html)?.[1] ?? "";
}

describe("the three locked button types", () => {
  it("has exactly three variants", () => {
    expect(Object.keys(buttonVariants).sort()).toEqual(["primary", "secondary", "tertiary"]);
  });

  it("primary: deep green fill, white label, darker green when pressed, sand when disabled", () => {
    const primary = classes(renderToStaticMarkup(<Button>Continue</Button>));
    expect(primary).toContain("bg-primary text-primary-text");
    expect(primary).toContain("h-[52px]");
    expect(primary).toContain("w-full");
    expect(primary).toContain("active:bg-primary-pressed");
    expect(primary).toContain("disabled:bg-secondary-sand");
    expect(primary).toContain("disabled:text-text-secondary");
  });

  it("secondary: filled with the olive tint, no stroke, the dark green label, the primary's size", () => {
    const secondary = classes(renderToStaticMarkup(<Button variant="secondary">Back</Button>));
    expect(secondary).toContain("bg-olive-tint text-primary");
    expect(secondary).toContain("active:bg-olive-tint-pressed");
    expect(secondary).toContain("h-[52px]");
    expect(secondary).toContain("w-full");
    expect(secondary).toContain("disabled:bg-secondary-sand disabled:text-text-secondary");
    expect(secondary).not.toMatch(/(^| )(border|outline)/);
  });

  it("primary and secondary share the 14px radius, the 52px height and the width", () => {
    const [primary, secondary] = (["primary", "secondary"] as const).map((variant) =>
      classes(renderToStaticMarkup(<Button variant={variant}>Go</Button>)),
    );
    for (const own of [primary, secondary]) {
      expect(own).toContain("rounded-button");
      expect(own).toContain("h-[52px]");
      expect(own).toContain("w-full");
    }
    expect(/--radius-button:\s*14px/.test(readFileSync("app/globals.css", "utf8"))).toBe(true);
  });

  it("is never fully rounded, in any variant", () => {
    for (const variant of ["primary", "secondary", "tertiary"] as const) {
      expect(classes(renderToStaticMarkup(<Button variant={variant}>Go</Button>))).not.toContain(
        "rounded-full",
      );
    }
  });

  it("has an outline variant nowhere: no button style has a stroke except the disabled primary", () => {
    expect(buttonVariants.secondary).not.toMatch(/border|bg-transparent/);
    expect(buttonVariants.tertiary).not.toMatch(/border/);
  });

  it("makes the header action 44px high", () => {
    const compact = classes(
      renderToStaticMarkup(
        <Button variant="secondary" compact wide={false}>
          Upload a file
        </Button>,
      ),
    );
    expect(compact).toContain("h-11!");
    expect(compact).toContain("rounded-button");
  });

  it("tertiary: small underlined text, no background, no border, 44px tap area", () => {
    const html = renderToStaticMarkup(
      <Button variant="tertiary" icon={Sparkles}>
        Ask AI about this step
      </Button>,
    );
    const tertiary = classes(html);
    expect(tertiary).toContain("type-action text-primary");
    expect(tertiary).toContain("min-h-11");
    expect(tertiary).not.toMatch(/(^| )(bg-|border|shadow)/);
    expect(tertiary).not.toMatch(/active:bg-/);
    expect(html).toContain("underline");
    expect(html).toContain("group-disabled:no-underline");
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it("has no hover state, and a link looks like its button", () => {
    for (const variant of ["primary", "secondary", "tertiary"] as const) {
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

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

/** App code, without the Button itself and the dev-only screen review page (it shows specimens). */
const sources = () =>
  [...files("components"), ...files("app")].filter(
    (file) => !file.includes("Button/Button.tsx") && !file.startsWith("app/screens/"),
  );

describe("every button goes through the Button component", () => {
  it("leaves no one-off button style: button text styles, underlines or hover anywhere else", () => {
    const own = sources().filter((file) =>
      /type-button|type-action|\bunderline\b|hover:/.test(readFileSync(file, "utf8")),
    );
    // The floating text toolbar of the reading screen has its own white-on-olive buttons (DESIGN.md:
    // Highlights in the reading screen); they use the small action text style.
    expect(own).toEqual(["components/SelectionToolbar/SelectionToolbar.tsx"]);
  });

  it("uses no other variant names", () => {
    const old = sources().filter((file) => /variant="text"/.test(readFileSync(file, "utf8")));
    expect(old).toEqual([]);
  });
});

describe("a secondary always comes with a primary above it", () => {
  it("is used only in the documented places", () => {
    const withSecondary = sources()
      .filter((file) =>
        /variant="secondary"|variant = "secondary"/.test(readFileSync(file, "utf8")),
      )
      .sort();
    expect(withSecondary).toEqual([
      // The exam screen: Start exam anyway, below the primary Repeat weak topics.
      "components/ExamView/ExamView.tsx",
      // Progress: the Exam readiness card's Repeat weak topics, its one action (documented exception).
      "components/ProgressView/ProgressView.tsx",
      // The reading screen's quick-actions bar: Steps next to the primary Practise this topic.
      "components/QuickActionsBar/QuickActionsBar.tsx",
      // The reading screen: Steps for this topic, below the primary Practise this topic.
      "components/ReadingView/ReadingView.tsx",
      // Results: Review answers, below the primary Repeat weak topics.
      "components/ResultsView/ResultsView.tsx",
      // Review: Start training above Back to material.
      "components/TrainingReview/TrainingReview.tsx",
      // The page-header "Upload a file" on Materials: the one documented exception.
      "components/UploadSheet/UploadSheet.tsx",
    ]);
  });

  it("Review: the primary comes before the secondary", () => {
    const code = readFileSync("components/TrainingReview/TrainingReview.tsx", "utf8");
    const bar = code.slice(code.indexOf("<ActionBar>"));
    expect(bar.indexOf("<Button onClick={onStart}>")).toBeLessThan(
      bar.indexOf('variant="secondary"'),
    );
  });

  it("Upload a file is secondary only in the Materials header; elsewhere it is not", () => {
    const list = readFileSync("components/MaterialsList/MaterialsList.tsx", "utf8");
    const view = readFileSync("components/MaterialView/MaterialView.tsx", "utf8");
    expect(list).toMatch(/label="Try another file"\s+variant="tertiary"/);
    expect(view).toMatch(/label="Try another file"\s+variant="tertiary"/);
  });
});

describe("the /screens buttons section", () => {
  it("shows the three types in default, pressed, disabled and focus states", () => {
    const samples = readFileSync("app/screens/samples.tsx", "utf8");
    expect(samples).toContain('["default", "pressed", "disabled", "focus"]');
    expect(samples).toContain('(["primary", "secondary", "tertiary"] as const)');
  });
});
