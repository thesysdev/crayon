import type { ReactNode } from "react";

interface SimpleCardProps {
  children: ReactNode;
  className?: string;
}

export function SimpleCard({ children, className }: SimpleCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
