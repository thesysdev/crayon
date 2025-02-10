import type { Preview } from "@storybook/react";
import { background, themes } from "@storybook/theming";
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
    backgrounds: {
      values: [
        { name: "Dark", value: "#333" },
        { name: "Light", value: "#F7F9F2" },
      ],
      default: "Light",
      toolbar: {
        // cant hide it from the tool bar because it's a global setting
        hidden: true,
        disable: true,
      },
      grid: {
        disable: true,
      },
    },
    docs: {
      theme: themes.dark,
    },
    
  },
  initialGlobals: {
    backgrounds: {
      value: "#F7F9F2",
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          {
            value: "light",
            icon: "sun",
            title: "Light",
          },
          {
            value: "dark",
            icon: "moon",
            title: "Dark",
          },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Use the selected theme from toolbar
      const selectedTheme = context.globals.theme;
      const [, forceUpdate] = React.useState({});

      React.useEffect(() => {
        // Set background based on theme
        context.globals.backgrounds = {
          value: selectedTheme === 'dark' ? '#333' : '#F7F9F2'
        };
        // Force rerender
        forceUpdate({});
      }, [selectedTheme]);


      return (
        <ThemeProvider mode={selectedTheme}>
          <Story />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
