import clsx from "clsx";
import { ReactNode } from "react";
import { useShellStore } from "../Shell/store";

interface HeaderProps {
  className?: string;
  /** Custom content to render on the rightmost side of the logo container */
  rightChildren?: ReactNode;
}

export const Header = ({ className, rightChildren }: HeaderProps) => {
  const { logoUrl, agentName } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
  }));

  return (
    <div className={clsx("crayon-bottom-tray-header", className)}>
      <div className="crayon-bottom-tray-header-logo-container">
        <img className="crayon-bottom-tray-header-logo" src={logoUrl} alt="Logo" />
        <span className="crayon-bottom-tray-header-agent-name">{agentName}</span>
      </div>
      {rightChildren && (
        <div className="crayon-bottom-tray-header-right-content">{rightChildren}</div>
      )}
    </div>
  );
};

