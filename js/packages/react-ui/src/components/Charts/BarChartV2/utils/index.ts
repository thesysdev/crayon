import { Variant } from "../BarChartV2";

const getPadding = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
  containerWidth: number,
) => {
  const numberOfSticks = data.map((ob) => {
    const datapoint = Object.keys(ob).filter((key) => key !== categoryKey).length;
    return datapoint;
  });
  const totalSticks = numberOfSticks.reduce((acc, curr) => acc + curr, 0);
  const chartWidth = totalSticks * 8 + totalSticks * 20;
  const padding = containerWidth - chartWidth;

  if (padding / 2 < 0) {
    return {
      left: 0,
      right: 0,
    };
  } else {
    return {
      left: padding / 2,
      right: padding / 2,
    };
  }
};

const getWidthOfData = (data: Array<Record<string, string | number>>, categoryKey: string) => {
  const sticks = data.map((ob) => {
    const datapoint = Object.keys(ob).filter((key) => key !== categoryKey).length;
    return datapoint;
  });

  const totalSticks = sticks.reduce((acc, curr) => acc + curr, 0);
  const width = totalSticks * 8 + totalSticks * 20;
  return width;
};

const getRadiusArray = (variant: Variant, radius: number): [number, number, number, number] => {
  if (variant === "grouped") {
    return [radius, radius, 0, 0];
  } else {
    return [radius, radius, radius, radius];
  }
};

export { getPadding, getRadiusArray, getWidthOfData };
