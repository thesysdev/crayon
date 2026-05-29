/**
 * Fluid typography for pie / ring / gauge center labels.
 *
 * Uses CSS container query units (`cqw`) so values scale with the center
 * hole — not the viewport — which keeps stat text readable on small charts.
 * Styling lives in the co-located `chart-center-typography.scss`.
 */
export const chartCenterContainerClassName = "ce-chart-center-container";

/** Primary stat — ~22% of center width, clamped between text-sm and text-3xl. */
export const chartCenterValueClassName = "ce-chart-center-value";

/** Supporting label — ~9% of center width, clamped between 10px and text-xs. */
export const chartCenterLabelClassName = "ce-chart-center-label";
