import { execSync } from "node:child_process";

/**
 * The short id of the commit this build was made from: Vercel's commit (VERCEL_GIT_COMMIT_SHA) when
 * it builds, otherwise the local git HEAD, otherwise "dev". Used by next.config.ts only; the app
 * reads the result from NEXT_PUBLIC_BUILD_ID.
 */
export function buildId(): string {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel) return fromVercel.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}
