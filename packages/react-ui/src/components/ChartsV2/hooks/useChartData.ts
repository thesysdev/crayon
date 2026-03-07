import React, { useCallback, useMemo, useState } from "react";

import { get2dChartConfig, getDataKeys, getLegendItems } from "../utils/dataUtils";
import { useChartPalette } from "../utils/paletteUtils";
import { useTransformedKeys } from "./useTransformedKeys";

import type { ChartData } from "../types";
import type { PaletteName } from "../utils/paletteUtils";

export interface UseChartDataParams<T extends ChartData> {
  data: T;
  categoryKey: keyof T[number];
  chartThemeName: PaletteName;
  customPalette?: string[];
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
}

export function useChartData<T extends ChartData>({
  data,
  categoryKey,
  chartThemeName,
  customPalette,
  icons,
}: UseChartDataParams<T>) {
  const catKey = String(categoryKey);
  const allDataKeys = useMemo(() => getDataKeys(data, catKey), [data, catKey]);

  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const dataKeys = useMemo(
    () => allDataKeys.filter((k) => !hiddenSeries.has(k)),
    [allDataKeys, hiddenSeries],
  );

  const colors = useChartPalette({
    chartThemeName,
    customPalette,
    themePaletteName: "defaultChartPalette",
    dataLength: allDataKeys.length,
  });

  const transformedKeys = useTransformedKeys(allDataKeys);

  const chartConfig = useMemo(
    () => get2dChartConfig(allDataKeys, colors, transformedKeys, undefined, icons),
    [allDataKeys, colors, transformedKeys, icons],
  );

  const colorMap = useMemo(() => {
    return allDataKeys.reduce(
      (map, key) => {
        map[key] = chartConfig[key]?.color ?? "#000";
        return map;
      },
      {} as Record<string, string>,
    );
  }, [allDataKeys, chartConfig]);

  const chartStyle = useMemo(() => {
    return allDataKeys.reduce(
      (styles, key) => {
        const transformedKey = transformedKeys[key];
        const color = chartConfig[key]?.color;
        return {
          ...styles,
          [`--color-${transformedKey}`]: color,
        };
      },
      {} as Record<string, string | undefined>,
    );
  }, [allDataKeys, transformedKeys, chartConfig]);

  const legendItems = useMemo(
    () => getLegendItems(allDataKeys, colors, icons),
    [allDataKeys, colors, icons],
  );

  const toggleSeries = useCallback(
    (key: string) => {
      setHiddenSeries((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (next.size < allDataKeys.length - 1) {
            next.add(key);
          }
        }
        return next;
      });
    },
    [allDataKeys.length],
  );

  return {
    catKey,
    allDataKeys,
    dataKeys,
    hiddenSeries,
    toggleSeries,
    colors,
    transformedKeys,
    chartConfig,
    colorMap,
    chartStyle,
    legendItems,
  };
}
