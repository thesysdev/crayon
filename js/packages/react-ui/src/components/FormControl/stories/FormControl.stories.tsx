import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { Input } from "../../Input";
import { Label } from "../../Label";
import { FormControl } from "../FormControl";
import { Hint } from "../Hint";

const meta: Meta<typeof FormControl> = {
  title: "Components/FormControl",
  component: FormControl,
  tags: ["!dev", "autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { FormControl, Hint } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description:
        "The child elements of the form control that accept Label, Input, and Hint components",
      table: {
        category: "Content",
        type: { summary: "ReactNode[] | ReactNode" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
    isError: {
      control: "boolean",
      description: "Toggles error styling for child inputs and hints",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormControl>;

export const WithLabelAndHint: Story = {
  render: (args) => (
    <FormControl>
      <Label htmlFor="username">Username</Label>
      <Input placeholder="Enter username" id="username" />
      <Hint>
        <Info size={14} />
        <span>Must be at least 4 characters long</span>
      </Hint>
    </FormControl>
  ),
};

export const WithMultipleChildren: Story = {
  render: (args) => (
    <FormControl>
      <Label htmlFor="profile-information">Profile Information</Label>
      <Input placeholder="Full name" id="profile-information" />
      <Input placeholder="Bio" />
      <Hint>This information will be displayed on your public profile</Hint>
    </FormControl>
  ),
};

export const LengthValidation: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const hasError = value.length > 0 && (value.length > 10 || value.length < 3);
    const helperText = hasError
      ? "Name must be between 3 and 10 characters"
      : "Enter a name between 3 and 10 characters";

    return (
      <div style={{ width: 420 }}>
        <FormControl isError={hasError}>
          <Label htmlFor="name-validated">Name</Label>
          <Input
            id="name-validated"
            placeholder="Type here"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Hint>
            {hasError ? <AlertCircle size={14} /> : <Info size={14} />}
            <span>{helperText}</span>
          </Hint>
        </FormControl>
      </div>
    );
  },
};
