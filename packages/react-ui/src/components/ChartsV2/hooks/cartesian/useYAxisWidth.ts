import { useCallback, useMemo, useRef, useState } from "react";
import { numberTickFormatter } from "../../utils/styleUtils";
import { useCanvasContextForLabelSize } from "../core/useCanvasContextForLabelSize";

const DEFAULT_Y_AXIS_WIDTH = 40;
const MIN_Y_AXIS_WIDTH = 20;
const MAX_Y_AXIS_WIDTH = 200;
const LABEL_PADDING = 10;

export const useYAxisWidth = (data: Array<Record<string, string | number>>, dataKeys: string[]) => {
  const context = useCanvasContextForLabelSize();
  const [maxLabelWidthReceived, setMaxLabelWidthReceived] = useState(0);

  const maxLabelWidth = useMemo(() => {
    if (typeof window === "undefined" || !data || data.length === 0 || !dataKeys.length) {
      return DEFAULT_Y_AXIS_WIDTH;
    }

    if (!context) {
      return DEFAULT_Y_AXIS_WIDTH;
    }

    let maxWidth = 0;

    dataKeys.forEach((key) => {
      const values = [
        ...new Set(data.map((item) => item[key]).filter((v) => v != null && typeof v === "number")),
      ];

      values.forEach((value) => {
        const displayValue = numberTickFormatter(value as number);
        const textWidth = context.measureText(displayValue).width;

        maxWidth = Math.max(maxWidth, textWidth);
      });
    });

    const totalWidth = Math.ceil(maxWidth) + LABEL_PADDING;

    return Math.max(MIN_Y_AXIS_WIDTH, Math.min(MAX_Y_AXIS_WIDTH, totalWidth));
  }, [data, dataKeys, context]);

  const maxLabelWidthRef = useRef(maxLabelWidth);
  maxLabelWidthRef.current = maxLabelWidthReceived || maxLabelWidth;

  const setLabelWidth = useCallback(
    (displayValue: string) => {
      const textWidth = context.measureText(displayValue).width + LABEL_PADDING;
      setMaxLabelWidthReceived((currentWidth) => Math.max(currentWidth, textWidth));
    },
    [context],
  );

  return { yAxisWidth: maxLabelWidthRef.current, setLabelWidth };
};
