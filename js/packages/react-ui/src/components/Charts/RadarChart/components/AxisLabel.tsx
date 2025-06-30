import clsx from "clsx";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { calculateAvailableWidth, truncateText } from "../utils";

// This is the props that are passed by recharts to the custom tick component
interface AxisLabelProps {
  x?: number;
  y?: number;
  textAnchor?: string;
  payload?: {
    value: string;
  };
  className?: string;
  portalContainerRef?: React.RefObject<HTMLDivElement | null>;
  isLegendExpanded?: boolean;
  [key: string]: any; // To allow other props from recharts
}

export const AxisLabel: React.FC<AxisLabelProps> = (props) => {
  const { x, y, payload, textAnchor, portalContainerRef, className, isLegendExpanded } = props;
  const anchorRef = useRef<SVGGElement>(null);

  /**
   * Memoizes the calculation of truncated text for axis labels
   *
   * This hook handles text truncation based on available space in the chart container:
   * 1. Returns empty string or original value if payload/container is missing
   * 2. Calculates container width and available space based on text anchor position
   * 3. Truncates text to fit within available width using specified font size
   *
   * @returns {string} Truncated text that fits within available space
   *
   * Dependencies:
   * - payload?.value: The text content to truncate
   * - x: X-coordinate of the label
   * - textAnchor: Text anchor position ('start', 'middle', 'end')
   * - portalContainerRef: Reference to container element
   */
  const truncatedText = useMemo(() => {
    if (!payload?.value || !portalContainerRef?.current) {
      return payload?.value || "";
    }

    const container = portalContainerRef.current;
    // Get the width of the container
    const containerWidth = container.getBoundingClientRect().width;
    // Get the padding of the container
    const padding = 0;
    // Get the font size of the text
    const fontSize = 10;

    // Calculate available width based on text anchor and position, and padding
    const availableWidth = calculateAvailableWidth(
      x || 0,
      containerWidth,
      textAnchor || "middle",
      padding,
    );

    return truncateText(payload.value, availableWidth, fontSize);
  }, [payload?.value, x, textAnchor, portalContainerRef]);

  useLayoutEffect(() => {
    const container = portalContainerRef?.current;
    const anchor = anchorRef.current;

    if (!container || !anchor || !truncatedText) {
      return;
    }

    // Create the label element
    const labelEl = document.createElement("div");
    labelEl.textContent = truncatedText;
    container.appendChild(labelEl);

    // Function to calculate and apply styles
    const updatePosition = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const left = anchorRect.left - containerRect.left;
      const top = anchorRect.top - containerRect.top;

      const padding = 0;
      let transform = "";
      if (textAnchor === "end") {
        transform = `translate(calc(-100% - ${padding}px), -50%)`;
      } else if (textAnchor === "start") {
        transform = `translate(${padding}px, -50%)`;
      } else {
        transform = "translate(-50%, -50%)";
      }

      labelEl.style.position = "absolute";
      labelEl.style.left = `${left}px`;
      labelEl.style.top = `${top}px`;
      labelEl.style.transform = transform;
      labelEl.style.pointerEvents = "none";
      labelEl.style.zIndex = "0";
      labelEl.className = clsx("crayon-chart-polar-angle-axis-label", className);

      // Update text content if it has changed due to container resize
      const containerWidth = containerRect.width;
      const availableWidth = calculateAvailableWidth(
        left,
        containerWidth,
        textAnchor ?? "middle",
        0,
      );
      const newTruncatedText = truncateText(payload?.value ?? "", availableWidth, 10);
      if (labelEl.textContent !== newTruncatedText) {
        labelEl.textContent = newTruncatedText;
      }
    };

    updatePosition();

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(container);

    // Cleanup function to run when the component unmounts or deps change
    return () => {
      resizeObserver.disconnect();
      if (container.contains(labelEl)) {
        container.removeChild(labelEl);
      }
    };
  }, [x, y, textAnchor, truncatedText, portalContainerRef, className, payload?.value]);

  return <g ref={anchorRef} transform={`translate(${x || 0}, ${y || 0})`} />;
};
