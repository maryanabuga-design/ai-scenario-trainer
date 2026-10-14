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
    expect(primary).toContain("min-h-12");
    expect(primary).toContain("w-full");
    expect(primary).toContain("active:bg-primary-pressed");
    expect(primary).toContain("disabled:bg-secondary-sand");
    expect(primary).toContain("disabled:text-text-secondary");
  });

  it("secondary: transparent with a 1.5px stroke, the primary's size; muted stroke when disabled", () => {
    const secondary = classes(renderToStaticMarkup(<Button variant="secondary">Back</Button>));
    expect(secondary).toContain("border-[1.5px] border-primary bg-transparent text-primary");
    expect(secondary).toContain("min-h-12");
    expect(secondary).toContain("w-full");
    expect(secondary).toContain("disabled:border-secondary-sand-pressed");
    expect(secondary).toContain("disabled:text-text-secondary");
    expect(secondary).not.toMatch(/(^| )bg-(?!transparent)/);
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
    expect(own).toEqual([]);
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
      // The answer sheet's "still correct" button, rendered below Continue (see AnswerSheet tests).
      "components/MarkCorrect/MarkCorrect.tsx",
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
