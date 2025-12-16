import clsx from "clsx";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { IconButton } from "../IconButton";
import { useShellStore } from "../Shell/store";

interface HeaderProps {
  className?: string;
  /** Custom content to render on the rightmost side of the logo container */
  rightChildren?: ReactNode;
  /** Callback when minimize button is clicked */
  onMinimize?: () => void;
  /** Hide the minimize button */
  hideMinimizeButton?: boolean;
}

export const Header = ({
  className,
  rightChildren,
  onMinimize,
  hideMinimizeButton = false,
}: HeaderProps) => {
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
      <div className="crayon-bottom-tray-header-actions">
        {rightChildren}
        {!hideMinimizeButton && onMinimize && (
          <IconButton
            icon={<X size="1em" />}
            onClick={onMinimize}
            aria-label="Minimize chat"
            className="crayon-bottom-tray-header-minimize"
          />
        )}
      </div>
    </div>
  );
};
