"use client";

import { ChevronDown, CirclePlus } from "lucide-react";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ExamCard } from "@/components/InstructorExams/ExamCard";
import { Media3D } from "@/components/Media3D/Media3D";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { groupCounts } from "@/lib/cohort";
import type { Attempt, Participant } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import { splitExams } from "@/lib/group-exams";
import { examPeople } from "@/lib/groups";
import { cardPictureFiles } from "@/lib/media-frames";

export const EXAMS_SUBTITLE = "Assign exams and see who has passed.";
export const EXAMS_EMPTY_TITLE = "No exams yet";
export const EXAMS_EMPTY = "Assign the first exam to your group.";
export const EXAMS_EMPTY_NOTE = "Exams check how well your group knows the topics you choose.";

/**
 * The Exams tab of the Instructor (DESIGN.md: Instructor, Exams rebuilt): the band with the subtitle and the avatar, the Primary "Assign exam" with a plus icon, "ACTIVE" and the active cards,
 * and the toggle "Show closed exams (n)" with the "CLOSED" cards. Exams of every group are listed. Empty: one card with the picture,
 * the words and the Primary button (which is then not repeated above).
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

  const card = (exam: GroupExam, isClosed: boolean) => {
    const counts = groupCounts(examPeople(people, exam), exam, { attempts, now });
    return (
      <li key={exam.id}>
        <ExamCard
          exam={exam}
          passed={counts.passed}
          total={counts.total}
          now={now}
          closed={isClosed}
        />
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
      <PageHeaderBand
        title="Exams"
        subtitle={<span className="text-text-secondary">{EXAMS_SUBTITLE}</span>}
        action={<ProfileAvatar />}
      />

      {exams.length === 0 ? (
        <div
          data-exams-empty
          className="flex flex-col items-center gap-4 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] text-center shadow-(--card-shadow)"
        >
          <Media3D variant="verify" src={cardPictureFiles.examCard} />
          <div className="flex flex-col gap-1">
            <h2 className="type-card-title">{EXAMS_EMPTY_TITLE}</h2>
            <p className="text-text-secondary">{EXAMS_EMPTY}</p>
          </div>
          <ButtonLink href="/instructor/exams/new" icon={CirclePlus}>
            Assign exam
          </ButtonLink>
          <p className="type-small w-full rounded-[14px] bg-secondary-sand p-3 text-text-secondary">
            {EXAMS_EMPTY_NOTE}
          </p>
        </div>
      ) : (
        <>
          <ButtonLink href="/instructor/exams/new" icon={CirclePlus}>
            Assign exam
          </ButtonLink>
          {active.length > 0 && (
            <section aria-labelledby="active-title" className="flex flex-col gap-3">
              <h2 id="active-title" className="type-label text-text-secondary">
                ACTIVE
              </h2>
              <ul className="flex flex-col gap-3">{active.map((exam) => card(exam, false))}</ul>
            </section>
          )}
          {closed.length > 0 && (
            <div ref={wrapper} className="flex flex-col gap-3">
              <Button
                variant="secondary"
                aria-expanded={open}
                aria-controls="closed-exams"
                onClick={toggle}
                trailing={
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                  />
                }
              >
                {open ? "Hide closed exams" : `Show closed exams (${closed.length})`}
              </Button>
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
                    <ul className="flex flex-col gap-3">
                      {closed.map((exam) => card(exam, true))}
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
