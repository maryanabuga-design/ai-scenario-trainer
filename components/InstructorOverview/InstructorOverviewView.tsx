"use client";

import { GroupSwitcher } from "@/components/GroupSwitcher/GroupSwitcher";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import {
  ActionsCard,
  ExamsCard,
  GetStartedCard,
  GroupsCard,
  ReadinessCard,
  WeakestCard,
} from "@/components/InstructorOverview/OverviewBlocks";
import { DEMO_NOTE } from "@/lib/cohort";
import { ALL_GROUPS, scopeSubtitle } from "@/lib/groups";
import type { OverviewModel } from "@/lib/overview-model";

export { NO_ACTIVE_EXAM } from "@/components/InstructorOverview/OverviewBlocks";

/** The address of Assign exam with the weakest topic chosen (the title is prefilled from it). */
export const assignOnTopicHref = (topicId: string) =>
  `/instructor/exams/new?topic=${topicId}&from=overview`;

/**
 * The Instructor Overview (DESIGN.md: Instructor, Overview rebuilt from the approved reference):
 * the avatar header and the group switcher, then READINESS (or GROUPS in All groups), NEEDS YOUR
 * ACTION, EXAMS and WEAKEST TOPIC, or the Get started card for an empty group. At most one
 * Primary button on the screen and one percentage.
 */
export function InstructorOverviewView({
  name,
  model,
  topicTitle,
  onSelectGroup,
  switcherOpen = false,
}: {
  name: string;
  model: OverviewModel;
  topicTitle: (id: string) => string;
  /** Selects a group or "all" (the dropdown, the GROUPS card and the rows of All groups). */
  onSelectGroup: (id: string) => void;
  /** For the review page: the group dropdown drawn open. */
  switcherOpen?: boolean;
}) {
  const { scope, steps, weakest } = model;
  return (
    <div className="flex flex-col gap-6 pb-4">
      <header className="flex flex-col gap-1 pt-1">
        <div className="flex items-center gap-3">
          <ProfileAvatar />
          <h1 className="type-page-title min-w-0 flex-1 truncate">Hi, {name}</h1>
        </div>
        <p data-subtitle className="type-body text-text-secondary">
          {scopeSubtitle(scope)}
        </p>
        <GroupSwitcher
          scope={scope}
          rows={model.switcher}
          onSelect={onSelectGroup}
          initiallyOpen={switcherOpen}
        />
      </header>

      {steps ? (
        <GetStartedCard steps={steps} />
      ) : (
        <>
          {scope === ALL_GROUPS ? (
            <GroupsCard rows={model.groupRows} onSelect={onSelectGroup} />
          ) : (
            <ReadinessCard
              scope={scope}
              readiness={model.readiness}
              lastWeek={model.lastWeek}
              students={model.students}
              notStarted={model.notStarted}
            />
          )}
          <ActionsCard actions={model.actions} onSelect={onSelectGroup} />
          <ExamsCard rows={model.examRows} activeCount={model.activeCount} />
          {weakest && (
            <WeakestCard
              weakest={weakest}
              title={topicTitle(weakest.sectionId)}
              href={assignOnTopicHref(weakest.sectionId)}
              students={model.students}
            />
          )}
        </>
      )}

      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}
