import { useThreadListActions } from "@crayonai/react-core";
import clsx from "clsx";
import { SquarePen, X } from "lucide-react";
import { ReactNode } from "react";
import { IconButton } from "../IconButton";
import { useShellStore } from "../Shell/store";

export const BottomTrayNewChatButton = () => {
  const { switchToNewThread } = useThreadListActions();

  return (
    <IconButton
      icon={<SquarePen size="1em" />}
      onClick={switchToNewThread}
      variant="tertiary"
      aria-label="New chat"
      className="crayon-bottom-tray-header-new-chat-button"
    />
  );
};

interface HeaderProps {
  className?: string;
  /** Custom content to render on the rightmost side of the logo container */
  rightChildren?: ReactNode;
  /** Callback when minimize button is clicked */
  onMinimize?: () => void;
  /** Hide the minimize button */
  hideMinimizeButton?: boolean;
  /** Custom new chat button */
  newChatButton?: ReactNode;
}

export const Header = ({
  className,
  rightChildren,
  onMinimize,
  hideMinimizeButton = false,
  newChatButton = <BottomTrayNewChatButton />,
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
        {newChatButton}
        {!hideMinimizeButton && onMinimize && (
          <IconButton
            icon={<X size="1em" />}
            onClick={onMinimize}
            variant="tertiary"
            aria-label="Minimize chat"
            className="crayon-bottom-tray-header-minimize"
          />
        )}
      </div>
    </div>
  );
};
