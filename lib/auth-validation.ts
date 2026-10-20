/** Form checks of the simulated account screens (DESIGN.md: Accounts). Pure. */

export const NAME_MIN = 2;

/** An email as it is stored and compared: trimmed and lower case. */
export const normaliseEmail = (email: string): string => email.trim().toLowerCase();

/** A simple format check: something, an @, something, a dot, a last part of two letters or more. */
export const isEmailFormat = (email: string): boolean =>
  /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(email.trim());

/** The message under the name field, or null when the name is fine. */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === "") return "Enter your full name.";
  if (trimmed.length < NAME_MIN) return `Your name needs at least ${NAME_MIN} characters.`;
  return null;
}

/** The message under the email field, or null when the email is fine. */
export function validateEmail(email: string): string | null {
  if (email.trim() === "") return "Enter your work email.";
  if (!isEmailFormat(email)) return "Enter a valid email, like name@company.com.";
  return null;
}

export const EXISTS_MESSAGE = "An account with this email already exists on this device.";
export const EXISTS_LINK = "Sign in instead.";
export const UNKNOWN_MESSAGE = "No account found on this device.";
export const UNKNOWN_LINK = "Create one.";
export const WRONG_CODE_MESSAGE = "That code is not correct. Check the code shown below.";
