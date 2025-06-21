import { ChartConfig } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";

export type RadarChartData = Array<Record<string, string | number>>;

export interface RadarChartConfig {
  data: RadarChartData;
  categoryKey: string;
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  icons?: Partial<Record<string, React.ComponentType>>;
}

// Create chart configuration
export const createChartConfig = ({
  data,
  categoryKey,
  theme = "ocean",
  icons = {},
}: RadarChartConfig): ChartConfig => {
  // excluding the categoryKey
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, dataKeys.length);

  return dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        icon: icons[key],
        color: colors[index],
      },
    }),
    {},
  );
};

// Get radar chart margin
export const getRadarChartMargin = () => ({
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
});
