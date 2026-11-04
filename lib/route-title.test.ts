import { describe, expect, it } from "vitest";
import { routeTitle } from "@/lib/route-title";

describe("the document title of a page", () => {
  it("names the main pages, whatever their heading says", () => {
    expect(routeTitle("/instructor", "Hi, Maryana")).toBe("Overview · AI Scenario Trainer");
    expect(routeTitle("/instructor/students", "Students")).toBe("Students · AI Scenario Trainer");
    expect(routeTitle("/instructor/exams/new", "Assign exam")).toBe(
      "Assign exam · AI Scenario Trainer",
    );
  });

  it("uses the heading of any other page", () => {
    expect(routeTitle("/instructor/exams/seed-active", "Alarm and escape routes exam")).toBe(
      "Alarm and escape routes exam · AI Scenario Trainer",
    );
  });

  it("falls back to the product name", () => {
    expect(routeTitle("/somewhere", "  ")).toBe("AI Scenario Trainer");
  });
});
