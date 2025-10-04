import clsx from "clsx";
import { ChartWatermark } from "./ChartWatermark";

interface ChartExportFooterProps {
  className?: string;
}

export const ChartExportFooter = ({ className }: ChartExportFooterProps) => {
  return (
    <div className={clsx("crayon-chart-export-footer-container", className)}>
      <div className="crayon-chart-export-watermark-container">
        <ChartWatermark />
      </div>
    </div>
  );
};
