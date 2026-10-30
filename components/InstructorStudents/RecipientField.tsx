"use client";

import { X } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { Amber } from "@/components/InstructorContent/Amber";
import { InitialsAvatar } from "@/components/InitialsAvatar/InitialsAvatar";
import { fieldBox } from "@/components/InstructorStudents/CopyField";
import { isEmailFormat, normaliseEmail } from "@/lib/auth-validation";
import { suggest } from "@/lib/invite-suggestions";

/** A person who will get an invitation: the address, and the name when it came from a suggestion. */
export type Recipient = { email: string; name?: string };

/** "Alina Kovalenko" gives "AK". */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const EMAIL_ERROR = "Check this email address.";
export const EMAILS_ERROR = "Check these email addresses.";
export const EMPTY_HELP = "Type a name or email. You can add several people.";
export const countHelp = (count: number) =>
  count === 1 ? "1 person will get an invitation." : `${count} people will get an invitation.`;

/**
 * INVITE BY EMAIL (DESIGN.md: Invite students): a combobox in the field style. Typing a name or an
 * email lists up to five SIMULATED suggestions under the field; a chosen person or a valid typed
 * address becomes a tag inside the field. Enter, comma or a space after a valid address (or leaving
 * the field) adds it; pasting several addresses adds several tags. An invalid address shows an error
 * and is not added; duplicates and addresses already invited are ignored.
 */
export function RecipientField({
  recipients,
  invited,
  onChange,
  initialText = "",
  initialError = "",
}: {
  recipients: Recipient[];
  /** The addresses already invited to this group (never added again). */
  invited: string[];
  onChange: (recipients: Recipient[]) => void;
  /** Only for the screen review page: the typed text and an error already showing. */
  initialText?: string;
  initialError?: string;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initialText);
  const [active, setActive] = useState(-1);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState(initialError);
  const [note, setNote] = useState("");

  const taken = [...recipients.map((entry) => entry.email), ...invited];
  const options = suggest(text, taken);
  const open = !closed && options.length > 0;
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const setOpen = (value: boolean) => setClosed(!value);

  /** Adds the people that are new; returns the list and reports when something was skipped. */
  function add(people: Recipient[]) {
    const next = [...recipients];
    let skipped = false;
    for (const person of people) {
      if (next.some((entry) => entry.email === person.email)) continue;
      if (invited.includes(person.email)) {
        skipped = true;
        continue;
      }
      next.push(person);
    }
    setNote(skipped ? "Addresses that are already invited were left out." : "");
    onChange(next);
  }

  function reset() {
    setText("");
    setActive(-1);
    setClosed(false);
  }

  /** Turns the typed text into tags: valid addresses are added, the rest shows the error. */
  function commit(raw: string) {
    const words = raw.split(/[\s,;]+/).filter((word) => word !== "");
    if (words.length === 0) return;
    const good: Recipient[] = [];
    let bad = 0;
    for (const word of words) {
      const email = normaliseEmail(word);
      if (isEmailFormat(email)) good.push({ email });
      else bad += 1;
    }
    if (good.length > 0) add(good);
    if (bad > 0) {
      setError(bad === 1 ? EMAIL_ERROR : EMAILS_ERROR);
      setText(words.filter((word) => !isEmailFormat(normaliseEmail(word))).join(" "));
    } else {
      setError("");
      reset();
    }
  }

  function choose(index: number) {
    const person = options[index];
    if (!person) return;
    add([{ email: person.email, name: person.name }]);
    setError("");
    reset();
    input.current?.focus();
  }

  function remove(email: string) {
    setNote("");
    onChange(recipients.filter((entry) => entry.email !== email));
    input.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (options.length === 0) return;
      event.preventDefault();
      if (closed) setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && active >= 0) choose(active);
      else commit(text);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setActive(-1);
    } else if (event.key === "," || event.key === ";") {
      event.preventDefault();
      commit(text);
    } else if (event.key === " " && isEmailFormat(normaliseEmail(text))) {
      event.preventDefault();
      commit(text);
    } else if (event.key === "Backspace" && text === "" && recipients.length > 0) {
      remove(recipients[recipients.length - 1].email);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!/[\s,;]/.test(pasted.trim())) return;
    event.preventDefault();
    commit(`${text} ${pasted}`);
  }

  const help = recipients.length === 0 ? EMPTY_HELP : countHelp(recipients.length);
  return (
    <section className="relative flex flex-col gap-2">
      <h2 id={`${id}-label`} className="type-label text-text-secondary">
        INVITE BY EMAIL
      </h2>
      <div
        ref={box}
        data-recipient-field
        onBlur={(event) => {
          if (box.current?.contains(event.relatedTarget as Node | null)) return;
          setOpen(false);
          if (text.trim() !== "") commit(text);
        }}
        onClick={() => input.current?.focus()}
        className={`${fieldBox} flex flex-wrap items-center gap-2 px-4 py-[7px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-0 has-[:focus-visible]:outline-primary`}
      >
        {recipients.map((person) => (
          <span
            key={person.email}
            data-tag={person.email}
            className="type-small flex h-8 max-w-full items-center rounded-full bg-secondary-sand pl-3 text-text"
          >
            <span className="min-w-0 truncate">{person.name ?? person.email}</span>
            <button
              type="button"
              aria-label={`Remove ${person.name ?? person.email}`}
              onClick={(event) => {
                event.stopPropagation();
                remove(person.email);
              }}
              className="-my-1.5 flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary"
            >
              <X size={14} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          ref={input}
          aria-labelledby={`${id}-label`}
          name="emails"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-describedby={`${id}-help`}
          aria-invalid={error !== "" || undefined}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={text}
          placeholder={recipients.length === 0 ? "Name or email" : ""}
          onChange={(event) => {
            setText(event.target.value);
            setActive(-1);
            setError("");
            setNote("");
            setClosed(false);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="h-9 min-w-[8rem] flex-1 bg-transparent placeholder:text-text-secondary focus-visible:outline-none!"
        />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggested people"
          data-suggestions
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 scroll-mb-44 overflow-y-auto rounded-2xl border border-selectable-stroke bg-card py-1 shadow-(--card-shadow)"
        >
          {options.map((person, index) => (
            <li
              key={person.email}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              data-suggestion={person.email}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 ${
                index === active ? "bg-secondary-sand" : ""
              }`}
            >
              <InitialsAvatar initials={initialsOf(person.name)} size={32} image={person.image} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body-strong truncate">{person.name}</span>
                <span className="type-small truncate text-text-secondary">{person.email}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div aria-live="polite" data-recipient-live className="flex flex-col gap-2">
        <p id={`${id}-help`} data-recipient-help className="type-small text-text-secondary">
          {help}
        </p>
        {error !== "" && <Amber>{error}</Amber>}
        {note !== "" && (
          <p data-duplicates className="type-small text-text-secondary">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
