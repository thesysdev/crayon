import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../Button";
import { Label } from "../../Label";
import { ThemeProvider } from "../ThemeProvider";

type Story = StoryObj<typeof ThemeProvider>;

export const Default: Story = {
  args: {
    mode: "light",
  },
  render: (args) => (
    <ThemeProvider mode={args.mode} cssSelector=".openui-theme-provider-default-story">
      <div
        className="openui-theme-provider-default-story"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "280px",
          padding: "24px",
          borderRadius: "12px",
          background: "var(--openui-background)",
          color: "var(--openui-text-neutral-primary)",
          border: "1px solid var(--openui-border-default)",
        }}
      >
        <Label required>Theme provider preview</Label>
        <Button variant="primary">Primary button</Button>
        <Button variant="secondary">Secondary button</Button>
      </div>
    </ThemeProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: "A basic ThemeProvider example wrapping OpenUI components.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    mode: "dark",
  },
  render: (args) => (
    <ThemeProvider mode={args.mode} cssSelector=".openui-theme-provider-dark-story">
      <div
        className="openui-theme-provider-dark-story"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "280px",
          padding: "24px",
          borderRadius: "12px",
          background: "var(--openui-background)",
          color: "var(--openui-text-neutral-primary)",
          border: "1px solid var(--openui-border-default)",
        }}
      >
        <Label required>Dark theme preview</Label>
        <Button variant="primary">Primary button</Button>
        <Button variant="secondary">Secondary button</Button>
      </div>
    </ThemeProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: "ThemeProvider rendered with dark mode enabled.",
      },
    },
  },
};

export const CustomTheme: Story = {
  args: {
    mode: "light",
  },
  render: (args) => (
    <ThemeProvider
      mode={args.mode}
      cssSelector=".openui-theme-provider-custom-story"
      lightTheme={{
        background: "oklch(96% 0.03 260)",
        textNeutralPrimary: "oklch(20% 0.04 260)",
        interactiveAccentDefault: "oklch(55% 0.22 260)",
        interactiveAccentHover: "oklch(50% 0.22 260)",
        borderDefault: "oklch(75% 0.08 260)",
      }}
    >
      <div
        className="openui-theme-provider-custom-story"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "280px",
          padding: "24px",
          borderRadius: "12px",
          background: "var(--openui-background)",
          color: "var(--openui-text-neutral-primary)",
          border: "1px solid var(--openui-border-default)",
        }}
      >
        <Label required>Custom theme preview</Label>
        <Button variant="primary">Primary button</Button>
        <Button variant="secondary">Secondary button</Button>
      </div>
    </ThemeProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: "ThemeProvider with custom light theme token overrides.",
      },
    },
  },
};

const meta: Meta<typeof ThemeProvider> = {
  title: "Components/ThemeProvider",
  component: ThemeProvider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ThemeProvider } from '@openuidev/react-ui';\n```",
      },
    },
    controls: {
      exclude: ["children", "lightTheme", "darkTheme", "theme", "cssSelector"],
    },
  },
  argTypes: {
    mode: {
      control: "radio",
      options: ["light", "dark"],
      table: {
        category: "Appearance",
        defaultValue: { summary: "light" },
      },
    },
    children: {
      control: false,
      table: {
        disable: true,
      },
    },
    lightTheme: {
      control: false,
      table: {
        disable: true,
      },
    },
    darkTheme: {
      control: false,
      table: {
        disable: true,
      },
    },
    theme: {
      control: false,
      table: {
        disable: true,
      },
    },
    cssSelector: {
      control: false,
      table: {
        disable: true,
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
