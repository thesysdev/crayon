import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "../CodeBlock";

const meta: Meta<typeof CodeBlock> = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  parameters: {
    layout: "centered",
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
