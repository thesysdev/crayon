import { useCallback, useMemo, useState } from "react";

import type { ChartData, LegendItem } from "../../types";
import type { PaletteName } from "../../utils/paletteUtils";
import { useChartPalette } from "../../utils/paletteUtils";
import { sortByValueDescending } from "../../utils/polarUtils";

export interface CategoricalSlice {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface UseCategoricalChartDataParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  chartThemeName: PaletteName;
  customPalette?: string[];
  format?: "number" | "percentage";
}

export function useCategoricalChartData<T extends ChartData>({
  data,
  categoryKey,
  dataKey,
  chartThemeName,
  customPalette,
  format = "number",
}: UseCategoricalChartDataParams<T>) {
  const catKey = String(categoryKey);
  const valKey = String(dataKey);

  const sortedData = useMemo(() => sortByValueDescending(data, valKey), [data, valKey]);

  const [hiddenSlices, setHiddenSlices] = useState<Set<string>>(new Set());

  const colors = useChartPalette({
    chartThemeName,
    customPalette,
    themePaletteName: "defaultChartPalette",
    dataLength: sortedData.length,
  });

  const total = useMemo(
    () =>
      sortedData.reduce((sum, row) => {
        if (hiddenSlices.has(String(row[catKey]))) return sum;
        return sum + (Number(row[valKey]) || 0);
      }, 0),
    [sortedData, catKey, valKey, hiddenSlices],
  );

  const slices: CategoricalSlice[] = useMemo(
    () =>
      sortedData.map((row, i) => {
        const value = Number(row[valKey]) || 0;
        return {
          label: String(row[catKey]),
          value,
          color: colors[i] ?? "#000",
          percentage: total > 0 ? (value / total) * 100 : 0,
        };
      }),
    [sortedData, catKey, valKey, colors, total],
  );

  const toggleSlice = useCallback(
    (key: string) => {
      setHiddenSlices((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (next.size < sortedData.length - 1) {
            next.add(key);
          }
        }
        return next;
      });
    },
    [sortedData.length],
  );

  const legendItems: LegendItem[] = useMemo(
    () =>
      slices.map((s) => ({
        key: s.label,
        label: s.label,
        color: s.color,
        percentage: format === "percentage" ? s.percentage : undefined,
      })),
    [slices, format],
  );

  const chartStyle = useMemo(() => {
    return slices.reduce(
      (styles, s, i) => ({
        ...styles,
        [`--slice-color-${i}`]: s.color,
      }),
      {} as Record<string, string>,
    );
  }, [slices]);

  return {
    catKey,
    valKey,
    sortedData,
    slices,
    total,
    hiddenSlices,
    toggleSlice,
    legendItems,
    chartStyle,
  };
}
