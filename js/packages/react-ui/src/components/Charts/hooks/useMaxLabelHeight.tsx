import { useMemo } from "react";

import { useTheme } from "../../ThemeProvider";
import { XAxisTickVariant } from "../types";

const DEFAULT_HEIGHT = 30;

export const useMaxLabelHeight = (
  data: any[],
  categoryKey: string,
  tickVariant: XAxisTickVariant,
  widthOfGroup = 70,
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

    const largestLabelHeight = Math.min(
      div2.getBoundingClientRect().height,
      div3.getBoundingClientRect().height * 3,
    );
    div1.remove();

    return largestLabelHeight;
  }, [data, categoryKey, tickVariant, widthOfGroup]);

  if (tickVariant === "multiLine") {
    return Math.max(maxLabelHeight + 13, DEFAULT_HEIGHT);
  } else if (tickVariant === "angled") {
    return Math.max(maxLabelHeight + 13, DEFAULT_HEIGHT);
  } else {
    return DEFAULT_HEIGHT;
  }
};
