"use client";

import { CircleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { CODE_LENGTH, DEMO_CODE, digitsFrom, formatCode, resendRemaining } from "@/lib/auth-code";
import { WRONG_CODE_MESSAGE } from "@/lib/auth-validation";

const empty = () => Array.from({ length: CODE_LENGTH }, () => "");

/**
 * Verify: "Check your email", six single-digit boxes (typing moves on, Backspace goes back, pasting
 * six digits fills them, the sixth digit submits at once) and a card that ALWAYS shows the demo code,
 * because no email is sent. "Resend code" waits 30 seconds with a visible countdown; the clock is a
 * parameter so tests can control it.
 */
export function VerifyView({
  email,
  onVerify,
  onChangeEmail,
  now,
  initialWrong = false,
}: {
  email: string;
  /** Checks the code; true when it was correct (the caller then leaves the screen). */
  onVerify: (code: string) => boolean;
  onChangeEmail: () => void;
  now: () => number;
  /** Only for the screen review page: start with the wrong-code message showing. */
  initialWrong?: boolean;
}) {
  const [values, setValues] = useState(empty);
  const [wrong, setWrong] = useState(initialWrong);
  const [sentAt, setSentAt] = useState(() => now());
  const [tick, setTick] = useState(() => now());
  const [resent, setResent] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTick(now()), 1000);
    return () => clearInterval(timer);
  }, [now]);

  const remaining = resendRemaining(sentAt, tick);

  function commit(next: string[]) {
    setValues(next);
    setWrong(false);
    if (next.every((digit) => digit !== "")) {
      if (!onVerify(next.join(""))) {
        setWrong(true);
        boxes.current[CODE_LENGTH - 1]?.focus();
      }
    }
  }

  /** Puts digits into the boxes from `start` on (a paste of six digits always fills all of them). */
  function fill(start: number, digits: string) {
    const from = digits.length === CODE_LENGTH ? 0 : start;
    const next = [...values];
    [...digits].slice(0, CODE_LENGTH - from).forEach((digit, k) => {
      next[from + k] = digit;
    });
    commit(next);
    boxes.current[Math.min(from + digits.length, CODE_LENGTH - 1)]?.focus();
  }

  function onChange(index: number, text: string) {
    const digits = digitsFrom(text);
    if (digits.length > 1) return fill(index, digits);
    const next = [...values];
    next[index] = digits;
    commit(next);
    if (digits && index < CODE_LENGTH - 1) boxes.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && values[index] === "" && index > 0) {
      event.preventDefault();
      const next = [...values];
      next[index - 1] = "";
      commit(next);
      boxes.current[index - 1]?.focus();
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
      <CircleBackButton label="Back" onClick={onChangeEmail} />
      <div className="flex flex-col gap-2">
        <h1 className="type-page-title">Check your email</h1>
        <p className="type-body text-text-secondary">
          We sent a 6-digit code to <span className="type-body-strong text-text">{email}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="6-digit code" className="flex justify-between gap-2">
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
              autoFocus={index === 0}
              onChange={(event) => onChange(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={(event) => onPaste(index, event)}
              onFocus={(event) => event.target.select()}
              className={`type-card-title h-14 min-w-0 flex-1 rounded-[14px] border bg-card text-center text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                wrong ? "border-wrong" : "border-selectable-stroke"
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

      <div data-demo-code className="rounded-card bg-card p-4 shadow-(--card-shadow)">
        <p className="type-body">
          Demo: no email is sent. Your code is{" "}
          <span className="type-body-strong">{formatCode(DEMO_CODE)}</span>.
        </p>
      </div>

      <div className="flex flex-col items-start gap-1">
        <div className="-ml-3">
          <Button variant="tertiary" onClick={resend} disabled={remaining > 0}>
            {remaining > 0 ? `Resend code in ${remaining} s` : "Resend code"}
          </Button>
        </div>
        <p role="status" className="type-small text-text-secondary">
          {resent ? "A new code was sent" : ""}
        </p>
      </div>

      <div className="mt-auto -ml-3 self-start">
        <Button variant="tertiary" onClick={onChangeEmail}>
          Change email
        </Button>
      </div>
    </div>
  );
}
