import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import pkg from "@/package.json";

/** The four lines of "About this prototype". The version is the one in package.json. */
export const aboutLines = [
  "Your progress is saved on this device only.",
  "AI answers are prepared examples; there is no live AI model.",
  "All content is educational.",
  `Version ${pkg.version}`,
];

/** About this prototype: a short screen with four plain lines (DESIGN.md: Roles and Profile). */
export function AboutView() {
  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href="/profile" label="Back to Profile" />
      <h1 className="type-page-title">About this prototype</h1>
      <ul className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)">
        {aboutLines.map((line) => (
          <li key={line} className="type-body">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
