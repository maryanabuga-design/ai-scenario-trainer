import { namespaceFor } from "@/lib/auth";
import type { Account } from "@/lib/auth";
import { cleanHistory } from "@/lib/saved-data";
import type { FinishedSession } from "@/lib/session";

/**
 * The history of a local account, read from the browser (CLIENT ONLY): the Instructor's Students
 * screens show the real progress of the accounts of this browser. A broken value reads as nothing.
 */
export function readHistoryOf(
  account: Pick<Account, "email" | "legacy">,
): FinishedSession[] | null {
  try {
    const raw = window.localStorage.getItem(`ast.history.v1${namespaceFor(account as Account)}`);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { value?: unknown };
    return cleanHistory(saved.value);
  } catch {
    return null;
  }
}

/** The histories of all the local accounts, by email. */
export function readHistories(
  accounts: Pick<Account, "email" | "legacy">[],
): Record<string, FinishedSession[] | null> {
  return Object.fromEntries(accounts.map((account) => [account.email, readHistoryOf(account)]));
}
