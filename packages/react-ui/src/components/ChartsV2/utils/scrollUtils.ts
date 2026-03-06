type ChartData = Array<Record<string, string | number>>;

const ELEMENT_SPACING = 72;
const MIN_SINGLE_POINT_WIDTH = 200;

export const getWidthOfData = (data: ChartData, containerWidth: number) => {
  if (data.length === 0) {
    return containerWidth;
  }
  const width = data.length * getWidthOfGroup(data.length);

  if (containerWidth >= width) {
    return containerWidth;
  }

  if (data.length === 1) {
    return Math.max(width, MIN_SINGLE_POINT_WIDTH);
  }

  return width;
};

export const findNearestSnapPosition = (
  snapPositions: number[],
  currentScroll: number,
  direction: "left" | "right",
): number => {
  let currentIndex = 0;
  for (let i = 0; i < snapPositions.length; i++) {
    const snapPosition = snapPositions[i];
    if (snapPosition !== undefined && currentScroll >= snapPosition) {
      currentIndex = i;
    } else {
      break;
    }
  }

  if (direction === "left") {
    return Math.max(0, currentIndex - 1);
  } else {
    return Math.min(snapPositions.length - 1, currentIndex + 1);
  }
};

export const getWidthOfGroup = (dataLength: number): number => {
  if (dataLength === 0) return MIN_SINGLE_POINT_WIDTH;
  return ELEMENT_SPACING;
};

export const getSnapPositions = (data: ChartData): number[] => {
  if (data.length === 0) return [0];

  const positions = [0];
  const groupWidthValue = getWidthOfGroup(data.length);

  for (let i = 1; i < data.length; i++) {
    positions.push(i * groupWidthValue);
  }

  return positions;
};
