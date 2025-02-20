import React from "react";

export interface Step {
  title: React.ReactNode;
  details: React.ReactNode;
}

export interface StepsProps {
  steps: Step[];
}

export const Steps: React.FC<StepsProps> = ({ steps }) => {
  return (
    <div className={`crayon-steps-container`}>
      <div className="crayon-steps">
        {steps.map((step, index) => (
          <div key={index} className={`crayon-step-item`}>
            <div className="crayon-step-connector">
              <div className="crayon-step-number">
                <div className="crayon-step-number-inner">{index + 1}</div>
              </div>
              {index < steps.length - 1 && <div className="crayon-connector-line" />}
            </div>
            <div className="crayon-step-content">
              <span className="crayon-step-title">{step.title}</span>
              <div className="crayon-step-details">{step.details}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
