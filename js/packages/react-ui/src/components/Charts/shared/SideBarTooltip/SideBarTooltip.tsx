import { X } from "lucide-react";
import { IconButton } from "../../../IconButton";
import { useSideBarTooltip } from "../../context/SideBarTooltipContext";

const SideBarTooltip = () => {
  const { setIsSideBarTooltipOpen } = useSideBarTooltip();

  return (
    <div className="crayon-chart-side-bar-tooltip">
      <div className="crayon-chart-side-bar-tooltip-header">
        <div className="crayon-chart-side-bar-tooltip-title"></div>
        <IconButton
          icon={<X />}
          size="extra-small"
          onClick={() => setIsSideBarTooltipOpen(false)}
        />
      </div>
      <div className="crayon-chart-side-bar-tooltip-content">
        <div className="crayon-chart-side-bar-tooltip-content-item"></div>
      </div>
    </div>
  );
};

export { SideBarTooltip };
