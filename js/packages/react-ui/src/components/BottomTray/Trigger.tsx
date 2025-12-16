import clsx from "clsx";
import { MessageSquare } from "lucide-react";
import { ReactNode } from "react";

interface TriggerProps {
  /** Click handler to open the tray */
  onClick?: () => void;
  /** Custom content for the trigger */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Aria label for accessibility */
  "aria-label"?: string;
}

export const Trigger = ({
  onClick,
  children,
  className,
  "aria-label": ariaLabel = "Open chat",
}: TriggerProps) => {
  return (
    <button
      className={clsx("crayon-bottom-tray-trigger", className)}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children || (
        <>
          <MessageSquare size={20} />
          <span className="crayon-bottom-tray-trigger__text">Chat</span>
        </>
      )}
    </button>
  );
};
