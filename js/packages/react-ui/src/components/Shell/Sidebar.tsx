import clsx from "clsx";
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";
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
          className={clsx("crayon-shell-sidebar-container__overlay", {
            "crayon-shell-sidebar-container__overlay--collapsed": !isSidebarOpen,
          })}
          onClick={() => {
            setIsSidebarOpen(false);
          }}
        />
      )}
      <div
        className={clsx(
          "crayon-shell-sidebar-container",
          {
            "crayon-shell-sidebar-container--collapsed": !isSidebarOpen,
            "crayon-shell-sidebar-container--hidden": isArtifactActive && !isMobile,
          },
          className,
        )}
      >
        {children}
      </div>
    </>
  );
};

export const SidebarHeader = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const { agentName, logoUrl, setIsSidebarOpen, isSidebarOpen } = useShellStore((state) => ({
    agentName: state.agentName,
    logoUrl: state.logoUrl,
    setIsSidebarOpen: state.setIsSidebarOpen,
    isSidebarOpen: state.isSidebarOpen,
  }));

  return (
    <div
      className={clsx(
        "crayon-shell-sidebar-header",
        { "crayon-shell-sidebar-header--collapsed": !isSidebarOpen },
        className,
      )}
    >
      <div className="crayon-shell-sidebar-header__top-row">
        <img src={logoUrl} alt={agentName} className="crayon-shell-sidebar-header__logo" />
        <div className="crayon-shell-sidebar-header__agent-name">{agentName}</div>
        <IconButton
          icon={
            isSidebarOpen ? <ArrowLeftFromLine size="1em" /> : <ArrowRightFromLine size="1em" />
          }
          onClick={() => {
            setIsSidebarOpen(!isSidebarOpen);
          }}
          size="small"
          variant="secondary"
          className="crayon-shell-sidebar-header__toggle-button"
        />
      </div>
      {children}
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
      className={clsx("crayon-shell-sidebar-content", className, {
        "crayon-shell-sidebar-content--collapsed": !isSidebarOpen,
      })}
    >
      {children}
    </div>
  );
};

export const SidebarSeparator = () => {
  return <div className="crayon-shell-sidebar-separator" />;
};
