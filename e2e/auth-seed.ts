/**
 * The signed-in demo account every test starts with (a student, "Maryana"). It is the migrated
 * account: it keeps the plain storage keys, so the tests that save progress under "ast.history.v1"
 * and the like still find it. The account tests start from an empty browser instead.
 */
export const DEMO_EMAIL = "maryana@example.com";

export function authValue(role: "student" | "instructor" = "student", onboardingDone = true) {
  return JSON.stringify({
    schema: 6,
    content: "seed",
    value: {
      accounts: [
        { name: "Maryana", email: DEMO_EMAIL, role, createdAt: 1, onboardingDone, legacy: true },
      ],
      session: { email: DEMO_EMAIL },
      pending: null,
    },
  });
}

export const signedInStudent = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("student") }],
    },
  ],
};

/** An empty browser: a new visitor, signed out. */
export const emptyBrowser = { cookies: [], origins: [] };

/** A signed-in account that has not seen the onboarding yet. */
export const newAccount = (role: "student" | "instructor" = "student") => ({
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue(role, false) }],
    },
  ],
});
