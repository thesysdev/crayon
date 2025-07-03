import React, { useLayoutEffect, useRef } from "react";

export interface ActiveDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
  value?: any;
}

export const ActiveDot: React.FC<ActiveDotProps> = (props) => {
  const { cx, cy } = props;
  const ref = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const parent = ref.current.parentElement?.parentElement;
      const dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

      const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle1.setAttribute("cx", String(cx));
      circle1.setAttribute("cy", String(cy));
      circle1.setAttribute("r", "4");
      circle1.setAttribute("fill", "var(--crayon-container-fills)");
      circle1.setAttribute("stroke", "var(--crayon-container-fills)");
      circle1.setAttribute("stroke-width", "1");

      const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle2.setAttribute("cx", String(cx));
      circle2.setAttribute("cy", String(cy));
      circle2.setAttribute("r", "2");
      circle2.setAttribute("fill", "var(--crayon-inverted-fills)");
      circle2.setAttribute("stroke", "var(--crayon-inverted-fills)");
      circle2.setAttribute("stroke-width", "0.5");

      dotGroup.appendChild(circle1);
      dotGroup.appendChild(circle2);
      if (parent) {
        parent.appendChild(dotGroup);
      }

      return () => {
        dotGroup.remove();
      };
    }
    return undefined;
  });

  if (cx === undefined || cy === undefined || cx === null || cy === null) {
    return null;
  }

  return <g ref={ref}></g>;
};
