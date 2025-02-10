import type { Preview } from "@storybook/react";
import { themes } from "@storybook/theming";
import "../src/components/index.scss";
import { ThemeProvider } from "../src/components/ThemeProvider";
import React from "react";

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
    backgrounds: {
      values: [
        { name: "Dark", value: "#333" },
        { name: "Light", value: "#F7F9F2" },
      ],
      default: "Light",
    },
    initialGlobal: {
      background: {
        value: "Light",
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [{
          value: "light",
          icon: "sun",
          title: "Light",
        }, {
          value: "dark",
          icon: "moon",
          title: "Dark",
        }],
        dynamicTitle: true,
      }
    }
  },
  decorators: [
    (Story, context) => {
      // Use the selected theme from toolbar
      const selectedTheme = context.globals.theme;
      
      
      return (
        <ThemeProvider mode={selectedTheme}>
          <Story />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
