export interface LegendItem {
  key: string;
  label: string;
  color: string;
  icon?: React.ComponentType;
}

export interface StackedLegendItem {
  key: string;
  label: string;
  value: number;
  color: string;
}
