import React, { createContext, useContext } from "react";

export interface StepsItemProps {
  title: React.ReactNode;
  details: React.ReactNode;
  number?: number;
}

export interface StepsProps {
  children: React.ReactNode;
}

const StepNumberContext = createContext<number>(0);

export const Steps: React.FC<StepsProps> = ({ children }) => {
  return (
    <div className={`openui-steps-container`}>
      <div className="openui-steps">
        {React.Children.map(children, (child, index) => (
          <StepNumberContext.Provider value={index + 1}>{child}</StepNumberContext.Provider>
        ))}
      </div>
    </div>
  );
};

export const StepsItem: React.FC<StepsItemProps> = ({ title, details, number }) => {
  const stepNumber = useContext(StepNumberContext);

  return (
    <div className="openui-step-item">
      <div className="openui-step-connector">
        <div className="openui-step-number">
          <div className="openui-step-number-inner">
            {Number.isInteger(number) ? number : stepNumber}
          </div>
        </div>
        <div className="openui-connector-line" />
      </div>
      <div className="openui-step-content">
        <span className="openui-step-title">{title}</span>
        <div className="openui-step-details">{details}</div>
      </div>
    </div>
  );
};
