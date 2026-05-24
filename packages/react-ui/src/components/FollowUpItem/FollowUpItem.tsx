import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

export interface FollowUpItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const FollowUpItem = forwardRef<HTMLButtonElement, FollowUpItemProps>((props, ref) => {
  const { className, text, icon, ...rest } = props;
  return (
    <button ref={ref} className={clsx("openui-follow-up-item", className)} {...rest}>
      {text && <span className="openui-follow-up-item-text">{text}</span>}
      {icon && <span className="openui-follow-up-item-icon">{icon}</span>}
    </button>
  );
});

FollowUpItem.displayName = "FollowUpItem";

export { FollowUpItem };
