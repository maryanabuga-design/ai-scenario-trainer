import { describe, expect, it } from "vitest";
import { isEmailFormat, normaliseEmail, validateEmail, validateName } from "@/lib/auth-validation";

describe("the name", () => {
  it("needs at least 2 characters after trimming", () => {
    expect(validateName("")).toBe("Enter your full name.");
    expect(validateName("   ")).toBe("Enter your full name.");
    expect(validateName("A")).toBe("Your name needs at least 2 characters.");
    expect(validateName(" A ")).toBe("Your name needs at least 2 characters.");
    expect(validateName("Al")).toBeNull();
    expect(validateName("Maryana Buga")).toBeNull();
  });
});

describe("the email", () => {
  it("passes a simple format check", () => {
    for (const ok of ["a@b.co", "maryana@example.com", "first.last@sub.company.org", " me@x.io "]) {
      expect(isEmailFormat(ok), ok).toBe(true);
      expect(validateEmail(ok), ok).toBeNull();
    }
    for (const bad of [
      "",
      "a",
      "a@b",
      "a@b.",
      "@b.com",
      "a b@c.com",
      "a@@b.com",
      "a@b.c",
      "a@.com",
    ]) {
      expect(isEmailFormat(bad), bad).toBe(false);
    }
  });

  it("gives one message for empty and one for a wrong format", () => {
    expect(validateEmail("  ")).toBe("Enter your work email.");
    expect(validateEmail("nope")).toBe("Enter a valid email, like name@company.com.");
  });

  it("is normalised: trimmed and lower case", () => {
    expect(normaliseEmail("  Maryana@Example.COM ")).toBe("maryana@example.com");
  });
});
