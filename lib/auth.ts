import { useEffect, useMemo } from "react";
import { isCorrectCode } from "@/lib/auth-code";
import { MIGRATED_EMAIL, MIGRATED_NAME } from "@/lib/demo-account";
import { cleanField } from "@/lib/field-of-work";
import type { FieldOfWork } from "@/lib/field-of-work";
import { isEmailFormat, normaliseEmail } from "@/lib/auth-validation";
import { ROLES, roleHome } from "@/lib/role";
import type { Role } from "@/lib/role";
import { clearNamespaceData, createStore, setStorageNamespace } from "@/lib/store";

/**
 * The simulated account system (DESIGN.md: Accounts). CLIENT ONLY by the server/client rule: it is
 * saved in this browser. There is no server and no email; the verification code is a constant.
 */
export type Account = {
  name: string;
  /** Trimmed and lower case. */
  email: string;
  role: Role;
  createdAt: number;
  /** The onboarding was finished or skipped (a new account sees it once, right after verification). */
  onboardingDone: boolean;
  /** The field of work (DESIGN.md: Field of work); null: not set. It only tunes the simulated Ask AI. */
  field: FieldOfWork | null;
  /** The registration step "Field of work" was shown (and left with Continue or Skip). */
  fieldStepDone: boolean;
  /** The account made from data the app already had: it keeps the old device keys (no suffix). */
  legacy?: boolean;
};

export type Pending = {
  mode: "sign-up" | "sign-in";
  email: string;
  name: string;
  role: Role;
};

export type AuthState = {
  accounts: Account[];
  session: { email: string } | null;
  pending: Pending | null;
};

export const emptyAuth = (): AuthState => ({ accounts: [], session: null, pending: null });

export { MIGRATED_EMAIL, MIGRATED_NAME };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as string[]).includes(value);

function cleanAccount(value: unknown): Account | null {
  if (!isObject(value)) return null;
  const { name, email, role, createdAt, legacy, onboardingDone, field, fieldStepDone } = value;
  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof email !== "string" || !isEmailFormat(email)) return null;
  if (!isRole(role)) return null;
  return {
    name: name.trim(),
    email: normaliseEmail(email),
    role,
    createdAt: typeof createdAt === "number" && Number.isFinite(createdAt) ? createdAt : 0,
    // an account saved before the flag existed counts as done: it never sees the onboarding again
    onboardingDone: onboardingDone !== false,
    field: cleanField(field),
    // an account from before the step existed never sees it
    fieldStepDone: fieldStepDone !== false,
    ...(legacy === true && { legacy: true }),
  };
}

function cleanPending(value: unknown): Pending | null {
  if (!isObject(value)) return null;
  const { mode, email, name, role } = value;
  if (mode !== "sign-up" && mode !== "sign-in") return null;
  if (typeof email !== "string" || !isEmailFormat(email)) return null;
  return {
    mode,
    email: normaliseEmail(email),
    name: typeof name === "string" ? name : "",
    role: isRole(role) ? role : "student",
  };
}

/**
 * The valid auth data of whatever was read: a broken account is ignored, a session for an unknown
 * account is dropped. Anything that is not an object reads as nothing (signed out, no crash).
 */
export function cleanAuth(value: unknown): AuthState | null {
  if (!isObject(value)) return null;
  const accounts: Account[] = [];
  for (const entry of Array.isArray(value.accounts) ? value.accounts : []) {
    const account = cleanAccount(entry);
    if (account && !accounts.some((other) => other.email === account.email)) accounts.push(account);
  }
  const session =
    isObject(value.session) && typeof value.session.email === "string"
      ? { email: normaliseEmail(value.session.email) }
      : null;
  return {
    accounts,
    session: session && accounts.some((a) => a.email === session.email) ? session : null,
    pending: cleanPending(value.pending),
  };
}

export const accountFor = (state: AuthState, email: string): Account | undefined =>
  state.accounts.find((account) => account.email === normaliseEmail(email));

/** The signed-in account, or null when signed out. */
export const currentAccount = (state: AuthState): Account | null =>
  state.session ? (accountFor(state, state.session.email) ?? null) : null;

/**
 * The account made from what the app held before accounts: the old role (a broken one reads as
 * student), signed in at once. Null for a browser with no app data (it starts at Welcome).
 */
export function migrateLegacy(
  rawRole: string | null,
  hasProfile: boolean,
  now: number,
): AuthState | null {
  if (rawRole === null && !hasProfile) return null;
  let role: Role = "student";
  try {
    const saved: unknown = rawRole === null ? null : JSON.parse(rawRole);
    const inner = isObject(saved) && "value" in saved ? saved.value : saved;
    if (isObject(inner) && isRole(inner.role)) role = inner.role;
  } catch {
    // a broken old value reads as a student
  }
  return {
    accounts: [
      {
        name: MIGRATED_NAME,
        email: MIGRATED_EMAIL,
        role,
        createdAt: now,
        onboardingDone: true,
        field: null,
        fieldStepDone: true,
        legacy: true,
      },
    ],
    session: { email: MIGRATED_EMAIL },
    pending: null,
  };
}

/** The key suffix of an account's data: the old device keys for the migrated account. */
export const namespaceFor = (account: Account | null): string =>
  account ? (account.legacy ? "" : `:${account.email}`) : ":signed-out";

// ---- the steps, as pure functions of the state ----

export type StartResult = "ok" | "exists" | "unknown";

/** Sign up: an email that already has an account is refused (no duplicate). */
export function beginSignUp(
  state: AuthState,
  input: { name: string; email: string; role: Role },
): { state: AuthState; result: StartResult } {
  const email = normaliseEmail(input.email);
  if (accountFor(state, email)) return { state, result: "exists" };
  const pending: Pending = { mode: "sign-up", email, name: input.name.trim(), role: input.role };
  return { state: { ...state, pending }, result: "ok" };
}

/** Sign in: an unknown email is refused. */
export function beginSignIn(
  state: AuthState,
  emailInput: string,
): { state: AuthState; result: StartResult } {
  const account = accountFor(state, emailInput);
  if (!account) return { state, result: "unknown" };
  const pending: Pending = {
    mode: "sign-in",
    email: account.email,
    name: account.name,
    role: account.role,
  };
  return { state: { ...state, pending }, result: "ok" };
}

export type VerifyResult =
  | { state: AuthState; result: "ok"; account: Account }
  | { state: AuthState; result: "wrong" | "none" };

/** A correct code signs the person in (creating the account first when it is a sign-up). */
export function completeVerification(state: AuthState, code: string, now: number): VerifyResult {
  const { pending } = state;
  if (!pending) return { state, result: "none" };
  if (!isCorrectCode(code)) return { state, result: "wrong" };
  let accounts = state.accounts;
  let account = accountFor(state, pending.email);
  if (pending.mode === "sign-up" && !account) {
    account = {
      name: pending.name,
      email: pending.email,
      role: pending.role,
      createdAt: now,
      onboardingDone: false,
      field: null,
      fieldStepDone: pending.role !== "student",
    };
    accounts = [...accounts, account];
  }
  if (!account) return { state, result: "none" };
  return {
    state: { accounts, session: { email: account.email }, pending: null },
    result: "ok",
    account,
  };
}

/** Sign out clears the session only: no data is deleted. */
export const signOutState = (state: AuthState): AuthState => ({
  ...state,
  session: null,
  pending: null,
});

function updateCurrent(
  state: AuthState,
  change: Partial<Pick<Account, "name" | "role" | "onboardingDone" | "field" | "fieldStepDone">>,
) {
  const current = currentAccount(state);
  if (!current) return state;
  return {
    ...state,
    accounts: state.accounts.map((account) =>
      account.email === current.email ? { ...account, ...change } : account,
    ),
  };
}

export const renameState = (state: AuthState, name: string): AuthState =>
  name.trim().length < 2 ? state : updateCurrent(state, { name: name.trim() });

export const setRoleState = (state: AuthState, role: Role): AuthState =>
  updateCurrent(state, { role });

/** The onboarding was finished or skipped. */
export const finishOnboardingState = (state: AuthState): AuthState =>
  updateCurrent(state, { onboardingDone: true });

/** The field of work of the signed-in account (null clears it). */
export const setFieldState = (state: AuthState, field: FieldOfWork | null): AuthState =>
  updateCurrent(state, { field });

/** The registration step was left with Continue (a field) or Skip (null). */
export const finishFieldStepState = (state: AuthState, field: FieldOfWork | null): AuthState =>
  updateCurrent(state, { field, fieldStepDone: true });

/** The state without the current account and without the session. */
export function deleteCurrentState(state: AuthState): AuthState {
  const current = currentAccount(state);
  if (!current) return state;
  return {
    accounts: state.accounts.filter((account) => account.email !== current.email),
    session: null,
    pending: null,
  };
}

/** Where a person goes after a correct code: the onboarding until it was done, then the Home of the role. */
export const homeAfterVerification = (account: Account): string =>
  account.onboardingDone
    ? roleHome(account.role)
    : account.role === "student" && !account.fieldStepDone
      ? "/field-of-work"
      : "/onboarding";

// ---- the saved state ----

const store = createStore<AuthState>("ast.auth.v1", { shared: true, sanitize: cleanAuth });

const readRaw = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** The saved state, cleaned every time (the store only cleans a value saved for other content). */
const readState = (): AuthState | null => cleanAuth(store.read());

/** The data of the signed-in account is the data every other store reads and writes. */
function syncNamespace(state: AuthState | null) {
  setStorageNamespace(namespaceFor(state ? currentAccount(state) : null));
}

function save(state: AuthState) {
  store.write(state);
  syncNamespace(state);
}

// Before anything is drawn, point every store at the signed-in account's data.
if (typeof window !== "undefined") syncNamespace(readState());

/** The first load: the demo account for people who already used the app, otherwise nothing. */
function initialise() {
  if (readState()) return;
  const migrated = migrateLegacy(
    readRaw("ast.role.v1"),
    readRaw("ast.profile.v1") !== null,
    Date.now(),
  );
  save(migrated ?? emptyAuth());
  if (migrated) {
    try {
      window.localStorage.removeItem("ast.role.v1");
    } catch {
      // nothing to remove
    }
  }
}

/** The auth state, "loading" until the browser has been read; the first visit initialises it. */
export function useAuth(): AuthState | "loading" {
  const stored = store.useValue();
  const state = useMemo(() => (stored === "loading" ? "loading" : cleanAuth(stored)), [stored]);
  useEffect(() => {
    if (state === null) initialise();
  }, [state]);
  return state === null ? "loading" : state;
}

/** The signed-in account: null when signed out, "loading" until read. */
export function useCurrentAccount(): Account | null | "loading" {
  const state = useAuth();
  return useMemo(() => (state === "loading" ? "loading" : currentAccount(state)), [state]);
}

/** The field of work of the signed-in account ("loading" until read; null when not set). */
export function useField(): FieldOfWork | null | "loading" {
  const account = useCurrentAccount();
  return account === "loading" ? "loading" : (account?.field ?? null);
}

/** The role of the signed-in account ("loading" until read; a student when signed out). */
export function useRole(): Role | "loading" {
  const account = useCurrentAccount();
  return account === "loading" ? "loading" : (account?.role ?? "student");
}

export const readAuth = (): AuthState => readState() ?? emptyAuth();

export function startSignUp(input: { name: string; email: string; role: Role }): StartResult {
  const { state, result } = beginSignUp(readAuth(), input);
  if (result === "ok") save(state);
  return result;
}

export function startSignIn(email: string): StartResult {
  const { state, result } = beginSignIn(readAuth(), email);
  if (result === "ok") save(state);
  return result;
}

/** Checks the code of the pending verification; a correct one signs in and returns where to go. */
export function verifyCode(code: string): { ok: true; destination: string } | { ok: false } {
  const outcome = completeVerification(readAuth(), code, Date.now());
  if (outcome.result !== "ok") return { ok: false };
  save(outcome.state);
  return { ok: true, destination: homeAfterVerification(outcome.account) };
}

export function signOut() {
  save(signOutState(readAuth()));
}

export function renameAccount(name: string) {
  save(renameState(readAuth(), name));
}

/** The one place a role is set: Demo mode now, registration chooses it too. */
export function setRole(role: Role) {
  save(setRoleState(readAuth(), role));
}

/** Marks the onboarding as done for the signed-in account (Skip or Get started). */
export function finishOnboarding() {
  save(finishOnboardingState(readAuth()));
}

/** Sets or clears the field of work (Profile). */
export function setField(field: FieldOfWork | null) {
  save(setFieldState(readAuth(), field));
}

/** The registration step is done: Continue stores the field, Skip stores null. */
export function finishFieldStep(field: FieldOfWork | null) {
  save(finishFieldStepState(readAuth(), field));
}

/** Deletes the signed-in account and the data stored for it on this device. */
export function deleteAccount() {
  const state = readAuth();
  const current = currentAccount(state);
  if (!current) return;
  clearNamespaceData(namespaceFor(current));
  save(deleteCurrentState(state));
}
