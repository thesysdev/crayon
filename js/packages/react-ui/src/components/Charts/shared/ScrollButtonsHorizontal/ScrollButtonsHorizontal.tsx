import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { IconButton } from "../../../IconButton";

interface ScrollButtonsHorizontalProps {
  dataWidth: number;
  effectiveWidth: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  isSideBarTooltipOpen: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export const ScrollButtonsHorizontal = React.memo(
  ({
    dataWidth,
    effectiveWidth,
    canScrollLeft,
    canScrollRight,
    isSideBarTooltipOpen,
    onScrollLeft,
    onScrollRight,
  }: ScrollButtonsHorizontalProps) => {
    if (dataWidth <= effectiveWidth) {
      return null;
    }

    return (
      <div className="crayon-chart-horizontal-scroll-buttons-container">
        <IconButton
          className={clsx(
            "crayon-chart-horizontal-scroll-button crayon-chart-horizontal-scroll-button--left",
            {
              "crayon-chart-horizontal-scroll-button--disabled": !canScrollLeft,
            },
          )}
          icon={<ChevronLeft />}
          variant="secondary"
          onClick={onScrollLeft}
          size="extra-small"
          disabled={!canScrollLeft}
        />

        <IconButton
          className={clsx(
            "crayon-chart-horizontal-scroll-button crayon-chart-horizontal-scroll-button--right",
            {
              "crayon-chart-horizontal-scroll-button--disabled": !canScrollRight,
              "crayon-chart-horizontal-scroll-button--SideBarTooltip": isSideBarTooltipOpen,
            },
          )}
          icon={<ChevronRight />}
          variant="secondary"
          size="extra-small"
          onClick={onScrollRight}
          disabled={!canScrollRight}
        />
      </div>
    );
  },
);

ScrollButtonsHorizontal.displayName = "ScrollButtonsHorizontal";
