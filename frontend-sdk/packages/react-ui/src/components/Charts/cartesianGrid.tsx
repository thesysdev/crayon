import { CartesianGrid } from "recharts";

export const cartesianGrid = () => (
  <CartesianGrid
    vertical={false}
    fillOpacity={1}
    strokeOpacity={1}
    strokeWidth={2}
    strokeDasharray="6"
    strokeLinecap="round"
    strokeLinejoin="round"
    stroke="currentColor"
    className="crayon-chart-cartesian-grid"
  />
);
