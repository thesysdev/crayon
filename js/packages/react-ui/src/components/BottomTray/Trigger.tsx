import clsx from "clsx";
import { ChevronDown } from "lucide-react";
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
  /** Whether the tray is currently open (used for mobile styling) */
  isOpen?: boolean;
}

export const Trigger = ({
  onClick,
  children,
  className,
  "aria-label": ariaLabel = "Open chat",
  isOpen = false,
}: TriggerProps) => {
  return (
    <button
      className={clsx(
        "crayon-bottom-tray-trigger",
        { "crayon-bottom-tray-trigger--open": isOpen },
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children || <ChevronDown size={24} />}
    </button>
  );
};
