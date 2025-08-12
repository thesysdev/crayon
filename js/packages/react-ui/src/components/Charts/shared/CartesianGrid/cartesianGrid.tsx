import { CartesianGrid } from "recharts";

export const cartesianGrid = () => gridCartesianGrid({ vertical: false });

export const verticalCartesianGrid = () => gridCartesianGrid({ horizontal: false });

export const gridCartesianGrid = (props: { vertical?: boolean; horizontal?: boolean }) => (
  <CartesianGrid
    vertical={props.vertical ?? true}
    horizontal={props.horizontal ?? true}
    fillOpacity={1}
    strokeOpacity={1}
    strokeWidth={1}
    strokeDasharray="0"
    strokeLinecap="round"
    strokeLinejoin="round"
    stroke="currentColor"
    className="crayon-chart-cartesian-grid"
  />
);
