import { ChartWatermark } from "./ChartWatermark";

export const ChartExportFooter = () => {
  return (
    <div className="crayon-chart-export-footer-container">
      <div className="crayon-chart-export-watermark-container">
        <ChartWatermark />
      </div>
    </div>
  );
};
