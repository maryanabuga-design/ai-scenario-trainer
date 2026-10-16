import type { CSSProperties, Ref } from "react";
import { TOOLBAR_HEIGHT } from "@/lib/toolbar-placement";
import { COPIED_LABEL } from "@/lib/selection-actions";
import type { ToolbarAction } from "@/lib/selection-actions";

/**
 * The floating text toolbar of the reading screen (DESIGN.md: Highlights in the reading screen): a
 * deep olive pill of text buttons with thin dividers. `fixed` puts it where the caller says; the
 * screen review page draws it in place with `inline`.
 */
export function SelectionToolbar({
  actions,
  copied = false,
  onRun,
  style,
  inline = false,
  ref,
}: {
  actions: ToolbarAction[];
  /** "Copy" reads "Copied" for a moment after a copy. */
  copied?: boolean;
  onRun?: (id: ToolbarAction["id"]) => void;
  style?: CSSProperties;
  inline?: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Text actions"
      style={{ ...style, height: TOOLBAR_HEIGHT }}
      className={`${inline ? "inline-flex" : "fixed z-30 flex"} items-stretch overflow-hidden rounded-[12px] bg-primary text-primary-text shadow-(--card-shadow) transition-opacity duration-[120ms] motion-reduce:transition-none`}
    >
      {actions.map((action, index) => (
        <div key={action.id} className="flex items-stretch">
          {index > 0 && <span aria-hidden="true" className="my-2 w-px bg-primary-text/20" />}
          {action.id === "limit" ? (
            <span className="type-action flex items-center px-3 whitespace-nowrap">
              {action.label}
            </span>
          ) : (
            <button
              type="button"
              // keep the selection: pressing the button must not clear it
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => onRun?.(action.id)}
              className="type-action flex min-w-11 items-center justify-center px-3 whitespace-nowrap active:bg-primary-pressed"
            >
              {action.id === "copy" && copied ? COPIED_LABEL : action.label}
            </button>
          )}
        </div>
      ))}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? COPIED_LABEL : ""}
      </span>
    </div>
  );
}
