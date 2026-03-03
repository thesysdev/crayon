import { AreaChartVariant, LineChartVariant } from "../..";

export const getLineType = (lineType: LineChartVariant | AreaChartVariant) => {
  switch (lineType) {
    case "linear":
      return "linear";
    case "natural":
      return "monotone";
    case "step":
      return "step";
  }
};
