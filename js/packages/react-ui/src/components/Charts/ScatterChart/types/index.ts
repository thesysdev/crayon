export interface ScatterPoint {
  x: number;
  y: number;
  z?: number;
  [key: string]: string | number | undefined;
}

export interface ScatterDataset {
  name: string;
  data: ScatterPoint[];
}

export type ScatterChartData = ScatterDataset[];

