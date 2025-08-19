import { createRoot } from "react-dom/client";

export const useExportChart = (chartComponent: React.ReactNode) => {
  return {
    exportChart: () => {
      const div = document.createElement("div");
      div.style.position = "fixed";
      document.body.appendChild(div);

      const root = createRoot(div);
      root.render(chartComponent);
      root.unmount();
      document.body.removeChild(div);
    },
  };
};
