"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GuideText } from "@/components/GuideText/GuideText";
import { copyText } from "@/lib/clipboard";
import {
  MAX_HIGHLIGHTS,
  addHighlights,
  blockTexts,
  reanchor,
  removeHighlight,
  splitSelection,
} from "@/lib/highlights";
import type { Piece } from "@/lib/highlights";
import { dismissTip, highlightsFor, saveHighlights, useHighlights } from "@/lib/highlight-store";
import { SelectionToolbar } from "@/components/SelectionToolbar/SelectionToolbar";
import { COPIED_MS, toolbarActions } from "@/lib/selection-actions";
import { placeToolbar } from "@/lib/toolbar-placement";

/** The page side gutter in pixels (`--gutter`, 1rem). */
const GUTTER = 16;

/** What the toolbar is about: a fresh selection, or an existing highlight that was tapped. */
type SelectionTarget = { kind: "selection"; pieces: Piece[]; text: string };
type Target = SelectionTarget | { kind: "highlight"; id: string; text: string };

/** The number of characters of a block before a point of the selection. */
function offsetIn(block: Element, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(block);
  range.setEnd(node, offset);
  return range.toString().length;
}

/**
 * The body of a reading screen with highlights and the floating toolbar (DESIGN.md: Highlights in
 * the reading screen). The toolbar follows the selection, or a tapped highlight, and has the
 * actions of `toolbarActions`: Highlight or Unhighlight, and Copy.
 */
export function HighlightableText({ topicId, markdown }: { topicId: string; markdown: string }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const stored = useHighlights();
  const texts = useMemo(() => blockTexts(markdown), [markdown]);
  // The saved highlights are placed on the current text; the ones that no longer fit are dropped.
  const list = useMemo(
    () => reanchor(highlightsFor(stored === "loading" ? null : stored, topicId), texts),
    [stored, topicId, texts],
  );
  const [target, setTarget] = useState<Target | null>(null);
  const [position, setPosition] = useState<{ target: Target; left: number; top: number } | null>(
    null,
  );
  // The position counts only for the target it was worked out for, so a new target never flashes at the old place.
  const placed = position && position.target === target ? position : null;
  const [copied, setCopied] = useState(false);

  /** The rectangle the toolbar sits next to: the selection, or the marks of the tapped highlight. */
  const anchorRect = useCallback((current: Target): DOMRect | null => {
    if (current.kind === "highlight") {
      const marks = [
        ...(bodyRef.current?.querySelectorAll(`mark[data-highlight="${current.id}"]`) ?? []),
      ];
      if (marks.length === 0) return null;
      const rects = marks.map((mark) => mark.getBoundingClientRect());
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      const top = Math.min(...rects.map((r) => r.top));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      return new DOMRect(left, top, right - left, bottom - top);
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0).getBoundingClientRect();
  }, []);

  /** Reads the browser selection: only one that starts and ends inside the body counts. */
  const readSelection = useCallback((): SelectionTarget | null => {
    const selection = window.getSelection();
    const root = bodyRef.current;
    if (!selection || !root || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
    const blocks = [...root.querySelectorAll("[data-block]")].filter((el) =>
      range.intersectsNode(el),
    );
    if (blocks.length === 0) return null;
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    const from = {
      block: Number(first.getAttribute("data-block")),
      offset: first.contains(range.startContainer)
        ? offsetIn(first, range.startContainer, range.startOffset)
        : 0,
    };
    const to = {
      block: Number(last.getAttribute("data-block")),
      offset: last.contains(range.endContainer)
        ? offsetIn(last, range.endContainer, range.endOffset)
        : (last.textContent ?? "").length,
    };
    const pieces = splitSelection(texts, from, to);
    const length = pieces.reduce((sum, piece) => sum + piece.end - piece.start, 0);
    if (length < 2) return null;
    return { kind: "selection", pieces, text: selection.toString().trim() };
  }, [texts]);

  // The toolbar follows the selection.
  useEffect(() => {
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readSelection();
        setCopied(false);
        setTarget((current) => {
          if (next) {
            // the same selection again (the event fires often): keep the target, so nothing flickers
            const same =
              current?.kind === "selection" &&
              current.text === next.text &&
              JSON.stringify(current.pieces) === JSON.stringify(next.pieces);
            return same ? current : next;
          }
          // a collapsed selection closes the toolbar of a selection, not that of a tapped highlight
          return current?.kind === "highlight" ? current : null;
        });
      });
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", onChange);
    };
  }, [readSelection]);

  // A tap on a highlight shows its toolbar; a tap anywhere else closes it.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Element | null;
      if (toolbarRef.current?.contains(node)) return;
      if (!node?.closest("mark[data-highlight]")) {
        setTarget((current) => (current?.kind === "highlight" ? null : current));
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const onBodyClick = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;
    const mark = (event.target as Element).closest("mark[data-highlight]");
    const id = mark?.getAttribute("data-highlight");
    if (!id) return;
    const found = list.find((highlight) => highlight.id === id);
    if (found) setTarget({ kind: "highlight", id, text: found.quote });
  };

  // Place the toolbar next to what it is about, and again when the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!target) return;
    let frame = 0;
    const place = () => {
      const rect = anchorRect(target);
      const bar = toolbarRef.current;
      if (!rect || !bar) return;
      const nav = document.querySelector("nav[aria-label=Main]");
      const placed = placeToolbar({
        rect,
        width: bar.offsetWidth,
        viewport: { width: document.documentElement.clientWidth, height: window.innerHeight },
        gutter: GUTTER,
        bottomLimit: nav ? nav.getBoundingClientRect().top : window.innerHeight,
        touch: window.matchMedia("(pointer: coarse)").matches,
      });
      setPosition({ target, left: placed.left, top: placed.top });
    };
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    soon();
    window.addEventListener("scroll", soon, { passive: true });
    window.addEventListener("resize", soon);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", soon);
      window.removeEventListener("resize", soon);
    };
  }, [target, anchorRect, copied]);

  const close = () => {
    setTarget(null);
    setCopied(false);
  };

  const highlight = () => {
    if (target?.kind !== "selection") return;
    const result = addHighlights(list, target.pieces, texts);
    if (!result.added) return;
    saveHighlights(topicId, result.list);
    dismissTip();
    window.getSelection()?.removeAllRanges();
    close();
  };

  const unhighlight = () => {
    if (target?.kind !== "highlight") return;
    saveHighlights(topicId, removeHighlight(list, target.id));
    close();
  };

  const copy = async () => {
    if (!target) return;
    if (await copyText(target.text)) {
      setCopied(true);
      window.setTimeout(close, COPIED_MS);
    }
  };

  const onHighlight = target?.kind === "highlight";
  // At the limit the selection cannot add a highlight unless it merges into an existing one.
  const atLimit =
    target?.kind === "selection" &&
    addHighlights(list, target.pieces, texts).added === false &&
    list.length >= MAX_HIGHLIGHTS;
  const actions = toolbarActions({ onHighlight: !!onHighlight, atLimit: !!atLimit });
  const run: Record<string, () => void> = {
    highlight,
    unhighlight,
    copy: () => void copy(),
  };

  return (
    <>
      <div ref={bodyRef} data-reading-body onClick={onBodyClick}>
        <GuideText markdown={markdown} highlights={list} />
      </div>
      {target && (
        <SelectionToolbar
          ref={toolbarRef}
          actions={actions}
          copied={copied}
          onRun={(id) => run[id]?.()}
          style={{
            left: placed?.left ?? 0,
            top: placed?.top ?? 0,
            opacity: placed ? 1 : 0,
          }}
        />
      )}
    </>
  );
}
