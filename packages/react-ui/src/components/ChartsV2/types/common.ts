export interface LegendItem {
  key: string;
  label: string;
  color: string;
  icon?: React.ComponentType;
  percentage?: number;
}

export type XAxisTickVariant = "singleLine" | "multiLine";
