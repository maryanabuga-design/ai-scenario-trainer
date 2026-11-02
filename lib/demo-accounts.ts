import demo from "@/content/demo-accounts.json";
import { normaliseEmail } from "@/lib/auth-validation";

/**
 * The simulated sign-in directory (DESIGN.md: Sign-in rules, wording and demo accounts). In the
 * product the list of allowed emails lives on the server: a code is sent only to an account that
 * exists and is active. Here three demo emails stand for the cases; matching ignores case and
 * surrounding spaces.
 */
export type DemoAccount =
  | { status: "active"; email: string; name: string; groupId: string | null }
  | { status: "inactive"; email: string; name: string };

const accounts = demo.accounts as (DemoAccount & { groupId?: string | null })[];

/** The demo account of an email, or undefined for any other (unknown) email. */
export const lookupDemoAccount = (email: string): DemoAccount | undefined =>
  accounts.find((entry) => entry.email === normaliseEmail(email));

/** The demo emails, for the review page. */
export const demoAccounts = accounts;
