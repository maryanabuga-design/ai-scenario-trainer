const PRODUCT = "AI Scenario Trainer";

/** The page names that are not simply the heading of the page ("Hi, Maryana" is the Overview). */
const named: [RegExp, string][] = [
  [/^\/instructor\/?$/, "Overview"],
  [/^\/instructor\/exams\/?$/, "Exams"],
  [/^\/instructor\/exams\/new\/?$/, "Assign exam"],
  [/^\/instructor\/exams\/[^/]+\/extend\/?$/, "Extend deadline"],
  [/^\/instructor\/students\/?$/, "Students"],
  [/^\/instructor\/students\/invite\/?$/, "Invite students"],
  [/^\/instructor\/content\/?$/, "Content"],
  [/^\/instructor\/content\/import\/?$/, "Import content"],
  [/^\/instructor\/content\/course\/?$/, "Course topics"],
  [/^\/profile\/?$/, "Profile"],
];

/** "Students · AI Scenario Trainer": the name of the page, then the product. */
export function routeTitle(pathname: string, heading: string): string {
  const name = named.find(([pattern]) => pattern.test(pathname))?.[1] ?? heading.trim();
  return name ? `${name} · ${PRODUCT}` : PRODUCT;
}
