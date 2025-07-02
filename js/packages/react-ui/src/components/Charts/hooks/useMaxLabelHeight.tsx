import { useMemo } from "react";

import { useTheme } from "../../ThemeProvider/ThemeProvider";

export const useMaxLabelHeight = (data: any[], categoryKey: string) => {
  const { theme: userTheme } = useTheme();

  const maxLabelHeight = useMemo(() => {
    if (typeof window === "undefined" || !data || data.length === 0) {
      return 0;
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

    div1.className = "crayon-chart-x-axis-tick-multi-line-container";

    div2.innerText = largestLabel;
    div3.innerText = "a";
    div1.append(div2, div3);

    div1.style.maxWidth = "70px";
    div1.style.wordBreak = "break-word";
    div1.style.position = "absolute";
    div1.style.visibility = "hidden";

    document.body.append(div1);

    const largestLabelHeight = Math.min(
      div2.getBoundingClientRect().height,
      div3.getBoundingClientRect().height * 3,
    );

    div1.remove();
    return largestLabelHeight;
  }, [
    data,
    categoryKey,
    userTheme.fontLabelExtraSmall,
    userTheme.fontLabelExtraSmallLetterSpacing,
  ]);

  return maxLabelHeight + 13;
};
