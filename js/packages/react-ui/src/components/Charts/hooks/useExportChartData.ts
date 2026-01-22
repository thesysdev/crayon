import { useMemo } from "react";
import { usePrintContext } from "../../../context/PrintContext";
import { ExportChartData } from "../Charts";

export interface UseExportChartDataProps {
  type: ExportChartData["type"];
  data: any[];
  categoryKey?: string;
  dataKeys?: string[];
  colors: string[];
  legend?: boolean;
  xAxisLabel?: React.ReactNode;
  yAxisLabel?: React.ReactNode;
  extraOptions?: Omit<
    NonNullable<ExportChartData["options"]>,
    "chartColors" | "showLegend" | "catAxisTitle" | "valAxisTitle"
  >;
  // For specialized charts like scatter
  customDataTransform?: () => ExportChartData["data"];
}

export const useExportChartData = ({
  type,
  data,
  categoryKey,
  dataKeys,
  colors,
  legend,
  xAxisLabel,
  yAxisLabel,
  extraOptions,
  customDataTransform,
}: UseExportChartDataProps): string | undefined => {
  const printContext = usePrintContext();

  return useMemo(() => {
    if (!printContext) {
      return undefined;
    }

    const chartData = customDataTransform
      ? customDataTransform()
      : (dataKeys || []).map((key) => ({
          name: key,
          labels: data.map((item) => (categoryKey ? String(item[categoryKey]) : "")),
          values: data.map((item) => Number(item[key])),
        }));

    const exportData: ExportChartData = {
      type,
      data: chartData,
      options: {
        chartColors: colors,
        showLegend: legend,
        catAxisTitle: typeof xAxisLabel === "string" ? xAxisLabel : undefined,
        showCatAxisTitle: typeof xAxisLabel === "string",
        valAxisTitle: typeof yAxisLabel === "string" ? yAxisLabel : undefined,
        showValAxisTitle: typeof yAxisLabel === "string",
        ...extraOptions,
      },
    };

    return JSON.stringify(exportData);
  }, [
    type,
    data,
    dataKeys,
    categoryKey,
    colors,
    legend,
    xAxisLabel,
    yAxisLabel,
    extraOptions,
    customDataTransform,
    printContext,
  ]);
};
