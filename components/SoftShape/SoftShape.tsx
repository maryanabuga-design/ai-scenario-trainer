/** Layer opacities, largest curve first. "strong" sits in Next up, "faint" in New scenario. */
const layers = {
  strong: [0.06, 0.08, 0.14],
  faint: [0.03, 0.03, 0.04],
} as const;

const curves = [
  "M240 8C204 18 184 66 128 88C78 108 34 122 0 160H240Z",
  "M240 48C208 58 192 98 146 116C108 131 76 140 56 160H240Z",
  "M240 92C216 98 202 126 174 142C154 153 136 157 122 160H240Z",
];

/**
 * The only decorative shape in the app: soft abstract curves rising from a card's bottom-right
 * corner, tone on tone. The card must be `relative isolate overflow-hidden`.
 */
export function SoftShape({ variant }: { variant: keyof typeof layers }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 240 160"
      preserveAspectRatio="xMaxYMax meet"
      className="pointer-events-none absolute right-0 bottom-0 -z-10 h-auto w-[80%] max-w-80"
    >
      {curves.map((d, index) => (
        <path key={d} d={d} className="fill-(--mesh-moss)" fillOpacity={layers[variant][index]} />
      ))}
    </svg>
  );
}
