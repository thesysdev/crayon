import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-onboarding",
    "@storybook/core-events",
    "@storybook/blocks",
  ],
  framework: "@storybook/react-vite",
  features: {},
  previewHead: (head) => `
  ${head}
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  `,
  previewBody: (body) => `
    ${body}
    <style>
      body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #1B1C1D;
      }
    </style>
  `,
  viteFinal: async (config) => {
    return mergeConfig(config, {
      base: "/ui/",
      resolve: {
        alias: {
          "@crayonai/react-core": path.resolve(__dirname, "../../react-core/src/index.ts"),
          "@crayonai/stream": path.resolve(__dirname, "../../stream/src/index.ts"),
        },
      },
      optimizeDeps: {
        exclude: ["@crayonai/react-core", "@crayonai/stream"],
        include: ["react", "react-dom"],
      },
      build: {
        commonjsOptions: {
          include: [/@crayonai\/react-core/, /node_modules/, /@crayonai\/stream/],
        },
      },
    });
  },
};
export default config;
