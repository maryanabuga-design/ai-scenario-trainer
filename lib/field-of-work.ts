/**
 * Field of work (DESIGN.md: Field of work): who the person is. It only tunes the SIMULATED examples
 * of Ask AI. Pure: the values and their labels; nothing is read or saved here.
 */
export const FIELDS = ["rescue", "paramedic", "military", "civil", "other"] as const;
export type FieldOfWork = (typeof FIELDS)[number];

/** The full labels of the registration step and the picker. */
export const fullLabels: Record<FieldOfWork, string> = {
  rescue: "Rescue and emergency services",
  paramedic: "Paramedic or medical",
  military: "Military",
  civil: "Civil protection or volunteer",
  other: "Other",
};

/** The short labels (the Profile row, "Answers tuned for", the example line). */
export const shortLabels: Record<FieldOfWork, string> = {
  rescue: "Rescue services",
  paramedic: "Paramedic",
  military: "Military",
  civil: "Civil protection",
  other: "Other",
};

/** A value read from storage: a known field, otherwise null (nothing is set, nothing crashes). */
export const cleanField = (value: unknown): FieldOfWork | null =>
  typeof value === "string" && (FIELDS as readonly string[]).includes(value)
    ? (value as FieldOfWork)
    : null;

export const fullLabel = (field: FieldOfWork) => fullLabels[field];

/** "Rescue services", or "Not set". */
export const shortLabel = (field: FieldOfWork | null) => (field ? shortLabels[field] : "Not set");

/** "Answers tuned for: Paramedic", or the invitation while the field is not set. */
export const tunedLine = (field: FieldOfWork | null) =>
  field ? `Answers tuned for: ${shortLabels[field]}` : "Set your field to tune answers";

/** Words that must never appear in the prepared examples (educational, non-combat content only). */
export const FORBIDDEN_WORDS = [
  "weapon",
  "gun",
  "rifle",
  "combat",
  "attack",
  "enemy",
  "kill",
  "bomb",
  "explos",
  "tactic",
  "ambush",
  "hostile",
  "shoot",
  "target",
  "mission",
  "troops",
  "battle",
];
