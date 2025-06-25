import React, { useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { IconButton } from "../../../IconButton";
import { useSideBarTooltip } from "../../context/SideBarTooltipContext";
import { tooltipNumberFormatter } from "../PortalTooltip/utils";

interface SideBarTooltipProps {
  height: number;
}

// Utility function for capitalizing strings
const capitalizeString = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const SideBarTooltip = React.memo(({ height }: SideBarTooltipProps) => {
  const { setIsSideBarTooltipOpen, data } = useSideBarTooltip();

  const handleClose = useCallback(() => {
    setIsSideBarTooltipOpen(false);
  }, [setIsSideBarTooltipOpen]);

  const processedValues = useMemo(() => {
    return data.values?.map((value, index) => ({
      ...value,
      capitalizedLabel: capitalizeString(value.label),
      isLast: index === data.values.length - 1,
    }));
  }, [data.values]);

  const title = data.title;

  return (
    <div className="crayon-chart-side-bar-tooltip" style={{ height: `${height}px` }}>
      <div className="crayon-chart-side-bar-tooltip-header">
        <div className="crayon-chart-side-bar-tooltip-title">{title}</div>
        <IconButton
          icon={<X />}
          size="extra-small"
          onClick={handleClose}
          className="crayon-chart-side-bar-tooltip-close-button"
        />
      </div>
      <div className="crayon-chart-side-bar-tooltip-content-item-separator" />
      <div className="crayon-chart-side-bar-tooltip-content" autoFocus>
        {processedValues?.map((value, index) => (
          <div key={index}>
            <div className="crayon-chart-side-bar-tooltip-content-item">
              <div
                className="crayon-chart-side-bar-tooltip-content-item-color"
                style={{ backgroundColor: value.color }}
              />
              <div className="crayon-chart-side-bar-tooltip-content-item-label">
                {value.capitalizedLabel}
              </div>
              <div className="crayon-chart-side-bar-tooltip-content-item-value">
                {tooltipNumberFormatter(value.value)}
              </div>
            </div>
            {!value.isLast && (
              <div className="crayon-chart-side-bar-tooltip-content-item-separator" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

SideBarTooltip.displayName = "SideBarTooltip";

export { SideBarTooltip };
