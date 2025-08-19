import { useMemo } from "react";

import { useTheme } from "../../ThemeProvider";
import { XAxisTickVariant } from "../types";

const DEFAULT_HEIGHT = 30;

export const useMaxLabelHeight = (
  data: Record<string, string | number>[],
  categoryKey: string,
  tickVariant: XAxisTickVariant,
  widthOfGroup = 70,
  allowFullHeight?: boolean,
) => {
  const { theme: userTheme } = useTheme();

  const maxLabelHeight = useMemo(() => {
    if (typeof window === "undefined" || !data || data.length === 0) {
      return DEFAULT_HEIGHT;
    }

    const largestLabel = data.reduce((max, item) => {
      const label = String(item[categoryKey]);
      if (max.length < label.length) {
        return label;
      }
      return max;
    }, "");

    const [div1, div2, div3] = [
      document.createElement("div"),
      document.createElement("div"),
      document.createElement("div"),
    ];

    div1.style.font = userTheme.fontLabelExtraSmall ?? "";
    div1.style.letterSpacing = userTheme.fontLabelExtraSmallLetterSpacing ?? "";
    div1.style.opacity = "0";
    div1.style.pointerEvents = "none";

    div2.innerText = largestLabel;
    div3.innerText = "a";
    div1.append(div2, div3);

    div1.style.width = `${widthOfGroup}px`;
    div1.style.maxWidth = `${widthOfGroup}px`;
    div1.style.wordBreak = "break-word";
    div1.style.position = "absolute";
    div1.style.visibility = "hidden";

    document.body.append(div1);

    const largestLabelHeight = allowFullHeight
      ? div2.getBoundingClientRect().height
      : Math.min(div2.getBoundingClientRect().height, div3.getBoundingClientRect().height * 3);
    div1.remove();

    return largestLabelHeight;
  }, [data, categoryKey, tickVariant, widthOfGroup]);

  if (tickVariant === "multiLine") {
    return Math.max(maxLabelHeight + 13, DEFAULT_HEIGHT);
  } else {
    return DEFAULT_HEIGHT;
  }
};

/**
 * Hook to calculate the maximum label height for horizontal bar charts.
 * This considers the vertical layout and label width constraints specific to horizontal bars.
 * @param data - The chart data
 * @param categoryKey - The category key
 * @param labelWidth - The available width for labels (full chart width for horizontal bars)
 * @returns The calculated label height
 */
export const useHorizontalBarLabelHeight = (
  data: Record<string, string | number>[],
  categoryKey: string,
  labelWidth: number,
) => {
  const { theme: userTheme } = useTheme();

  const labelHeight = useMemo(() => {
    if (typeof window === "undefined" || !data || data.length === 0) {
      return 20; // Default height for horizontal bar labels
    }

    const largestLabel = data.reduce((max, item) => {
      const label = String(item[categoryKey]);
      if (max.length < label.length) {
        return label;
      }
      return max;
    }, "");

    const [div1, div2] = [document.createElement("div"), document.createElement("div")];

    // Apply the same typography as the horizontal bar chart labels
    div1.style.font = userTheme.fontLabelExtraSmall ?? "";
    div1.style.letterSpacing = userTheme.fontLabelExtraSmallLetterSpacing ?? "";
    div1.style.opacity = "0";
    div1.style.pointerEvents = "none";
    div1.style.position = "absolute";
    div1.style.visibility = "hidden";

    div2.innerText = largestLabel;
    div1.append(div2);

    // For horizontal bar charts, labels span the full width
    // Set width constraint for horizontal bar labels
    div1.style.width = `${labelWidth}px`;
    div1.style.maxWidth = `${labelWidth}px`;
    div1.style.overflow = "hidden";
    div1.style.whiteSpace = "nowrap";
    div1.style.textOverflow = "ellipsis";
    div1.style.display = "flex";
    div1.style.alignItems = "center";

    document.body.append(div1);

    const calculatedHeight = div2.getBoundingClientRect().height;
    div1.remove();

    // Add some padding for better visual spacing
    // For horizontal bars, we need more space since labels are positioned above bars
    return Math.max(calculatedHeight + 8, 24);
  }, [
    data,
    categoryKey,
    labelWidth,
    userTheme.fontLabelExtraSmall,
    userTheme.fontLabelExtraSmallLetterSpacing,
  ]);

  return labelHeight;
};
