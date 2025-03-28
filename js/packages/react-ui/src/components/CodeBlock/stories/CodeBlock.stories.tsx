import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "../CodeBlock";

const meta: Meta<typeof CodeBlock> = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { CodeBlock } from '@crayonai/react-ui';\n```",
      },
    },
  },
  argTypes: {
    language: {
      control: false,
      description: "The language of the code block",
      table: {
        category: "Appearance",
        type: { summary: "string" },
      },
    },
    codeString: {
      control: "text",
      description: "The code to display in the block",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    theme: {
      control: false,
      description:
        "The theme of the code block, see theme options [here](https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/master/AVAILABLE_STYLES_PRISM.MD)",
      table: {
        category: "Appearance",
        type: { summary: `{ [key: string]: CSSProperties; }` },
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const JavaScript: Story = {
  args: {
    language: "javascript",
    codeString: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`,
  },
};

export const Python: Story = {
  args: {
    language: "python",
    codeString: `def greet(name):
    return f"Hello, {name}!"

print(greet("World"))`,
  },
};

export const TypeScript: Story = {
  args: {
    language: "typescript",
    codeString: `interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = { name: 'World', age: 42 };
console.log(greet(user));`,
  },
};
