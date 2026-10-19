import { describe, expect, it } from "vitest";
import { deadlineText, isoDay, parseDeadline } from "@/lib/exam-deadline";

const now = new Date(2026, 9, 19, 15, 30); // 19 Oct 2026, 15:30 local

describe("the deadline text", () => {
  it("says how many days are left", () => {
    expect(deadlineText("2026-10-25", now)).toEqual({
      label: "Due 25 Oct · 6 days left",
      short: "Due 25 Oct",
      tone: "normal",
    });
    expect(deadlineText("2026-10-21", now).label).toBe("Due 21 Oct · 2 days left");
  });

  it("says tomorrow and today", () => {
    expect(deadlineText("2026-10-20", now)).toMatchObject({
      label: "Due tomorrow",
      tone: "normal",
    });
    expect(deadlineText("2026-10-19", now)).toMatchObject({ label: "Due today", tone: "normal" });
    // the time of day does not matter
    expect(deadlineText("2026-10-19", new Date(2026, 9, 19, 23, 59)).label).toBe("Due today");
    expect(deadlineText("2026-10-20", new Date(2026, 9, 19, 0, 1)).label).toBe("Due tomorrow");
  });

  it("says overdue since the date, in plain text (tone overdue only drives the clock icon)", () => {
    expect(deadlineText("2026-10-18", now)).toEqual({
      label: "Overdue since 18 Oct",
      short: "Overdue since 18 Oct",
      tone: "overdue",
    });
    expect(deadlineText("2026-09-30", now).short).toBe("Overdue since 30 Sept");
  });

  it("counts days across a month end", () => {
    expect(deadlineText("2026-11-02", now).label).toBe("Due 2 Nov · 14 days left");
  });

  it("does not crash on a broken deadline", () => {
    for (const bad of ["", "tomorrow", "2026-13-40", "2026-02-31"]) {
      expect(deadlineText(bad, now).label).toBe("No deadline");
    }
  });
});

describe("local dates", () => {
  it("adds days and keeps the local day", () => {
    expect(isoDay(now)).toBe("2026-10-19");
    expect(isoDay(now, 7)).toBe("2026-10-26");
    expect(isoDay(new Date(2026, 11, 30), 3)).toBe("2027-01-02");
  });

  it("parses only real dates", () => {
    expect(parseDeadline("2026-10-25")?.getDate()).toBe(25);
    expect(parseDeadline("25/10/2026")).toBeNull();
    expect(parseDeadline("2026-02-30")).toBeNull();
  });
});
