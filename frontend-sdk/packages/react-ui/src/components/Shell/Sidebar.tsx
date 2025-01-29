import clsx from "clsx";
import { PanelLeft, PanelRight } from "lucide-react";
import { useEffect } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { IconButton } from "../IconButton";
import { useShellStore } from "./store";

export const SidebarContainer = ({ children }: { children?: React.ReactNode }) => {
  const { isSidebarOpen, setIsSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { isMobile } = useLayoutContext() || {};

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <>
      {isMobile && (
        <div
          className={clsx("crayon-shell-sidebar-container__overlay", {
            "crayon-shell-sidebar-container__overlay--collapsed": !isSidebarOpen,
          })}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
        />
      )}
      <div
        className={clsx("crayon-shell-sidebar-container", {
          "crayon-shell-sidebar-container--collapsed": !isSidebarOpen,
        })}
      >
        {children}
      </div>
    </>
  );
};

export const SidebarHeader = () => {
  const { agentName, logoUrl, setIsSidebarOpen, isSidebarOpen } = useShellStore((state) => ({
    agentName: state.agentName,
    logoUrl: state.logoUrl,
    setIsSidebarOpen: state.setIsSidebarOpen,
    isSidebarOpen: state.isSidebarOpen,
  }));

  return (
    <div className="crayon-shell-sidebar-header">
      <img src={logoUrl} alt={agentName} className="crayon-shell-sidebar-header__logo" />
      <div className="crayon-shell-sidebar-header__agent-name">{agentName}</div>
      <IconButton
        icon={isSidebarOpen ? <PanelRight size="1em" /> : <PanelLeft size="1em" />}
        onClick={() => {
          setIsSidebarOpen(!isSidebarOpen);
        }}
        size="large"
        variant="secondary"
        className="crayon-shell-sidebar-header__toggle-button"
      />
    </div>
  );
};

export const SidebarContent = ({ children }: { children?: React.ReactNode }) => {
  const { isSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));

  if (!isSidebarOpen) {
    return null;
  }

  return <div className="crayon-shell-sidebar-content">{children}</div>;
};

export const SidebarSeparator = () => {
  return <div className="crayon-shell-sidebar-separator" />;
};
