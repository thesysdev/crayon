import { ChartConfig } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";

export type MiniAreaChartData = Array<Record<string, string | number>>;

export interface MiniAreaChartConfig {
  data: MiniAreaChartData;
  categoryKey: string;
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  icons?: Partial<Record<string, React.ComponentType>>;
}

export const createChartConfig = ({
  data,
  categoryKey,
  theme = "ocean",
  icons = {},
}: MiniAreaChartConfig): ChartConfig => {
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
