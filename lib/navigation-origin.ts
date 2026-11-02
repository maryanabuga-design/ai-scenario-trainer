/**
 * Where the reader was before a reading screen opened, so Back can use the browser history (which
 * keeps the Materials list's scroll position) when the list is the origin, and go to the list
 * otherwise. CLIENT ONLY: it is module state, set from an effect.
 */

const READING = "/materials/read/";
const isReading = (path: string | null) => !!path?.startsWith(READING);

let current: string | null = null;
let origin: string | null = null;
let previous: string | null = null;

/** Called with every new pathname. Moving between topics keeps the origin of the first one. */
export function noteNavigation(path: string) {
  if (path === current) return;
  const before = current;
  previous = before;
  current = path;
  if (isReading(path)) {
    if (!isReading(before)) origin = before;
  } else {
    origin = null;
  }
}

/**
 * Whether the app showed another screen before this one since the page was loaded: false after a
 * reload or a link opened directly, so a back arrow can go to a safe screen instead of leaving the app.
 */
export const hasPreviousScreen = () => previous !== null;

/** The pathname the current reading session started from; null after a reload or a direct visit. */
export const readingOrigin = () => origin;

/** Back from a reading screen: true when the browser history leads to the Materials list. */
export const canGoBackToList = () => origin === "/materials";

/** Back from a reading screen: true when the reader came from the question screen (the Guide chip of a quiz sheet). */
export const canGoBackToQuestion = () => origin === "/session";

const RESTORE_KEY = "ast.materials-scroll.v1";

function write(value: { y: number; restore: boolean } | null) {
  try {
    if (value) sessionStorage.setItem(RESTORE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(RESTORE_KEY);
  } catch {
    // private mode or blocked storage: the list simply opens at the top
  }
}

function read(): { y: number; restore: boolean } | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(RESTORE_KEY) ?? "null");
    return value && typeof value.y === "number" ? value : null;
  } catch {
    return null;
  }
}

/** The Materials list remembers how far it was scrolled. */
export const saveListScroll = (y: number) => write({ y, restore: read()?.restore ?? false });

/** Back from a reading screen to the list by a new navigation asks the list to scroll there again. */
export function requestListRestore() {
  write({ y: read()?.y ?? 0, restore: true });
}

/** The scroll position to restore on arrival, once; null when nobody asked. */
export function takeListRestore(): number | null {
  const value = read();
  if (!value?.restore) return null;
  write({ y: value.y, restore: false });
  return value.y;
}
