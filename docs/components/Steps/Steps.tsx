import React from "react";
import styles from "./Steps.module.css"; // Using CSS Modules for styling

interface StepsProps {
  children: React.ReactNode;
}

/**
 * Renders a container for Step components, automatically numbering them.
 */
export const Steps: React.FC<StepsProps> = ({ children }) => {
  let stepNumber = 0;

  return (
    <div className={styles.stepsContainer}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          stepNumber++;
          return React.cloneElement(child as React.ReactElement<any>, {
            stepNumber: stepNumber,
          });
        }
        return child;
      })}
    </div>
  );
};

interface StepProps {
  /** The title to display for this step */
  title: string | React.ReactNode;
  /** The content of the step */
  children: React.ReactNode;
  /** The step number, automatically injected by the parent Steps component */
  stepNumber?: number;
}

/**
 * Renders a single numbered step with a title and content.
 * Should be used as a child of the Steps component.
 */
export const Step: React.FC<StepProps> = ({ title, children, stepNumber }) => {
  return (
    <div className={styles.step}>
      <div className={styles.leftColumn}>
        <div className={styles.stepNumberBadge}>{stepNumber}</div>
        <div className={styles.stepLine} />
      </div>
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>{title}</h2>
        {children}
      </div>
    </div>
  );
};
