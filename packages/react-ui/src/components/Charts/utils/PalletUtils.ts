import { useMemo } from "react";
import invariant from "tiny-invariant";
import { ChartColorPalette, useTheme } from "../../ThemeProvider";

export type ColorPalette = {
  name: string;
  // colors are used to display the palette
  colors: string[];
};

export type PaletteName = "ocean" | "orchid" | "emerald" | "spectrum" | "sunset" | "vivid";

type PaletteMap = Record<string, ColorPalette>;

const colorPalettes: PaletteMap = {
  ocean: {
    name: "Ocean",
    colors: [
      "#0D47A1",
      "#1565C0",
      "#1976D2",
      "#1E88E5",
      "#2196F3",
      "#42A5F5",
      "#64B5F6",
      "#90CAF9",
      "#BBDEFB",
      "#E3F2FD",
      "#EFF8FF",
    ],
  },
  orchid: {
    name: "Orchid",
    colors: [
      "#3A365B",
      "#482E77",
      "#552594",
      "#631DB0",
      "#7014CC",
      "#883BD5",
      "#A062DD",
      "#B88AE6",
      "#CFB1EE",
      "#E7D8F7",
      "#F7EFFF",
    ],
  },
  emerald: {
    name: "Emerald",
    colors: [
      "#10451D",
      "#155D27",
      "#1A7431",
      "#208B3A",
      "#25A244",
      "#2DC653",
      "#4AD66D",
      "#6EDE8A",
      "#92E6A7",
      "#B7EFC5",
      "#DCFFE5",
    ],
  },
  spectrum: {
    name: "Spectrum",
    colors: [
      "#2171BC",
      "#2681D7",
      "#72A4EB",
      "#A0C0F7",
      "#C2D4F7",
      "#EADDE8",
      "#EEB3B1",
      "#E99492",
      "#E17475",
      "#D75259",
      "#CB253E",
    ],
  },
  sunset: {
    name: "Sunset",
    colors: [
      "#0D0887",
      "#42049E",
      "#6A00A8",
      "#900DA4",
      "#B12A90",
      "#CC4678",
      "#E16462",
      "#F1844B",
      "#FCA636",
      "#FCCE25",
      "#FFE06E",
    ],
  },
  vivid: {
    name: "Vivid",
    colors: [
      "#FF595E",
      "#FF924C",
      "#FFCA3A",
      "#C5CA30",
      "#8AC926",
      "#36949D",
      "#1982C4",
      "#4267AC",
      "#565AA0",
      "#6A4C93",
      "#63438F",
    ],
  },
};

export type PaletteKey = keyof typeof colorPalettes;

export const getPalette = (key: PaletteKey): ColorPalette => {
  const palette = colorPalettes[key];
  invariant(palette, `Palette ${key} not found`);
  return palette;
};

export const getAllPalettes = (): ColorPalette[] => {
  return Object.values(colorPalettes);
};

export const getPaletteKeys = (): PaletteKey[] => {
  return Object.keys(colorPalettes) as PaletteKey[];
};

export const getPaletteKey = (palette: ColorPalette): PaletteKey => {
  return Object.keys(colorPalettes).find((key) => colorPalettes[key] === palette) as PaletteKey;
};

export const getPaletteMap = (): PaletteMap => {
  return colorPalettes;
};

export const getDistributedColors = (colors: string[], dataLength: number): string[] => {
  const midIndex = Math.floor(colors.length / 2);

  if (dataLength === 1) {
    return [colors[midIndex]!];
  }

  if (dataLength === 2) {
    return [colors[midIndex - 1]!, colors[midIndex + 1]!];
  }

  const result: string[] = [];
  const offset = Math.floor((dataLength - 1) / 2);

  for (let i = 0; i < dataLength; i++) {
    const index = midIndex + (i - offset);

    // Handle out of bounds by cycling through colors
    let actualIndex: number;
    if (index < 0) {
      // Wrap around from the end
      actualIndex = colors.length + (index % colors.length);
    } else if (index >= colors.length) {
      // Wrap around from the beginning
      actualIndex = index % colors.length;
    } else {
      actualIndex = index;
    }

    result.push(colors[actualIndex]!);
  }

  return result;
};

export const useChartPalette = ({
  chartThemeName,
  customPalette,
  themePaletteName,
  dataLength,
}: {
  chartThemeName: PaletteName;
  customPalette?: string[];
  themePaletteName: keyof ChartColorPalette;
  dataLength: number;
}) => {
  const { theme } = useTheme();
  const paletteFromTheme = theme[themePaletteName] || theme.defaultChartPalette;
  const paletteFromChartTheme = getPalette(chartThemeName);

  const palette = customPalette || paletteFromTheme || paletteFromChartTheme.colors;

  return useMemo(() => {
    return getDistributedColors(palette, dataLength);
  }, [palette, dataLength]);
};
