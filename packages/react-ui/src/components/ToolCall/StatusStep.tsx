import clsx from "clsx";
import { CircleDot } from "lucide-react";

export interface StatusStepProps {
  text: string;
  isLast?: boolean;
  isActive?: boolean;
}

export const StatusStep = ({ text, isLast = false, isActive = false }: StatusStepProps) => {
  return (
    <div className="openui-tool-call">
      <div className="openui-tool-call__title-row">
        <span
          className={clsx("openui-tool-call__icon-wrapper", {
            "openui-tool-call__icon--blinking": isActive && isLast,
          })}
        >
          <CircleDot size={14} className="openui-tool-call__icon" />
        </span>
        <span
          className={clsx("openui-tool-call__name", {
            "openui-tool-call__name--shimmer": isActive && isLast,
          })}
        >
          {text}
        </span>
      </div>
      <div
        className={clsx("openui-tool-call__connector", {
          "openui-tool-call__connector--last": isLast,
        })}
      />
    </div>
  );
};
