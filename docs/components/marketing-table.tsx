import type { ReactNode } from "react";
import styles from "./marketing-table.module.css";

export function MarketingTable({
  children,
  className,
  compact = false,
  edgeToEdgeMobile = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  edgeToEdgeMobile?: boolean;
}) {
  return (
    <div className={`${styles.scroller} ${edgeToEdgeMobile ? styles.edgeToEdgeMobile : ""}`}>
      <table className={`${styles.table} ${compact ? styles.compact : ""} ${className ?? ""}`}>
        {children}
      </table>
    </div>
  );
}
