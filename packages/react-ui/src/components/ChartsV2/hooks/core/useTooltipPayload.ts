import { useMemo } from "react";
import type { TooltipItem } from "../../shared/PortalTooltip/ChartTooltip";
import type { ChartData } from "../../types";

export interface TooltipPayload {
  label: string;
  items: TooltipItem[];
}

export function useTooltipPayload<T extends ChartData>(
  hoveredIndex: number | null,
  data: T,
  dataKeys: string[],
  catKey: string,
  chartConfig: Record<string, { color?: string } | undefined>,
): TooltipPayload | null {
  return useMemo(() => {
    if (hoveredIndex === null || hoveredIndex >= data.length) return null;
    const row = data[hoveredIndex]!;
    return {
      label: String(row[catKey]),
      items: dataKeys.map((key) => ({
        name: key,
        value: Number(row[key]) || 0,
        color: chartConfig[key]?.color ?? "#000",
      })),
    };
  }, [hoveredIndex, data, dataKeys, catKey, chartConfig]);
}
