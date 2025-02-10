import type { Preview } from "@storybook/react";
import { themes } from "@storybook/theming";
import { ThemeProvider } from "../src/components/ThemeProvider";
import React from "react";
import "../src/components/index.scss";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: themes.dark,
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider mode="dark">
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
