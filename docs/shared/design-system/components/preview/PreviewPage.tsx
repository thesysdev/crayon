import type { ReactNode } from "react";
import styles from "./PreviewLayout.module.css";

interface PreviewPageProps {
  children: ReactNode;
}

export default function PreviewPage({ children }: PreviewPageProps) {
  return <main className={styles.main}>{children}</main>;
}
