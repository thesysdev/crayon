"use client";

import { Callout } from "@openuidev/react-ui";

export function Banner({
  tone,
  children,
}: {
  tone: "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  return (
    <div className="banner-slot">
      <Callout variant={tone} description={children} />
    </div>
  );
}
