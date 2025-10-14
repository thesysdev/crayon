import { useMemo } from "react";
import { X_AXIS_PADDING } from "../constants";

const MIN_ROTATION_ANGLE = 15; // Minimum angle to apply when labels need rotation

interface AngleCalculationResult {
  angle: number;
  height: number;
}

/**
 * Calculates the optimal rotation angle and height for X-axis labels using trigonometry.
 *
 * This hook uses the Pythagorean theorem to determine the optimal angle for rotating
 * labels based on the maximum label width and available horizontal space.
 *
 * Mathematical approach:
 * - Hypotenuse = maxLabelWidth (the label length)
 * - Base = X_AXIS_PADDING + yAxisWidth (available horizontal space from left edge to first label)
 * - Height = sqrt(hypotenuse² - base²)
 * - Angle = atan(height / base) converted to degrees
 *
 * @param maxLabelWidth - The maximum width of all labels in pixels
 * @param yAxisWidth - The width of the Y-axis in pixels
 * @param enabled - Whether to calculate the angle (typically based on tickVariant)
 * @returns Object containing the calculated angle (in degrees) and required height
 */
export const useAutoAngleCalculation = (
  maxLabelWidth: number,
  yAxisWidth: number,
  enabled: boolean,
  showYAxis: boolean,
): AngleCalculationResult => {
  return useMemo(() => {
    // If not enabled, return default values for horizontal labels
    if (!enabled) {
      return {
        angle: 0,
        height: 30,
      };
    }

    // Calculate the base (horizontal distance from left edge to first label anchor)
    let base = 0;

    if (showYAxis) {
      base = X_AXIS_PADDING + yAxisWidth;
    } else {
      base = X_AXIS_PADDING;
    }

    // The hypotenuse is the maximum label width
    const hypotenuse = maxLabelWidth;

    // Edge case: if base is greater than or equal to hypotenuse,
    // labels would fit horizontally, but we always apply rotation per requirement
    if (base >= hypotenuse) {
      // Apply minimum rotation angle
      const angleRadians = (MIN_ROTATION_ANGLE * Math.PI) / 180;
      const height = Math.ceil(hypotenuse * Math.sin(angleRadians));

      return {
        angle: -MIN_ROTATION_ANGLE, // Negative for counter-clockwise rotation
        height: Math.max(height, 30), // Ensure minimum height
      };
    }

    // Calculate height using Pythagorean theorem: height = sqrt(hypotenuse² - base²)
    const heightSquared = hypotenuse * hypotenuse - base * base;
    const height = Math.sqrt(Math.max(0, heightSquared)); // Ensure non-negative

    // Calculate angle using arctangent: angle = atan(height / base)
    const angleRadians = Math.atan(height / base);

    // Convert radians to degrees
    const angleDegrees = (angleRadians * 180) / Math.PI;

    // Apply minimum rotation angle if calculated angle is too small
    const finalAngle = Math.max(angleDegrees, MIN_ROTATION_ANGLE);

    // Recalculate height if we used minimum angle
    const finalHeight =
      finalAngle > angleDegrees
        ? Math.ceil(hypotenuse * Math.sin((finalAngle * Math.PI) / 180))
        : Math.ceil(height);

    return {
      angle: -finalAngle, // Negative for counter-clockwise rotation
      height: Math.max(finalHeight + 16, 30), // Ensure minimum height
    };
  }, [maxLabelWidth, yAxisWidth, enabled, showYAxis]);
};
