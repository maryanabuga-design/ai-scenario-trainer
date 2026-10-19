import { describe, expect, it } from "vitest";
import {
  DEMO_CODE,
  RESEND_SECONDS,
  digitsFrom,
  formatCode,
  isCorrectCode,
  resendRemaining,
} from "@/lib/auth-code";

describe("the demo code", () => {
  it("is 482913 and is the only correct code", () => {
    expect(DEMO_CODE).toBe("482913");
    expect(isCorrectCode("482913")).toBe(true);
    for (const wrong of ["", "000000", "48291", "4829133", "482 913", "482914"]) {
      expect(isCorrectCode(wrong), wrong).toBe(false);
    }
  });

  it("is shown in two groups of three", () => {
    expect(formatCode(DEMO_CODE)).toBe("482 913");
  });

  it("takes the digits of a pasted text, at most six", () => {
    expect(digitsFrom("482 913")).toBe("482913");
    expect(digitsFrom("code: 4-8-2-9-1-3-5")).toBe("482913");
    expect(digitsFrom("abc")).toBe("");
    expect(digitsFrom("12")).toBe("12");
  });
});

describe("the resend countdown (the clock is a parameter)", () => {
  const sent = 1_000_000;

  it("counts down from 30 seconds to 0, never below", () => {
    expect(RESEND_SECONDS).toBe(30);
    expect(resendRemaining(sent, sent)).toBe(30);
    expect(resendRemaining(sent, sent + 1_000)).toBe(29);
    expect(resendRemaining(sent, sent + 1_500)).toBe(29);
    expect(resendRemaining(sent, sent + 29_001)).toBe(1);
    expect(resendRemaining(sent, sent + 30_000)).toBe(0);
    expect(resendRemaining(sent, sent + 90_000)).toBe(0);
  });

  it("starts again from the time the new code was sent", () => {
    expect(resendRemaining(sent + 40_000, sent + 41_000)).toBe(29);
  });
});
