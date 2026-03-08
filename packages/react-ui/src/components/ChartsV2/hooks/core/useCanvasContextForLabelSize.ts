import { useMemo } from "react";
import { useTheme } from "../../../ThemeProvider";

export const useCanvasContextForLabelSize = () => {
  const { theme: userTheme } = useTheme();

  return useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    const font = userTheme.textLabelXs ?? "400 10px/12px Inter";
    context.font = font;
    return context;
  }, [userTheme.textLabelXs]);
};
