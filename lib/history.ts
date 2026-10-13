/** Session history shows this many sessions at first, and this many more per "Show more". */
export const HISTORY_PAGE = 5;

/** The sessions shown so far (newest first) and whether "Show more" is still needed. */
export function visibleHistory<T>(newestFirst: T[], shown: number) {
  return { visible: newestFirst.slice(0, shown), hasMore: newestFirst.length > shown };
}

/** How many sessions are shown after one more "Show more". */
export function showMore(shown: number): number {
  return shown + HISTORY_PAGE;
}
