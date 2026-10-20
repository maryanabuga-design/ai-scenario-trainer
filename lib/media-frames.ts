/**
 * The fixed frames of the 3D pictures and how an artwork is scaled to fill its frame (DESIGN.md:
 * Media3D). Pure and shared by Home, Welcome and the onboarding, so a server page may import it.
 */

/** The non-transparent box of a picture, as fractions of its file (x0, y0, x1, y1 from 0 to 1). */
export type Artwork = { x0: number; y0: number; x1: number; y1: number };

/**
 * Where the artwork sits inside each Home picture's file, measured from the pixels (both files are
 * 1254 by 1254 with transparent margins): the books 312..945 by 347..933, the clipboard 297..984
 * by 221..990. A test measures the files again and fails if these drift.
 */
export const homeArtwork: Record<"heroTraining" | "iconMiniQuiz", Artwork> = {
  heroTraining: { x0: 312 / 1254, y0: 347 / 1254, x1: 945 / 1254, y1: 933 / 1254 },
  iconMiniQuiz: { x0: 297 / 1254, y0: 221 / 1254, x1: 984 / 1254, y1: 990 / 1254 },
};

/** The share of the frame the artwork may fill: 1% to spare so no edge is touched. */
export const ARTWORK_FILL = 0.99;

/** The fixed frames of Home's two pictures in px: 60px is a title with two small lines. */
export const homeFrames = {
  tile: { width: 76, height: 60 },
  row: { width: 64, height: 60 },
  /** The hero panel slot (Welcome, onboarding) and the Verify slot. */
  panel: { width: 220, height: 220 },
  verify: { width: 80, height: 80 },
} as const;

/**
 * The transform that makes the artwork fill its frame without editing the file. With
 * `object-fit: contain` the file is drawn as a square of the frame's shorter side, centred; scale
 * about the frame's centre until the artwork height fills the frame (or its width, when that comes
 * first) and move the artwork's centre to the frame's centre. Offsets are in px.
 */
export function artworkTransform(
  art: Artwork,
  frame: { width: number; height: number },
): { scale: number; x: number; y: number } {
  const side = Math.min(frame.width, frame.height);
  const scale = Math.min(
    (ARTWORK_FILL * frame.height) / ((art.y1 - art.y0) * side),
    (ARTWORK_FILL * frame.width) / ((art.x1 - art.x0) * side),
  );
  const centreX = (art.x0 + art.x1) / 2;
  const centreY = (art.y0 + art.y1) / 2;
  return { scale, x: -(centreX - 0.5) * side * scale, y: -(centreY - 0.5) * side * scale };
}

/** The pictures of the Welcome, onboarding and Verify slots (public/heroes), by slot name. */
export const heroSlotFiles = {
  welcome: "/heroes/welcome.webp",
  "onboarding-practise": "/heroes/onboarding-practise.webp",
  "onboarding-mistakes": "/heroes/onboarding-mistakes.webp",
  "onboarding-exam": "/heroes/onboarding-exam.webp",
  verify: "/heroes/verify.webp",
} as const;

export type HeroSlot = keyof typeof heroSlotFiles;
