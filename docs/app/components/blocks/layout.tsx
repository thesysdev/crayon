"use client";

import SideNav from "@components/components/SideNav";
import { BLOCKS_NAV_ITEMS } from "@components/config/navigation";
import type { ReactNode } from "react";
import styles from "./layout.module.css";

interface BlocksLayoutProps {
  children: ReactNode;
}

export default function BlocksLayout({ children }: BlocksLayoutProps) {
  return (
    <div className={styles.blocksLayout}>
      <SideNav sections={BLOCKS_NAV_ITEMS} />
      <div className={styles.blocksContent}>{children}</div>
    </div>
  );
}
