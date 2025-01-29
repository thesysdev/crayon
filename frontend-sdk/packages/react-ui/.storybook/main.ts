import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  previewHead: (head) => `
    ${head}
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.css">
  `,
  previewBody: (body) => `
    ${body}
    <style>
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
    </style>
  `,
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@crayonai/react-core": path.resolve(__dirname, "../../react-core/src/index.ts"),
        },
      },
      optimizeDeps: {
        exclude: ["@crayonai/react-core"],
        include: ["react", "react-dom"],
      },
      build: {
        commonjsOptions: {
          include: [/@crayonai\/react-core/, /node_modules/],
        },
      },
    });
  },
};
export default config;
