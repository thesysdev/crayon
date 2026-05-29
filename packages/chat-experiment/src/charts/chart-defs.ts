import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

export function getChartChildComponentName(child: ReactElement): string {
  const childType = child.type as { displayName?: string; name?: string };
  return typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
}

const VISX_PATTERN_COMPONENT_NAMES = new Set([
  "Lines",
  "Circles",
  "Waves",
  "Hexagons",
  "Path",
  "Pattern",
]);

/** @visx/pattern default exports use short names (e.g. `Lines`); also match *Pattern* displayNames. */
export function isPatternDefComponent(child: ReactElement): boolean {
  const name = getChartChildComponentName(child);
  return name.includes("Pattern") || VISX_PATTERN_COMPONENT_NAMES.has(name);
}

export function isGradientDefComponent(child: ReactElement): boolean {
  const name = getChartChildComponentName(child);
  return name.includes("Gradient") || name === "LinearGradient" || name === "RadialGradient";
}

export function isChartDefsComponent(child: ReactElement): boolean {
  return isPatternDefComponent(child) || isGradientDefComponent(child);
}

/** Split hoisted defs: @visx/pattern nodes already wrap `<defs>` and render at the svg root. */
export function partitionChartDefNodes(defNodes: ReactElement[]): {
  patternDefNodes: ReactElement[];
  gradientDefNodes: ReactElement[];
} {
  const patternDefNodes: ReactElement[] = [];
  const gradientDefNodes: ReactElement[] = [];

  for (const node of defNodes) {
    if (isPatternDefComponent(node)) {
      patternDefNodes.push(node);
    } else {
      gradientDefNodes.push(node);
    }
  }

  return { patternDefNodes, gradientDefNodes };
}

export function collectChartDefsChildren(children: ReactNode): ReactElement[] {
  const defNodes: ReactElement[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && isChartDefsComponent(child)) {
      defNodes.push(child);
    }
  });

  return defNodes;
}
