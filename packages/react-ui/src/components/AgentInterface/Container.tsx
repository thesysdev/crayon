import clsx from "clsx";
import { useRef } from "react";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { useElementSize } from "../../hooks/useElementSize";
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
      <LayoutContextProvider layout={layout}>
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
      </LayoutContextProvider>
    </AgentInterfaceStoreProvider>
  );
};
