import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "../DataTable";
import "../DataTable.scss";

const meta: Meta<typeof DataTable> = {
  title: "Components/DataTable",
  component: DataTable,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { DataTable } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;

type Story = StoryObj<typeof DataTable>;

const headers = ["Name", "Residence", "Earnings", "Investment", "Updates"];

const data = [
  {
    name: "John Doe",
    residence: "United states of America",
    earnings: 78910,
    investment: 78910,
    updates: "No dues",
  },
  {
    name: "Jane Doe",
    residence: "United Kingdom",
    earnings: 234567,
    investment: 234567,
    updates: "Overdue",
  },
  {
    name: "John Smith",
    residence: "United states of America",
    earnings: 345678,
    investment: 345678,
    updates: "All settled",
  },
  {
    name: "Jane Smith",
    residence: "Germany",
    earnings: 456789,
    investment: 456789,
    updates: "Overdue",
  },
  {
    name: "John Doe",
    residence: "Japan",
    earnings: 567890,
    investment: 567890,
    updates: "All settled",
  },
  {
    name: "Jane Doe",
    residence: "Australia",
    earnings: 678901,
    investment: 678901,
    updates: "Overdue",
  },
  {
    name: "John Smith",
    residence: "France",
    earnings: 789012,
    investment: 789012,
    updates: "Pending",
  },
  {
    name: "Jane Smith",
    residence: "India",
    earnings: 890123,
    investment: 890123,
    updates: "Overdue",
  },
  {
    name: "John Doe",
    residence: "United Arab Emirates",
    earnings: 901234,
    investment: 901234,
    updates: "Pending",
  },
  {
    name: "Jane Doe",
    residence: "United Kingdom",
    earnings: 12345,
    investment: 12345,
    updates: "All settled",
  },
  {
    name: "John Smith",
    residence: "Bangladesh",
    earnings: 987654,
    investment: 987654,
    updates: "No dues",
  },
  {
    name: "Jane Smith",
    residence: "Spain",
    earnings: 543210,
    investment: 543210,
    updates: "No dues",
  },
];

export const Default: Story = {
  args: {
    tableTitle: 'User Data',
    headers: headers,
    data: data,
  },
  render: (args) => (
    <div
      style={{
        width: '60vw',
        height: '60vh',
        padding: '20px',
        border: '1px solid #ccc',
        resize: 'both',
        overflow: 'auto',
      }}
    >
      <DataTable {...args} />
    </div>
  ),
}
