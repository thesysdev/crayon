import clsx from "clsx";
import { useRef } from "react";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { useElementSize } from "../../hooks/useElementSize";
import { ShellStoreProvider } from "./store";

interface ContainerProps {
  children?: React.ReactNode;
  logoUrl: string;
  agentName: string;
}

export const Container = ({ children, logoUrl, agentName }: ContainerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useElementSize({ ref }) || {};
  const isMobile = width > 0 && width < 768;
  const isFullScreen = width > 768;
  const isTray = false;

  return (
    <ShellStoreProvider logoUrl={logoUrl} agentName={agentName}>
      <LayoutContextProvider isTray={isTray} isFullScreen={isFullScreen} isMobile={isMobile}>
        <div
          className={clsx("crayon-shell-container", { "crayon-shell-container--mobile": isMobile })}
          ref={ref}
        >
          {children}
        </div>
      </LayoutContextProvider>
    </ShellStoreProvider>
  );
};
