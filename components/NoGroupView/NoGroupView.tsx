"use client";

import { UsersRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { CODE_NOT_FOUND } from "@/components/GroupCodeView/GroupCodeView";
import { IconTile } from "@/components/IconTile/IconTile";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { TextField } from "@/components/TextField/TextField";
import { normaliseCode } from "@/lib/join";

/**
 * The student home of a student with no group (DESIGN.md: Invitation-only entry): the greeting and
 * one white card: a round icon tile, "You are not in a group yet", the muted line and the field
 * "Group code" with the Primary "Join group" (it opens the Invitation, where the person confirms).
 * No topics, no exams.
 */
export function NoGroupView({
  name,
  onJoin,
  initialError = false,
}: {
  name: string;
  /** Looks the code up; "unknown" shows the message. */
  onJoin: (code: string) => "ok" | "unknown";
  initialError?: boolean;
}) {
  const [code, setCode] = useState("");
  const [unknown, setUnknown] = useState(initialError);

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = normaliseCode(code);
    setUnknown(clean === "" ? true : onJoin(clean) === "unknown");
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <header className="flex items-center gap-3 pt-1">
        <ProfileAvatar />
        <h1 className="type-page-title min-w-0 flex-1 truncate">Hi, {name}</h1>
      </header>
      <form
        noValidate
        onSubmit={submit}
        data-no-group
        className="flex flex-col gap-4 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] shadow-(--card-shadow)"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <IconTile size="default">
            <UsersRound size={28} strokeWidth={1.75} />
          </IconTile>
          <h2 className="type-item-title">You are not in a group yet</h2>
          <p className="type-body text-text-secondary">
            Ask your instructor for a group link or code.
          </p>
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
        <Button type="submit">Join group</Button>
      </form>
    </div>
  );
}
