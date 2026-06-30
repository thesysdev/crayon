import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

export interface SidebarTooltipProps {
  children: ReactElement;
  content: ReactNode;
  disabled?: boolean;
}

export const SidebarTooltip = ({ children, content, disabled = false }: SidebarTooltipProps) => {
  if (disabled) return children;

  // Provider is hoisted once into <Container> so delay/skip-delay are shared.
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="openui-agent-sidebar-tooltip"
          side="right"
          align="center"
          sideOffset={8}
        >
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};
