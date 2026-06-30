import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { useRef } from "react";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { useElementSize } from "../../hooks/useElementSize";
import { ShellStoreProvider } from "../_shared/store";
import { AgentInterfaceStoreProvider } from "./_shared/store";

interface ContainerProps {
  children?: React.ReactNode;
  logoUrl: string;
  agentName: string;
  className?: string;
}

export const Container = ({ children, logoUrl, agentName, className }: ContainerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize({ ref }) || {};
  // TODO: revisit this logic
  const isMobile = width > 0 && width < 768;
  const isFullScreen = width > 768;
  const layout = isMobile ? "mobile" : isFullScreen ? "fullscreen" : "tray";

  return (
    <AgentInterfaceStoreProvider logoUrl={logoUrl} agentName={agentName}>
      {/* Provide the shell store too: assistant-message components read
          agentName/logoUrl/showAssistantLogo from it, so a real provider must
          exist here (instead of falling back to defaults). */}
      <ShellStoreProvider logoUrl={logoUrl} agentName={agentName}>
        <LayoutContextProvider layout={layout}>
          {/* Single shared Tooltip.Provider for the whole interface so hover-open
              delay and skip-delay behavior are shared across all tooltips
              (instead of each tooltip mounting its own provider). */}
          <Tooltip.Provider delayDuration={250}>
            <div
              className={clsx(
                "openui-agent-container",
                {
                  "openui-agent-container--mobile": isMobile,
                },
                className,
              )}
              ref={ref}
            >
              {children}
            </div>
          </Tooltip.Provider>
        </LayoutContextProvider>
      </ShellStoreProvider>
    </AgentInterfaceStoreProvider>
  );
};
