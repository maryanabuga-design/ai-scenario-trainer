"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ENTRY_PICTURES, EntryPicture } from "@/components/EntryPicture/EntryPicture";
import { TextField } from "@/components/TextField/TextField";
import { normaliseCode } from "@/lib/join";

export const CODE_NOT_FOUND = "We could not find this code. Check it or ask your instructor.";

/**
 * Group code (DESIGN.md: Invitation-only entry): "Join a group", one field "Group code" (typed in
 * upper case, spaces removed when it is sent), the Primary "Continue" and the Secondary "Back". A
 * known code opens the Invitation; an unknown one shows the message in a live region.
 */
export function GroupCodeView({
  onContinue,
  backHref,
  initialCode = "",
  initialError = false,
}: {
  /** Looks the code up; "unknown" shows the message, anything else leaves the screen. */
  onContinue: (code: string) => "ok" | "unknown";
  backHref: string;
  initialCode?: string;
  /** Only for the screen review page: start with the message showing. */
  initialError?: boolean;
}) {
  const [code, setCode] = useState(initialCode);
  const [unknown, setUnknown] = useState(initialError);
  const form = useRef<HTMLFormElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = normaliseCode(code);
    if (clean === "") {
      setUnknown(true);
      return;
    }
    setUnknown(onContinue(clean) === "unknown");
  }

  return (
    <form
      ref={form}
      noValidate
      onSubmit={submit}
      className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col gap-2 pt-2 text-center">
        <EntryPicture src={ENTRY_PICTURES.group} />
        <h1 className="type-page-title">Join a group</h1>
        <p className="type-body text-text-secondary">Enter the code your instructor gave you.</p>
      </div>
      <TextField
        label="Group code"
        name="group-code"
        value={code}
        onChange={(next) => {
          setUnknown(false);
          setCode(next.toUpperCase());
        }}
        error={unknown ? CODE_NOT_FOUND : null}
        autoComplete="off"
      />
      <div className="mt-auto flex flex-col gap-3 pt-2">
        <Button type="submit">Continue</Button>
        <ButtonLink variant="secondary" href={backHref}>
          Back
        </ButtonLink>
      </div>
    </form>
  );
}
