import type { Meta, StoryObj } from "@storybook/react";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { MarkDownRenderer } from "../MarkDownRenderer";

const meta: Meta<typeof MarkDownRenderer> = {
  title: "Components/MarkDownRenderer",
  component: MarkDownRenderer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { MarkDownRenderer } from '@crayonai/react-ui';\n```",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["clear", "card", "sunk"],
      description: "The visual style variant of the renderer",
      table: {
        category: "Appearance",
        type: { summary: "'clear' | 'card' | 'sunk'" },
        defaultValue: { summary: "clear" },
      },
    },
    textMarkdown: {
      control: "text",
      description: "The markdown text to render",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    options: {
      control: false,
      description:
        "The options for the markdown renderer. See [here](https://github.com/remarkjs/react-markdown?tab=readme-ov-file#markdown)",
      table: {
        category: "Options",
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "600px",
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof MarkDownRenderer>;

export const Default: Story = {
  args: {
    variant: "clear",
    textMarkdown: "# Hello World\n\nThis is a simple markdown text.",
  },
};

export const WithCard: Story = {
  args: {
    variant: "card",
    textMarkdown: "# Hello World\n\nThis is markdown in a card variant.",
  },
};

export const WithSunk: Story = {
  args: {
    variant: "sunk",
    textMarkdown: "# Hello World\n\nThis is markdown in a sunk variant.",
  },
};

export const WithRichMarkdown: Story = {
  args: {
    variant: "card",
    options: {
      remarkPlugins: [remarkGfm, remarkMath, remarkEmoji, [remarkBreaks, { breaks: true }]],
      rehypePlugins: [rehypeKatex],
    },
    textMarkdown: `# Rich Markdown Example

## Text Formatting

**Bold text** and *italic text* and ~~strikethrough~~

## Lists

### Unordered List
- Item 1
- Item 2
  - Nested item
  - Another nested item
    - Nested item 3
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Links

[Example Link](https://example.com)

## Blockquotes

> This is a blockquote
> It can span multiple lines

## Code

Inline \`code\` example

\`\`\`javascript
// Code block
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Math (KaTeX)

Inline math: $E = mc^2$

Block math:

$$
\\frac{1}{\\Bigl(\\sqrt{\\phi \\sqrt{5}}-\\phi\\Bigr) e^{\\frac25 \\pi}} = 1+\\frac{e^{-2\\pi}} {1+\\frac{e^{-4\\pi}} {1+\\frac{e^{-6\\pi}} {1+\\frac{e^{-8\\pi}} {1+\\ldots} } } }
$$

## Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |

## Emojis

:smile: :heart:
`,
  },
  parameters: {
    docs: {
      source: {
        code: `
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

<MarkDownRenderer
  variant="card"
  options={{
    remarkPlugins: [remarkGfm, remarkMath, remarkEmoji, [remarkBreaks, { breaks: true }]],
    rehypePlugins: [rehypeKatex],
  }}
  textMarkdown={"
  # Rich Markdown Example

  ## Text Formatting

  **Bold text** and *italic text* and ~~strikethrough~~

  ## Lists

  ### Unordered List
  - Item 1
  - Item 2
    - Nested item
    - Another nested item
      - Nested item 3
  - Item 3

  ### Ordered List
  1. First item
  2. Second item
  3. Third item

  ## Links

  [Example Link](https://example.com)

  ## Blockquotes

  > This is a blockquote
  > It can span multiple lines

  ## Code

  Inline \`code\` example

  \`\`\`javascript
  // Code block
  function hello() {
    console.log("Hello, world!");
  }
  \`\`\`

  ## Math (KaTeX)

  Inline math: $E = mc^2$

  Block math:

  $$
  \\frac{1}{\\Bigl(\\sqrt{\\phi \\sqrt{5}}-\\phi\\Bigr) e^{\\frac25 \\pi}} = 1+\\frac{e^{-2\\pi}} {1+\\frac{e^{-4\\pi}} {1+\\frac{e^{-6\\pi}} {1+\\frac{e^{-8\\pi}} {1+\\ldots} } } }
  $$

  ## Tables

  | Header 1 | Header 2 | Header 3 |
  |----------|----------|----------|
  | Row 1    | Data     | Data     |
  | Row 2    | Data     | Data     |

  ## Emojis

  :smile: :heart:
"
}
/>
`,
        language: "tsx",
        type: "code",
      },
    },
  },
};
