/** Session history shows this many at first and this many more with each "See more". */
export const HISTORY_PAGE = 10;

/** The sessions to show (newest first) and whether "See more" is needed. */
export function visibleHistory<T>(newestFirst: T[], shown: number) {
  return { visible: newestFirst.slice(0, shown), hasMore: newestFirst.length > shown };
}

export function seeMore(shown: number): number {
  return shown + HISTORY_PAGE;
}
