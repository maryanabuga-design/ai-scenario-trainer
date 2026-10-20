"use client";

import { CircleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { Button } from "@/components/Button/Button";
import { FormHeader } from "@/components/FormHeader/FormHeader";
import { Media3D } from "@/components/Media3D/Media3D";
import {
  CODE_LENGTH,
  DEMO_CODE,
  digitsFrom,
  formatCode,
  formatCountdown,
  resendRemaining,
} from "@/lib/auth-code";
import { WRONG_CODE_MESSAGE } from "@/lib/auth-validation";
import { heroSlotFiles } from "@/lib/media-frames";

const empty = () => Array.from({ length: CODE_LENGTH }, () => "");

/**
 * Verify (DESIGN.md: Accounts): the 80 by 80 slot, "Check your email", six single-digit boxes (typing
 * moves on, Backspace goes back, pasting six digits fills them, the sixth digit submits at once),
 * the demo card that ALWAYS shows the code with "Fill in code", the Resend countdown and the pinned
 * "Verify". No email is sent. The clock is a parameter so tests can control it.
 */
export function VerifyView({
  email,
  onVerify,
  onChangeEmail,
  now,
  initialWrong = false,
  initialDigits = "",
}: {
  email: string;
  /** Checks the code; true when it was correct (the caller then leaves the screen). */
  onVerify: (code: string) => boolean;
  onChangeEmail: () => void;
  now: () => number;
  /** Only for the screen review page: start with the wrong-code message showing. */
  initialWrong?: boolean;
  /** Only for the screen review page: start with these digits in the boxes. */
  initialDigits?: string;
}) {
  const [values, setValues] = useState(() => {
    const start = empty();
    [...digitsFrom(initialDigits)].forEach((digit, index) => {
      start[index] = digit;
    });
    return start;
  });
  const [wrong, setWrong] = useState(initialWrong);
  const [sentAt, setSentAt] = useState(() => now());
  const [tick, setTick] = useState(() => now());
  const [resent, setResent] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  // the first box has the focus when the screen opens (only here)
  useEffect(() => {
    boxes.current[0]?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick(now()), 1000);
    return () => clearInterval(timer);
  }, [now]);

  const remaining = resendRemaining(sentAt, tick);
  const complete = values.every((digit) => digit !== "");

  function submit(code: string) {
    if (onVerify(code)) return;
    setWrong(true);
    // the boxes keep their digits, selected, ready to be typed over
    boxes.current[0]?.focus();
    boxes.current[0]?.select();
  }

  function commit(next: string[]) {
    setValues(next);
    setWrong(false);
    if (next.every((digit) => digit !== "")) submit(next.join(""));
  }

  /** Puts digits into the boxes from `start` on (a paste of six digits always fills all of them). */
  function fill(start: number, digits: string) {
    const from = digits.length === CODE_LENGTH ? 0 : start;
    const next = [...values];
    [...digits].slice(0, CODE_LENGTH - from).forEach((digit, k) => {
      next[from + k] = digit;
    });
    boxes.current[Math.min(from + digits.length, CODE_LENGTH - 1)]?.focus();
    commit(next);
  }

  function onChange(index: number, text: string) {
    let digits = digitsFrom(text);
    // a digit typed into a box that already has one (the selection was lost): the new digit wins
    if (values[index] !== "" && digits.length === 2) digits = digits.replace(values[index], "");
    if (digits.length > 1) return fill(index, digits);
    // after a wrong code the first digit typed starts the code again: the other boxes are cleared
    const next = wrong && digits ? empty() : [...values];
    next[index] = digits;
    if (digits && index < CODE_LENGTH - 1) boxes.current[index + 1]?.focus();
    commit(next);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && values[index] === "" && index > 0) {
      event.preventDefault();
      const next = [...values];
      next[index - 1] = "";
      boxes.current[index - 1]?.focus();
      commit(next);
    } else if (event.key === "ArrowLeft" && index > 0) {
      boxes.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      boxes.current[index + 1]?.focus();
    }
  }

  function onPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    fill(index, digitsFrom(event.clipboardData.getData("text")));
  }

  function resend() {
    setSentAt(now());
    setTick(now());
    setResent(true);
    setValues(empty());
    setWrong(false);
    boxes.current[0]?.focus();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]">
      <FormHeader step={2} label="Back" onBack={onChangeEmail} />

      <div className="flex flex-col items-start gap-3">
        <Media3D variant="verify" src={heroSlotFiles.verify} priority />
        <h1 className="type-page-title">Check your email</h1>
        <p className="type-body text-text-secondary">
          We sent a 6-digit code to <span className="type-body-strong text-text">{email}</span>.
        </p>
        <div className="-mt-2 -ml-3">
          <Button variant="tertiary" onClick={onChangeEmail}>
            Change email
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="6-digit code" className="flex gap-2">
          {values.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                boxes.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              aria-invalid={wrong || undefined}
              aria-describedby={wrong ? "code-error" : undefined}
              value={digit}
              onChange={(event) => onChange(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={(event) => onPaste(index, event)}
              onFocus={(event) => event.target.select()}
              className={`type-card-title h-14 max-w-[52px] min-w-0 flex-1 rounded-[12px] border bg-card text-center text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary ${
                wrong ? "border-wrong" : digit ? "border-primary" : "border-selectable-stroke"
              }`}
            />
          ))}
        </div>
        <p id="code-error" role="alert" className="type-small flex items-start gap-1.5 text-wrong">
          {wrong && (
            <>
              <CircleAlert
                size={16}
                strokeWidth={2}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              <span>{WRONG_CODE_MESSAGE}</span>
            </>
          )}
        </p>
      </div>

      <div
        data-demo-code
        className="flex items-center justify-between gap-3 rounded-2xl bg-secondary-sand p-4"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <p className="type-small text-text-secondary">Demo: no email is sent</p>
          <p data-demo-code-value className="type-code">
            {formatCode(DEMO_CODE)}
          </p>
        </div>
        <Button
          variant="secondary"
          wide={false}
          snug
          compact
          onClick={() => commit(DEMO_CODE.split(""))}
        >
          Fill in code
        </Button>
      </div>

      <div className="flex flex-col items-start">
        <div className="flex flex-wrap items-center gap-x-1">
          <p className="type-small text-text-secondary">Did not get a code?</p>
          <Button variant="tertiary" onClick={resend} disabled={remaining > 0}>
            {remaining > 0 ? `Resend code (${formatCountdown(remaining)})` : "Resend code"}
          </Button>
        </div>
        <p role="status" className="type-small text-text-secondary">
          {resent ? "A new code was sent" : ""}
        </p>
      </div>

      <div className="mt-auto pt-2">
        <Button disabled={!complete} onClick={() => submit(values.join(""))}>
          Verify
        </Button>
      </div>
    </div>
  );
}
