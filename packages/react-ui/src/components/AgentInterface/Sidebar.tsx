import { useActiveDetailedView } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";
import { useEffect } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { IconButton } from "../IconButton";
import { useAgentInterfaceStore } from "./_shared/store";

export const SidebarContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { isSidebarOpen, setIsSidebarOpen } = useAgentInterfaceStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { isDetailedViewActive } = useActiveDetailedView();
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
          className={clsx("openui-agent-sidebar-container__overlay", {
            "openui-agent-sidebar-container__overlay--collapsed": !isSidebarOpen,
          })}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
        />
      )}
      <div
        className={clsx(
          "openui-agent-sidebar-container",
          {
            "openui-agent-sidebar-container--collapsed": !isSidebarOpen,
            "openui-agent-sidebar-container--hidden": isDetailedViewActive && !isMobile,
          },
          className,
        )}
      >
        {children}
      </div>
    </>
  );
};

export interface SidebarHeaderProps {
  className?: string;
  logo?: React.ReactNode;
  agentName?: React.ReactNode;
  collapseButton?: React.ReactNode | false;
  children?: React.ReactNode;
}

export const SidebarHeader = ({
  className,
  logo,
  agentName: agentNameProp,
  collapseButton,
  children,
}: SidebarHeaderProps) => {
  const { agentName: ctxAgentName, logoUrl, setIsSidebarOpen, isSidebarOpen } = useAgentInterfaceStore(
    (state) => ({
      agentName: state.agentName,
      logoUrl: state.logoUrl,
      setIsSidebarOpen: state.setIsSidebarOpen,
      isSidebarOpen: state.isSidebarOpen,
    }),
  );

  if (children != null) {
    if (
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] !== "production" &&
      (logo !== undefined || agentNameProp !== undefined || collapseButton !== undefined)
    ) {
      console.warn(
        "[AgentInterface] <AgentInterface.SidebarHeader> received both children and override props; children win.",
      );
    }
    return (
      <div
        className={clsx(
          "openui-agent-sidebar-header",
          { "openui-agent-sidebar-header--collapsed": !isSidebarOpen },
          className,
        )}
      >
        {children}
      </div>
    );
  }

  const defaultLogo = (
    <img src={logoUrl} alt={ctxAgentName} className="openui-agent-sidebar-header__logo" />
  );
  const defaultAgentName = (
    <div className="openui-agent-sidebar-header__agent-name">{ctxAgentName}</div>
  );
  const defaultCollapseButton = (
    <IconButton
      icon={isSidebarOpen ? <ArrowLeftFromLine size="1em" /> : <ArrowRightFromLine size="1em" />}
      onClick={() => {
        setIsSidebarOpen(!isSidebarOpen);
      }}
      size="small"
      variant="secondary"
      aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      className="openui-agent-sidebar-header__toggle-button"
    />
  );

  return (
    <div
      className={clsx(
        "openui-agent-sidebar-header",
        { "openui-agent-sidebar-header--collapsed": !isSidebarOpen },
        className,
      )}
    >
      <div className="openui-agent-sidebar-header__top-row">
        {logo ?? defaultLogo}
        {agentNameProp ?? defaultAgentName}
        {collapseButton === false ? null : (collapseButton ?? defaultCollapseButton)}
      </div>
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
  const { isSidebarOpen } = useAgentInterfaceStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));

  return (
    <div
      className={clsx("openui-agent-sidebar-content", className, {
        "openui-agent-sidebar-content--collapsed": !isSidebarOpen,
      })}
    >
      {children}
    </div>
  );
};

export const SidebarSeparator = () => {
  return <div className="openui-agent-sidebar-separator" />;
};
