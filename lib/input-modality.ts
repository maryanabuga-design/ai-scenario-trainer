/** Keys that move focus: after one of these the focus ring is shown again. */
const navigationKeys = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Escape",
]);

/**
 * Remembers how the person last interacted, on <html data-input>: "pointer" after a mouse click,
 * tap or pen, "keyboard" after a navigation key. The CSS hides the focus ring in pointer mode, so
 * a ring never appears after a tap, also when the app moves focus itself. Returns a cleanup.
 */
export function trackInputModality(doc: Document): () => void {
  const root = doc.documentElement;
  const onPointer = () => {
    root.dataset.input = "pointer";
  };
  const onKey = (event: Event) => {
    if (navigationKeys.has((event as KeyboardEvent).key)) root.dataset.input = "keyboard";
  };
  doc.addEventListener("pointerdown", onPointer, true);
  doc.addEventListener("keydown", onKey, true);
  return () => {
    doc.removeEventListener("pointerdown", onPointer, true);
    doc.removeEventListener("keydown", onKey, true);
  };
}
