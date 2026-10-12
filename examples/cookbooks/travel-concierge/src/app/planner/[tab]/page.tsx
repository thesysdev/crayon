import { notFound } from "next/navigation";
import PlannerPage, { metadata } from "../page";

// The planner's tabs as their own addresses (/planner/explore, /planner/chat,
// /planner/itinerary), so a tab and its trip can be shared. The page is the planner itself; it
// reads the tab and the ?trip= from the address and keeps them in step as you switch.

export { metadata };

const tabs = ["explore", "chat", "itinerary"];

export function generateStaticParams() {
  return tabs.map((tab) => ({ tab }));
}

export default async function PlannerTab({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!tabs.includes(tab)) notFound();
  return <PlannerPage />;
}
