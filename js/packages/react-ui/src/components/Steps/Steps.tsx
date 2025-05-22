import clsx from "clsx";
import React, { createContext, forwardRef, useContext } from "react";

export interface StepsItemProps {
  title: React.ReactNode;
  details?: React.ReactNode;
  className?: string;
}

export interface StepsProps {
  children: React.ReactNode;
  className?: string;
}

const StepNumberContext = createContext<number>(0);

export const Steps = forwardRef<HTMLDivElement, StepsProps>(({ children, className }, ref) => {
  return (
    <div className={clsx("crayon-steps-container", className)} ref={ref}>
      <div className="crayon-steps">
        {React.Children.map(children, (child, index) => (
          <StepNumberContext.Provider value={index + 1}>{child}</StepNumberContext.Provider>
        ))}
      </div>
    </div>
  );
});

export const StepsItem = forwardRef<HTMLDivElement, StepsItemProps>(
  ({ title, details, className }, ref) => {
    const stepNumber = useContext(StepNumberContext);

    return (
      <div className={clsx("crayon-step-item", className)} ref={ref}>
        <div className="crayon-step-connector">
          <div className="crayon-step-number">
            <div className="crayon-step-number-inner">{stepNumber}</div>
          </div>
          <div className="crayon-connector-line" />
        </div>
        <div className="crayon-step-content">
          <span className="crayon-step-title">{title}</span>
          <div className="crayon-step-details">{details}</div>
        </div>
      </div>
    );
  },
);
