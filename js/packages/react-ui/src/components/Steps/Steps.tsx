import React, { createContext, useContext } from "react";

export interface StepsItemProps {
  title: React.ReactNode;
  details: React.ReactNode;
}

export interface StepsProps {
  children: React.ReactNode;
}

const StepNumberContext = createContext<number>(0);

export const Steps: React.FC<StepsProps> = ({ children }) => {
  return (
    <div className={`crayon-steps-container`}>
      <div className="crayon-steps">
        {React.Children.map(children, (child, index) => (
          <StepNumberContext.Provider value={index + 1}>{child}</StepNumberContext.Provider>
        ))}
      </div>
    </div>
  );
};

export const StepsItem: React.FC<StepsItemProps> = ({ title, details }) => {
  const stepNumber = useContext(StepNumberContext);

  return (
    <div className={`crayon-step-item`}>
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
};
