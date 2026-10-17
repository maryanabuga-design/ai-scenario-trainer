/** The single-open accordion of the Steps topic screen. `null` means nothing is open. */

/** Step 1 is open when the screen opens. */
export const initialOpen = (stepIds: string[]): string | null => stepIds[0] ?? null;

/** Opening a step closes the one that was open; tapping the open step closes it. */
export const toggleOpen = (open: string | null, id: string): string | null =>
  open === id ? null : id;
