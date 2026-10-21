"use client";

import { ChevronDown } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { ExamCard } from "@/components/InstructorExams/ExamCard";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { DEMO_NOTE, groupCounts } from "@/lib/cohort";
import type { Attempt, Participant } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import { isActive, splitExams } from "@/lib/group-exams";

export const EXAMS_EMPTY = "No exams yet. Assign the first exam to your group.";

/**
 * The Exams tab of the Instructor (DESIGN.md: Instructor, Exams): the band, the Primary "Assign exam",
 * the ACTIVE cards, and at the end the toggle "Show closed exams (n)" with the CLOSED group (the
 * pattern of Progress's "Other topics").
 */
export function InstructorExamsView({
  exams,
  people,
  attempts,
  now,
  initiallyOpen = false,
}: {
  exams: GroupExam[];
  people: Participant[];
  attempts: Attempt[];
  now: number;
  /** Only for the screen review page: the closed exams start open. */
  initiallyOpen?: boolean;
}) {
  const { active, closed } = splitExams(exams, now);
  const [open, setOpen] = useState(initiallyOpen);
  const wrapper = useRef<HTMLDivElement>(null);

  const card = (exam: GroupExam) => {
    const counts = groupCounts(people, exam, { attempts, active: isActive(exam, now) });
    return (
      <li key={exam.id}>
        <ExamCard exam={exam} passed={counts.certified} total={counts.total} />
      </li>
    );
  };

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    // Safari does not focus a button on click: keep the focus on the toggle
    event.currentTarget.focus();
    const closing = open;
    setOpen(!open);
    if (!closing) return;
    window.setTimeout(() => {
      wrapper.current?.querySelector("button")?.scrollIntoView({ block: "nearest" });
    }, 220);
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand title="Exams" subtitle="Assign exams to Group A" action={<ProfileAvatar />} />
      <ButtonLink href="/instructor/exams/new">Assign exam</ButtonLink>

      {exams.length === 0 ? (
        <EmptyState icon={ClipboardList} text={EXAMS_EMPTY} />
      ) : (
        <>
          {active.length > 0 && (
            <section aria-labelledby="active-title" className="flex flex-col gap-3">
              <h2 id="active-title" className="type-label text-text-secondary">
                ACTIVE
              </h2>
              <ul className="flex flex-col gap-3">{active.map(card)}</ul>
            </section>
          )}
          {closed.length > 0 && (
            <div ref={wrapper} className="flex flex-col">
              <div
                id="closed-exams"
                inert={!open}
                className={`grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none ${open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}
              >
                <div className="min-h-0 overflow-hidden">
                  <section aria-labelledby="closed-title" className="flex flex-col gap-3 pb-3">
                    <h2 id="closed-title" className="type-label text-text-secondary">
                      CLOSED
                    </h2>
                    <ul className="flex flex-col gap-3">{closed.map(card)}</ul>
                  </section>
                </div>
              </div>
              <div className="-ml-3 self-start">
                <Button
                  variant="tertiary"
                  aria-expanded={open}
                  aria-controls="closed-exams"
                  onClick={toggle}
                  trailing={
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                    />
                  }
                >
                  {open ? "Hide closed exams" : `Show closed exams (${closed.length})`}
                </Button>
              </div>
            </div>
          )}
          <p data-demo-note className="type-small text-center text-text-secondary">
            {DEMO_NOTE}
          </p>
        </>
      )}
    </div>
  );
}
