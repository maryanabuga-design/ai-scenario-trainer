import { useMemo } from "react";
import { cleanCertificates, withCertificate } from "@/lib/certificates";
import type { Certificate } from "@/lib/certificates";
import { createStore } from "@/lib/store";

/** The certificates of the signed-in account (a key per account, like every stored value). */
const store = createStore<Certificate[]>("ast.certificates.v1", { sanitize: cleanCertificates });

/** The certificates, newest first; "loading" until the browser has been read. */
export function useCertificates(): Certificate[] | "loading" {
  const raw = store.useValue();
  return useMemo(() => (raw === "loading" ? "loading" : (cleanCertificates(raw) ?? [])), [raw]);
}

export const readCertificates = (): Certificate[] => cleanCertificates(store.read()) ?? [];

/** Records the certificate of a finished exam attempt when it passed. Returns it, or null. */
export function recordCertificate(input: {
  accountId: string;
  examTitle: string;
  correct: number;
  total: number;
  attemptAt: number;
  now: number;
}): Certificate | null {
  const before = readCertificates();
  const next = withCertificate(before, input);
  if (next === before) return before.find((c) => c.attemptAt === input.attemptAt) ?? null;
  store.write(next);
  return next[0];
}
