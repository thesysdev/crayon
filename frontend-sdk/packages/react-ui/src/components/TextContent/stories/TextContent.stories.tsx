import { Meta, StoryObj } from "@storybook/react";
import { TextContent } from "../TextContent";
import "../textContent.scss";
const meta: Meta<typeof TextContent> = {
  title: "Components/TextContent",
  component: TextContent,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["clear", "card", "sunk"],
      description: "Visual style variant of the text content",
    },
    children: {
      control: "text",
      description: "Content to be displayed",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextContent>;

export const Default: Story = {
  args: {
    children: "This is some sample text content.",
    variant: "sunk",
  },
};

export const Clear: Story = {
  args: {
    children: "This is text content with clear variant.",
    variant: "clear",
  },
};

export const Card: Story = {
  args: {
    children: "This is text content with card variant.",
    variant: "card",
  },
};

export const WithLongContent: Story = {
  args: {
    children: `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
      nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
      eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
      in culpa qui officia deserunt mollit anim id est laborum.
    `,
    variant: "sunk",
  },
};

export const WithHTMLContent: Story = {
  args: {
    children: (
      <>
        <h1>Heading 1</h1>
        <p>
          This is a paragraph with <strong>bold</strong> and <em>italic</em> text.
        </p>
        <h2>Heading 2</h2>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ul>
      </>
    ),
    variant: "card",
  },
};
