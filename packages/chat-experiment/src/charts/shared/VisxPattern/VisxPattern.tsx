"use client";

import {
  PatternCircles as VisxPatternCircles,
  PatternHexagons as VisxPatternHexagons,
  PatternLines as VisxPatternLines,
  PatternWaves as VisxPatternWaves,
} from "@visx/pattern";
import type { ComponentProps } from "react";

export function PatternLines(props: ComponentProps<typeof VisxPatternLines>) {
  return <VisxPatternLines {...props} />;
}
PatternLines.displayName = "PatternLines";

export function PatternCircles(props: ComponentProps<typeof VisxPatternCircles>) {
  return <VisxPatternCircles {...props} />;
}
PatternCircles.displayName = "PatternCircles";

export function PatternWaves(props: ComponentProps<typeof VisxPatternWaves>) {
  return <VisxPatternWaves {...props} />;
}
PatternWaves.displayName = "PatternWaves";

export function PatternHexagons(props: ComponentProps<typeof VisxPatternHexagons>) {
  return <VisxPatternHexagons {...props} />;
}
PatternHexagons.displayName = "PatternHexagons";
