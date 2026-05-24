import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider } from "../ThemeProvider";

const meta: Meta<typeof ThemeProvider> = {
  title: "Components/ThemeProvider",
  component: ThemeProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "```tsx\nimport { ThemeProvider } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    mode: {
      control: "radio",
      options: ["light", "dark"],
      description: "Active color scheme",
      table: {
        category: "Appearance",
        type: { summary: "light | dark" },
        defaultValue: { summary: "light" },
      },
    },
    cssSelector: {
      control: "text",
      description: "CSS selector where custom properties are injected",
      table: {
        category: "Behavior",
        type: { summary: "string" },
        defaultValue: { summary: "body" },
      },
    },
  },
  tags: ["!dev", "!autodocs"],
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

export const Light: Story = {
  args: {
    mode: "light",
  },
  render: (args) => (
    <ThemeProvider {...args}>
      <div
        style={{
          padding: "32px",
          fontFamily: "var(--openui-font-body)",
          background: "var(--openui-background)",
          color: "var(--openui-foreground)",
        }}
      >
        <h1 style={{ fontSize: "24px", margin: "0 0 16px" }}>Light Theme</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p>The content below renders inside the ThemeProvider context.</p>
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              background: "var(--openui-elevated)",
              border: "1px solid var(--openui-border-interactive)",
            }}
          >
            This card uses themed tokens for background, border, and text colors.
          </div>
        </div>
      </div>
    </ThemeProvider>
  ),
};

export const Dark: Story = {
  args: {
    mode: "dark",
  },
  render: (args) => (
    <ThemeProvider {...args}>
      <div
        style={{
          padding: "32px",
          fontFamily: "var(--openui-font-body)",
          background: "var(--openui-background)",
          color: "var(--openui-foreground)",
          minHeight: "200px",
        }}
      >
        <h1 style={{ fontSize: "24px", margin: "0 0 16px" }}>Dark Theme</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p>The dark mode uses inverted surface colors.</p>
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              background: "var(--openui-elevated)",
              border: "1px solid var(--openui-border-interactive)",
            }}
          >
            Dark-themed card with automatic token resolution.
          </div>
        </div>
      </div>
    </ThemeProvider>
  ),
};
