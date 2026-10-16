import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The server/client rule (CLAUDE.md): server pages and layouts import only pure content helpers;
 * anything that reads progress lives in client components. Two ways to break it have both happened:
 * a server page reaching `lib/store.ts` (useSyncExternalStore), and a client component reaching a
 * module that reads files with `node:fs`. Both only fail at build time, so this test finds them.
 */

const ROOT = process.cwd();
const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : walk(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const read = (file: string) => readFileSync(file, "utf8");
const isClient = (file: string) =>
  /^\s*(?:\/\*[\s\S]*?\*\/\s*)?["']use client["']/.test(read(file));

/** The files a file imports (the "@/" alias and relative paths; packages are ignored). */
function importsOf(file: string): string[] {
  // type-only imports are erased by the compiler, so they bring nothing into a bundle
  const code = read(file).replace(/(?:import|export)\s+type\s[^;]*?from\s*["'][^"']+["'];?/g, "");
  const specs = [
    ...code.matchAll(
      /(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\(["']([^"']+)["']\)|import\s*["']([^"']+)["']/g,
    ),
  ]
    .map((match) => match[1] ?? match[2] ?? match[3])
    .filter(Boolean);
  return specs.flatMap((spec) => {
    const base = spec.startsWith("@/")
      ? join(ROOT, spec.slice(2))
      : spec.startsWith(".")
        ? join(dirname(file), spec)
        : null;
    if (!base) return [];
    const found = [base, ...EXTENSIONS.map((ext) => base + ext)].find(
      (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
    );
    return found ? [found] : [];
  });
}

const rel = (file: string) => relative(ROOT, file);

/** The first import chain from `start` to a file that matches, not going past `stopAt` files. */
function chainTo(
  start: string,
  matches: (file: string) => boolean,
  stopAt: (file: string) => boolean,
): string[] | null {
  const seen = new Set<string>([start]);
  const queue: string[][] = [[start]];
  while (queue.length > 0) {
    const chain = queue.shift()!;
    for (const next of importsOf(chain[chain.length - 1])) {
      if (seen.has(next)) continue;
      seen.add(next);
      if (matches(next)) return [...chain, next];
      if (!stopAt(next)) queue.push([...chain, next]);
    }
  }
  return null;
}

const appFiles = walk(join(ROOT, "app"));
const serverEntries = appFiles.filter(
  (file) => /\/(page|layout|template|not-found|loading|error)\.tsx$/.test(file) && !isClient(file),
);
const clientFiles = [...appFiles, ...walk(join(ROOT, "components"))].filter(isClient);

const storeDependent = (file: string) => /from\s*["']@\/lib\/store["']/.test(read(file));
const readsFiles = (file: string) => /from\s*["']node:(fs|path)["']/.test(read(file));

describe("server pages and layouts", () => {
  it("are found", () => {
    expect(serverEntries.length).toBeGreaterThan(5);
  });

  it("never reach browser-only state (lib/store and what imports it) without a client component in between", () => {
    const broken = serverEntries.flatMap((entry) => {
      // a "use client" file is a boundary: what it imports is bundled for the browser
      const chain = chainTo(entry, (file) => !isClient(file) && storeDependent(file), isClient);
      return chain ? [chain.map(rel).join(" -> ")] : [];
    });
    expect(broken).toEqual([]);
  });
});

describe("client components", () => {
  it("never reach a module that reads files with node:fs", () => {
    const broken = clientFiles.flatMap((entry) => {
      const chain = chainTo(entry, readsFiles, () => false);
      return chain ? [chain.map(rel).join(" -> ")] : [];
    });
    expect(broken).toEqual([]);
  });

  it("(the guard works) a server page that imported lib/store would be found", () => {
    const store = join(ROOT, "lib/store.ts");
    expect(storeDependent(join(ROOT, "lib/session.ts"))).toBe(true);
    expect(storeDependent(store)).toBe(false);
    expect(
      chainTo(
        join(ROOT, "lib/practise.ts"),
        (f) => f === join(ROOT, "lib/store.ts"),
        () => false,
      ),
    ).not.toBeNull();
  });
});
