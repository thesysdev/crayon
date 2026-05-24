import type { Meta, StoryObj } from "@storybook/react";
import { SectionV2 } from "../SectionV2";
import { FoldableSectionItem, FoldableSectionContent, FoldableSectionRoot, FoldableSectionTrigger } from "../FoldableSection";

const meta: Meta<typeof SectionV2> = {
  title: "Components/SectionBlock",
  component: SectionV2,
  subcomponents: {
    FoldableSectionRoot: FoldableSectionRoot as any,
    FoldableSectionItem: FoldableSectionItem as any,
    FoldableSectionTrigger: FoldableSectionTrigger as any,
    FoldableSectionContent: FoldableSectionContent as any,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { SectionV2, FoldableSectionRoot, FoldableSectionItem, FoldableSectionTrigger, FoldableSectionContent } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    trigger: {
      control: "text",
      description: "Section header label",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    children: {
      control: false,
      description: "Section body content",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof SectionV2>;

export const Default: Story = {
  args: {
    trigger: "Details",
    children: (
      <div style={{ padding: "12px 0", color: "var(--openui-text-neutral-secondary)" }}>
        This is a basic section block with a separator and header.
      </div>
    ),
  },
};

export const WithRichContent: Story = {
  args: {
    trigger: "Configuration",
    children: (
      <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Option A</span>
          <span style={{ color: "var(--openui-text-neutral-secondary)" }}>Enabled</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Option B</span>
          <span style={{ color: "var(--openui-text-neutral-secondary)" }}>Disabled</span>
        </div>
      </div>
    ),
  },
};

export const Foldable: Story = {
  name: "FoldableSection",
  render: () => (
    <div style={{ width: "400px" }}>
      <FoldableSectionRoot type="multiple">
        <FoldableSectionItem value="item-1">
          <FoldableSectionTrigger text="Usage statistics" />
          <FoldableSectionContent>
            <div style={{ padding: "8px 0 12px", color: "var(--openui-text-neutral-secondary)" }}>
              Charts and data about usage patterns appear here.
            </div>
          </FoldableSectionContent>
        </FoldableSectionItem>
        <FoldableSectionItem value="item-2">
          <FoldableSectionTrigger text="Advanced settings" />
          <FoldableSectionContent>
            <div style={{ padding: "8px 0 12px", color: "var(--openui-text-neutral-secondary)" }}>
              Additional configuration options for power users.
            </div>
          </FoldableSectionContent>
        </FoldableSectionItem>
      </FoldableSectionRoot>
    </div>
  ),
};
