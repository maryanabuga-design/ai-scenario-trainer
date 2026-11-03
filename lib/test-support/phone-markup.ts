/**
 * The phone markup of a rendered screen: every element marked `data-desk-only` (the desktop table,
 * tab bar, card footer, ...) is cut out, so the older phone tests keep looking at the phone screen
 * only. The desktop parts have their own desktop specs.
 */
export function phoneMarkup(html: string): string {
  let out = html;
  for (;;) {
    const start = out.search(/<(div|nav)[^>]*data-desk-only/);
    if (start < 0) return out;
    const tag = out.slice(start + 1).match(/^(div|nav)/)![0];
    let depth = 0;
    let end = -1;
    const token = new RegExp(`<${tag}[\\s>]|</${tag}>`, "g");
    token.lastIndex = start;
    for (let m = token.exec(out); m; m = token.exec(out)) {
      depth += m[0].startsWith("</") ? -1 : 1;
      if (depth === 0) {
        end = m.index + m[0].length;
        break;
      }
    }
    if (end < 0) return out.slice(0, start);
    out = out.slice(0, start) + out.slice(end);
  }
}
