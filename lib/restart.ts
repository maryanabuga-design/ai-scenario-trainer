import { clearAllAppData } from "@/lib/store";

/** The screen the demo starts from. */
export const RESTART_TARGET = "/welcome";

/** The query that restarts the demo without a dialog. */
export const RESTART_QUERY = "restart";

/**
 * Restart demo: clears every key the app uses and opens Welcome with a full page load, so no state
 * of the old demo is left in memory. CLIENT ONLY (it touches browser storage).
 */
export function restartDemo() {
  clearAllAppData();
  // a FULL page load on purpose (not a soft navigation): nothing of the old demo stays in memory
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(RESTART_TARGET);
}

/** Whether a Welcome address asks for the restart: `/welcome?restart=1`. */
export const asksForRestart = (pathname: string, search: string): boolean =>
  pathname === RESTART_TARGET && new URLSearchParams(search).get(RESTART_QUERY) === "1";
