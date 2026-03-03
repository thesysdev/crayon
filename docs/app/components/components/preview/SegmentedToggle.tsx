"use client";

import type { CSSProperties } from "react";
import styles from "./SegmentedToggle.module.css";

export interface SegmentedToggleOption<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

interface SegmentedToggleProps<T extends string> {
  ariaLabel: string;
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedToggle<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  const rootStyle = { "--segment-count": options.length } as CSSProperties;

  return (
    <div className={styles.root} style={rootStyle} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
            onClick={() => onChange(option.value)}
            disabled={option.disabled}
            role="tab"
            aria-selected={isSelected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
