import clsx from "clsx";
import { cloneElement, CSSProperties, forwardRef, ReactElement, ReactNode } from "react";
import { ButtonProps } from "../Button";
import { IconButtonProps } from "../IconButton";

type CardHeaderVariant = "default" | "number" | "answer";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?:
    | ReactElement<ButtonProps | IconButtonProps>
    | ReactElement<ButtonProps | IconButtonProps>[];
  variant?: CardHeaderVariant;
  className?: string;
  styles?: CSSProperties;
}

const variantMap: Record<CardHeaderVariant, string> = {
  default: "crayon-header-default",
  number: "crayon-header-number",
  answer: "crayon-header-answer",
};

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => {
  const { icon, title, subtitle, actions, className, styles, variant = "default", ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-header", variantMap[variant], className)}
      style={styles}
      {...rest}
    >
      <div className="crayon-header-top">
        <div className="crayon-header-top-left">
          {icon && <span className="crayon-header-top-left-icon">{icon}</span>}
          {title}
        </div>
        <div className="crayon-header-top-right">
          {Array.isArray(actions)
            ? actions.map((action, index) => cloneElement(action, { key: index }))
            : actions}
        </div>
      </div>
      {variant !== "answer" && <div className="crayon-header-bottom">{subtitle}</div>}
    </div>
  );
});

CardHeader.displayName = "CardHeader";
