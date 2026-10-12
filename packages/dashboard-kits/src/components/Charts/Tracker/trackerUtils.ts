import type { TrackerItem } from "../../../core/schemas";

/** Status names as the legend and tooltips read them. */
export const TRACKER_STATUS_LABEL: Record<TrackerItem["status"], string> = {
  good: "Met target",
  warn: "Just under",
  bad: "Missed",
  none: "No data",
};

const ORDER: TrackerItem["status"][] = ["good", "warn", "bad", "none"];

/** How many blocks have each status, in legend order, leaving out statuses with none. */
export function statusCounts(items: TrackerItem[]) {
  return ORDER.map((status) => ({
    status,
    label: TRACKER_STATUS_LABEL[status],
    count: items.filter((item) => item.status === status).length,
  })).filter((entry) => entry.count > 0);
}
