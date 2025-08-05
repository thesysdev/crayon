export type ScatterChartData = Array<Record<string, string | number>>;

export interface ScatterPoint {
  x: number;
  y: number;
  z?: number;
  [key: string]: string | number | undefined;
}

export type ScatterDataset = {
  name: string;
  data: ScatterPoint[];
  color?: string;
};
