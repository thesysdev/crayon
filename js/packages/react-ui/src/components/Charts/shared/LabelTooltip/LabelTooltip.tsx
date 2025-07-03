import * as Tooltip from "@radix-ui/react-tooltip";
import React from "react";

interface LabelTooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}

interface LabelTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
}

const LabelTooltipProvider = React.forwardRef<HTMLDivElement, LabelTooltipProviderProps>(
  (props, ref) => {
    const {
      children,
      delayDuration = 300,
      skipDelayDuration = 300,
      disableHoverableContent = false,
    } = props;

    return (
      <Tooltip.Provider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
        disableHoverableContent={disableHoverableContent}
      >
        {children}
      </Tooltip.Provider>
    );
  },
);

LabelTooltipProvider.displayName = "LabelTooltipProvider";

const LabelTooltip = React.forwardRef<HTMLDivElement, LabelTooltipProps>((props, ref) => {
  const {
    children,
    content,
    side = "top",
    sideOffset = 1,
    delayDuration = 300,
    className = "crayon-chart-label-tooltip",
  } = props;

  return (
    <Tooltip.Root delayDuration={delayDuration}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content ref={ref} className={className} side={side} sideOffset={sideOffset}>
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});

LabelTooltip.displayName = "LabelTooltip";

export { LabelTooltip, LabelTooltipProvider };
export type { LabelTooltipProps, LabelTooltipProviderProps };
