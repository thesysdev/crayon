import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

export interface AgentInterfaceTooltipProps {
  children: ReactElement;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const AgentInterfaceTooltip = ({
  children,
  content,
  side = "bottom",
  align = "center",
  sideOffset = 8,
}: AgentInterfaceTooltipProps) => (
  // Provider is hoisted once into <Container> so delay/skip-delay are shared.
  <Tooltip.Root>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content
        className="openui-agent-tooltip"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        {content}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);
