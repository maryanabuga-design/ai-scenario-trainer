import { describe, expect, it } from "vitest";
import {
  ASK_AI_IN_TOOLBAR,
  ASK_AI_LABEL,
  COPIED_LABEL,
  COPIED_MS,
  COPY_LABEL,
  HIGHLIGHT_LABEL,
  LIMIT_MESSAGE,
  UNHIGHLIGHT_LABEL,
  toolbarActions,
} from "@/lib/selection-actions";

const labels = (actions: ReturnType<typeof toolbarActions>) =>
  actions.map((action) => action.label);

describe("the toolbar actions", () => {
  it("has named labels", () => {
    expect(HIGHLIGHT_LABEL).toBe("Highlight");
    expect(UNHIGHLIGHT_LABEL).toBe("Unhighlight");
    expect(ASK_AI_LABEL).toBe("Ask AI");
    expect(COPY_LABEL).toBe("Copy");
    expect(COPIED_LABEL).toBe("Copied");
    expect(LIMIT_MESSAGE).toBe("Highlight limit reached");
    expect(COPIED_MS).toBe(1500);
  });

  it("is Highlight and Copy for a new selection", () => {
    expect(labels(toolbarActions({ onHighlight: false }))).toEqual(["Highlight", "Copy"]);
  });

  it("is Unhighlight and Copy on an existing highlight", () => {
    expect(labels(toolbarActions({ onHighlight: true }))).toEqual(["Unhighlight", "Copy"]);
  });

  it("replaces Highlight by the limit message at the limit, and keeps Copy", () => {
    const actions = toolbarActions({ onHighlight: false, atLimit: true });
    expect(labels(actions)).toEqual(["Highlight limit reached", "Copy"]);
    expect(actions[0].id).toBe("limit");
    // an existing highlight can still be removed at the limit
    expect(labels(toolbarActions({ onHighlight: true, atLimit: true }))).toEqual([
      "Unhighlight",
      "Copy",
    ]);
  });

  it("keeps Ask AI out for now, and puts it between the two when the constant is turned on", () => {
    expect(ASK_AI_IN_TOOLBAR).toBe(false);
    expect(labels(toolbarActions({ onHighlight: false }))).not.toContain("Ask AI");
    expect(labels(toolbarActions({ onHighlight: false, askAi: true }))).toEqual([
      "Highlight",
      "Ask AI",
      "Copy",
    ]);
    expect(labels(toolbarActions({ onHighlight: true, askAi: true }))).toEqual([
      "Unhighlight",
      "Ask AI",
      "Copy",
    ]);
  });
});
