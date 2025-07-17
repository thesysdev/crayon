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
    <div className={clsx("crayon-copilot-shell-header", className)}>
      <div className="crayon-copilot-shell-header-logo-container">
        <img className="crayon-copilot-shell-header-logo" src={logoUrl} alt="Logo" />
        <span className="crayon-copilot-shell-header-agent-name">{agentName}</span>
      </div>
      {rightChildren && (
        <div className="crayon-copilot-shell-header-right-content">{rightChildren}</div>
      )}
    </div>
  );
};
