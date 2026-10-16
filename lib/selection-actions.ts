/**
 * The actions of the text-selection toolbar in the reading screen. "Ask AI" is defined here but
 * not in the toolbar yet: turn it on with the one constant below when its screen and content exist.
 */

export const HIGHLIGHT_LABEL = "Highlight";
export const UNHIGHLIGHT_LABEL = "Unhighlight";
export const ASK_AI_LABEL = "Ask AI";
export const COPY_LABEL = "Copy";
export const COPIED_LABEL = "Copied";
export const LIMIT_MESSAGE = "Highlight limit reached";

/** The one-line tip shown once under the meta line of a reading screen. */
export const TIP_TEXT = "Tip: select text to highlight it.";

/** Whether the toolbar shows "Ask AI". Off until the Ask AI screen and its content exist. */
export const ASK_AI_IN_TOOLBAR = false;

/** How long "Copied" shows before the toolbar closes. */
export const COPIED_MS = 1500;

export type ToolbarAction =
  | { id: "highlight" | "unhighlight" | "askAi" | "copy"; label: string }
  | { id: "limit"; label: string };

/**
 * The buttons of the toolbar, in order: Highlight (Unhighlight on an existing highlight, or the
 * limit message when no more can be added), then Ask AI when it is on, then Copy.
 */
export function toolbarActions({
  onHighlight,
  atLimit = false,
  askAi = ASK_AI_IN_TOOLBAR,
}: {
  /** The toolbar is for an existing highlight, not for a new selection. */
  onHighlight: boolean;
  atLimit?: boolean;
  askAi?: boolean;
}): ToolbarAction[] {
  const first: ToolbarAction = onHighlight
    ? { id: "unhighlight", label: UNHIGHLIGHT_LABEL }
    : atLimit
      ? { id: "limit", label: LIMIT_MESSAGE }
      : { id: "highlight", label: HIGHLIGHT_LABEL };
  return [
    first,
    ...(askAi ? [{ id: "askAi", label: ASK_AI_LABEL } as ToolbarAction] : []),
    { id: "copy", label: COPY_LABEL },
  ];
}
