import type { Series } from "d3-shape";
import { stack, stackOffsetNone, stackOrderNone } from "d3-shape";
import { useMemo } from "react";
import type { ChartData } from "../types";

export type StackedData = Series<Record<string, string | number>, string>[];

export const useStackedData = (
  data: ChartData,
  dataKeys: string[],
  stacked: boolean,
): StackedData | null => {
  return useMemo(() => {
    if (!stacked || dataKeys.length === 0) return null;

    const stackGenerator = stack<Record<string, string | number>>()
      .keys(dataKeys)
      .order(stackOrderNone)
      .offset(stackOffsetNone);

    return stackGenerator(data as Iterable<{ [key: string]: number }>);
  }, [data, dataKeys, stacked]);
};
