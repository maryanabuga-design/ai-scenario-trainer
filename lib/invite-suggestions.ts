import data from "@/content/invite-suggestions.json";

/** A person the Invite screen can suggest while typing. SIMULATED (see the data file). */
export type Suggestion = { name: string; email: string };

export const SUGGESTIONS: Suggestion[] = data.people;
export const MAX_SUGGESTIONS = 5;

/** Up to five people whose name or email contains the text, skipping the emails in `skip`. */
export function suggest(
  query: string,
  skip: string[] = [],
  people: Suggestion[] = SUGGESTIONS,
): Suggestion[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  return people
    .filter(
      (person) =>
        !skip.includes(person.email) &&
        (person.name.toLowerCase().includes(needle) || person.email.includes(needle)),
    )
    .slice(0, MAX_SUGGESTIONS);
}
