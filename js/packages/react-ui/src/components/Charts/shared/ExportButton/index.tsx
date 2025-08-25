import { Download } from "lucide-react";
import { IconButton } from "../../../IconButton";
import { useExportContext } from "../../ExportContext";

interface ExportButtonProps {
  exportChart: () => void;
}

export const ExportButton = ({ exportChart }: ExportButtonProps) => {
  const exportContext = useExportContext();

  return (
    <div className="crayon-chart-export-button-container">
      <IconButton
        variant="tertiary"
        icon={<Download />}
        onClick={(e) => {
          if (exportContext) {
            e.preventDefault();
            return;
          }
          exportChart();
        }}
      />
    </div>
  );
};
