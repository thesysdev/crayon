interface BottomNavTab {
  id: string;
  label: string;
}

interface BottomNavProps {
  tabs: BottomNavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

import styles from "./BottomNav.module.css";

export default function BottomNav({ tabs, activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`${styles.button}${isActive ? ` ${styles.buttonActive}` : ""}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
