import { toJpeg } from "html-to-image";
import { useTheme } from "../../ThemeProvider/index.js";

export const useExportChart = (
  /**
   * The top level container of the chart to screenshot
   *
   */
  exportChartContainerRef: React.RefObject<HTMLElement | null> | null,
  /**
   * The classname of the container which scrolls. This is used to expand the container before screenshotting to make the entire chart visible
   *
   */
  scrollableContainerClass?: string,
) => {
  const { mode } = useTheme();

  return {
    exportChart: async () => {
      if (!exportChartContainerRef) return;
      const { current: exportChartContainer } = exportChartContainerRef;

      if (!exportChartContainer) {
        return;
      }

      const screenshotableNode = exportChartContainer.cloneNode(true) as HTMLDivElement;
      // Position the clone off-screen
      screenshotableNode.style.position = "fixed";
      screenshotableNode.style.top = "0";
      screenshotableNode.style.left = "0";
      screenshotableNode.style.zIndex = "1000";
      const scrollableContainer = screenshotableNode.querySelector(
        `.${scrollableContainerClass}`,
      ) as HTMLDivElement | null;
      if (scrollableContainer) {
        scrollableContainer.style.overflow = "visible";
      }
      screenshotableNode.style.opacity = "0";
      // Append to the body to apply styles
      document.body.appendChild(screenshotableNode);

      try {
        const dataUrl = await toJpeg(screenshotableNode, {
          skipFonts: true,
          filter(domNode) {
            // do not include buttons in the screenshot
            const ignoredClasses = ["crayon-button-base", "crayon-icon-button"];
            if (ignoredClasses.some((className) => domNode.classList?.contains(className))) {
              return false;
            }
            return true;
          },
          width: Number(getComputedStyle(screenshotableNode).width),
          canvasWidth: Number(getComputedStyle(screenshotableNode).width),
          height: Number(getComputedStyle(screenshotableNode).height),
          canvasHeight: Number(getComputedStyle(screenshotableNode).height),
          backgroundColor: mode === "dark" ? "rgba(28,28,28,1)" : "white",

          style: {
            overflow: "visible",
            opacity: "100%",
          },
        });
        const link = document.createElement("a");
        link.download = "chart.jpeg";
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error("Failed to capture chart:", error);
      } finally {
        // Clean up by removing the clone from the DOM
        document.body.removeChild(screenshotableNode);
      }
    },
  };
};
