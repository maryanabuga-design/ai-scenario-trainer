import { Check, CircleAlert, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Chip } from "@/components/Chip/Chip";
import type { ChipInk, ChipTone } from "@/components/Chip/Chip";

export type Status = "ready" | "processing" | "failed";

const icons = { check: Check, clock: Clock, alert: CircleAlert } satisfies Record<
  string,
  LucideIcon
>;

export const statuses: Record<
  Status,
  { label: string; icon: keyof typeof icons; tone: ChipTone; ink?: ChipInk }
> = {
  ready: { label: "Ready", icon: "check", tone: "olive" },
  processing: { label: "Processing", icon: "clock", tone: "sand" },
  failed: { label: "Failed", icon: "alert", tone: "stone" },
};

export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const Icon = icons[statuses[status].icon];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}

/**
 * The one status chip (material status), drawn by the shared Chip. Icon + label + colour. Never
 * colour alone.
 */
export function StatusChip({ status }: { status: Status }) {
  const { label, tone, ink } = statuses[status];
  return (
    <Chip tone={tone} ink={ink} size="caption">
      <StatusIcon status={status} />
      {label}
    </Chip>
  );
}
