import { toJpeg } from "html-to-image";
import { useTheme } from "../../ThemeProvider";

export const useExportBarChart = (
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  mainContainerRef: React.RefObject<HTMLDivElement | null>,
  barChartContainerRef: React.RefObject<HTMLDivElement | null>,
  dataWidth: number,
  showYAxis: boolean,
  yAxisWidth: number,
  chartHeight: number,
) => {
  const { portalThemeClassName } = useTheme();

  return {
    exportChart: async () => {
      const { current: chartContainer } = chartContainerRef;
      const { current: mainContainer } = mainContainerRef;
      const { current: barChartContainer } = barChartContainerRef;

      if (!chartContainer || !mainContainer || !barChartContainer) {
        return;
      }

      const screenshotableNode = barChartContainer.cloneNode(true) as HTMLDivElement;
      // Position the clone off-screen
      screenshotableNode.style.position = "fixed";
      screenshotableNode.style.top = "0";
      screenshotableNode.style.left = "0";
      screenshotableNode.style.zIndex = "1000";
      screenshotableNode.classList.add(portalThemeClassName);
      (
        screenshotableNode.querySelector(".crayon-bar-chart-main-container") as HTMLDivElement
      ).style.overflow = "visible";
      screenshotableNode.style.opacity = "0";
      // const responsiveContainer = screenshotableNode.querySelector(
      //   ".crayon-bar-chart-main-container .recharts-responsive-container",
      // ) as HTMLElement;
      // responsiveContainer.style.marginLeft = `${getComputedStyle(responsiveContainer).marginLeft + 8}px`;
      // Append to the body to apply styles
      document.body.appendChild(screenshotableNode);

      try {
        const dataUrl = await toJpeg(screenshotableNode, {
          filter(domNode) {
            // do not include buttons in the screenshot
            const ignoredClasses = ["crayon-button-base", "crayon-icon-button"];
            if (ignoredClasses.some((className) => domNode.classList?.contains(className))) {
              return false;
            }
            return true;
          },
          width: dataWidth + (showYAxis ? yAxisWidth : 0),
          height: chartHeight + 100,
          canvasHeight: chartHeight + 100,
          backgroundColor: "white",

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
