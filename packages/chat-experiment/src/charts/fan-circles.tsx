"use client";

import { motion } from "motion/react";
import { useState } from "react";

const CIRCLE_COUNT = 5;
const FAN_RADIUS = 60;
const FAN_ANGLE = 180; // degrees to spread across

export function FanCircles() {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate positions for fanned circles
  const getCirclePosition = (index: number) => {
    const startAngle = -90 - FAN_ANGLE / 2; // Start from top-left
    const angleStep = FAN_ANGLE / (CIRCLE_COUNT - 1);
    const angle = startAngle + index * angleStep;
    const radians = (angle * Math.PI) / 180;

    return {
      x: Math.cos(radians) * FAN_RADIUS,
      y: Math.sin(radians) * FAN_RADIUS,
    };
  };

  return (
    <div className="ce-fan-circles">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Animation hover target */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Animation hover target */}
      <div
        className="ce-fan-circles__stage"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Fanned circles */}
        {Array.from({ length: CIRCLE_COUNT }).map((_, index) => {
          const position = getCirclePosition(index);
          const hue = index * (360 / CIRCLE_COUNT);
          return (
            <motion.div
              animate={{
                x: isHovered ? position.x : 0,
                y: isHovered ? position.y : 0,
                scale: isHovered ? 1 : 0,
                opacity: isHovered ? 1 : 0,
              }}
              className="ce-fan-circles__circle"
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              key={`circle-hue-${hue}`}
              style={{
                backgroundColor: `hsl(${hue}, 70%, 60%)`,
                marginLeft: -16,
                marginTop: -16,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: index * 0.05,
              }}
            />
          );
        })}

        {/* Main target circle */}
        <motion.div
          className="ce-fan-circles__target"
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      </div>
    </div>
  );
}
