import clsx from "clsx";
import { PanelLeft, PanelRight } from "lucide-react";
import { useEffect } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { IconButton } from "../IconButton";
import { useShellStore } from "./store";

export const SidebarContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { isSidebarOpen, setIsSidebarOpen, isArtifactActive } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
    isArtifactActive: state.isArtifactActive,
  }));
  const { layout } = useLayoutContext() || {};
  const isMobile = layout === "mobile";

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
          className={clsx("openui-shell-sidebar-container__overlay", {
            "openui-shell-sidebar-container__overlay--collapsed": !isSidebarOpen,
          })}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
        />
      )}
      <div
        className={clsx(
          "openui-shell-sidebar-container",
          {
            "openui-shell-sidebar-container--collapsed": !isSidebarOpen,
            "openui-shell-sidebar-container--hidden": isArtifactActive && !isMobile,
          },
          className,
        )}
      >
        {children}
      </div>
    </>
  );
};

export const SidebarHeader = ({ className }: { className?: string }) => {
  const { agentName, logoUrl, setIsSidebarOpen, isSidebarOpen } = useShellStore((state) => ({
    agentName: state.agentName,
    logoUrl: state.logoUrl,
    setIsSidebarOpen: state.setIsSidebarOpen,
    isSidebarOpen: state.isSidebarOpen,
  }));

  return (
    <div className={clsx("openui-shell-sidebar-header", className)}>
      <img src={logoUrl} alt={agentName} className="openui-shell-sidebar-header__logo" />
      <div className="openui-shell-sidebar-header__agent-name">{agentName}</div>
      <IconButton
        icon={isSidebarOpen ? <PanelRight size="1em" /> : <PanelLeft size="1em" />}
        onClick={() => {
          setIsSidebarOpen(!isSidebarOpen);
        }}
        size="large"
        variant="secondary"
        className="openui-shell-sidebar-header__toggle-button"
      />
    </div>
  );
};

export const SidebarContent = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { isSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));

  return (
    <div
      className={clsx("openui-shell-sidebar-content", className, {
        "openui-shell-sidebar-content--collapsed": !isSidebarOpen,
      })}
    >
      {children}
    </div>
  );
};

export const SidebarSeparator = () => {
  return <div className="openui-shell-sidebar-separator" />;
};
