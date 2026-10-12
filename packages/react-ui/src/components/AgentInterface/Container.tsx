import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { useElementSize } from "../../hooks/useElementSize";
import { ShellStoreProvider } from "../_shared/store";
import { useIsomorphicLayoutEffect } from "../Charts/hooks/core/useIsomorphicLayoutEffect";
import { AgentInterfaceStoreProvider, useAgentInterfaceStore } from "./_shared/store";
import { AmbientLoader } from "./components/AmbientLoader";

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
            <ContainerSurface surfaceRef={ref} isMobile={isMobile} className={className}>
              {children}
            </ContainerSurface>
          </Tooltip.Provider>
        </LayoutContextProvider>
      </ShellStoreProvider>
    </AgentInterfaceStoreProvider>
  );
};

const SETTLING_ATTRIBUTE = "data-openui-settling";
/** Keep in step with the loader fade in agentInterface.scss. */
const LOADER_FADE_MS = 200;

/**
 * The interface's surface. Its contents stay hidden, under a loader that then
 * fades out, until the saved preferences are restored (just after hydration,
 * before paint), so a server-rendered page never shows the defaults and then
 * switches. `visibility` (not `display`) keeps the layout measurable while
 * hidden.
 */
const ContainerSurface = ({
  surfaceRef,
  isMobile,
  className,
  children,
}: {
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  className?: string;
  children?: React.ReactNode;
}) => {
  const isRestoring = useAgentInterfaceStore((state) => !state.isHydrated);
  // The loader outlives the restore by its fade-out, then unmounts.
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    if (isRestoring) return;
    const id = setTimeout(() => setShowLoader(false), LOADER_FADE_MS);
    return () => clearTimeout(id);
  }, [isRestoring]);

  // Transitions stay off until the restored state has settled. The server
  // HTML was already styled with the defaults, so applying the saved state
  // would otherwise animate (e.g. the sidebar growing open). Set on the DOM
  // node directly so hydration never sees it.
  useIsomorphicLayoutEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    if (isRestoring) {
      el.setAttribute(SETTLING_ATTRIBUTE, "");
      return;
    }
    // After the restore's follow-up renders: take the final styles with
    // transitions still off, then turn them back on.
    const id = setTimeout(() => {
      void el.offsetWidth;
      el.removeAttribute(SETTLING_ATTRIBUTE);
    }, 0);
    return () => clearTimeout(id);
  }, [isRestoring]);

  return (
    <div
      className={clsx(
        "openui-agent-container",
        {
          "openui-agent-container--mobile": isMobile,
          "openui-agent-container--restoring": isRestoring,
        },
        className,
      )}
      ref={surfaceRef}
    >
      {children}
      {showLoader && (
        <div
          className={clsx("openui-agent-container__restore-loader", {
            "openui-agent-container__restore-loader--exiting": !isRestoring,
          })}
          aria-hidden={!isRestoring || undefined}
        >
          <AmbientLoader label="" />
        </div>
      )}
    </div>
  );
};
