import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import React, { forwardRef } from "react";

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the tray is currently open (used for mobile styling) */
  isOpen?: boolean;
}

export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(
  (
    { children, className, isOpen = false, "aria-label": ariaLabel = "Open chat", ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "crayon-bottom-tray-trigger",
          { "crayon-bottom-tray-trigger--open": isOpen },
          className,
        )}
        aria-label={ariaLabel}
        {...rest}
      >
        {children || <ChevronDown size={24} />}
      </button>
    );
  },
);
