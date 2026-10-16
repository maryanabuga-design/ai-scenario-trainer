/** WCAG 2.x contrast of two #RRGGBB colours, from 1 to 21. */

function channel(hex: string, start: number) {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** The relative luminance of a #RRGGBB colour. */
export function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Text needs 4.5:1 (WCAG AA); borders and icons that carry meaning need 3:1. */
export const TEXT_CONTRAST = 4.5;
export const GRAPHIC_CONTRAST = 3;
