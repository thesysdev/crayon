import type { Meta, StoryObj } from "@storybook/react";
import { CircleCheck, CreditCard, DollarSign, Package, Stamp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../Table";

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
  tags: ["!dev", "autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "```tsx\nimport { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

// Basic Table Story
export const Basic: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead icon={<Stamp size={14} />}>Invoice</TableHead>
          <TableHead icon={<CircleCheck size={14} />}>Status</TableHead>
          <TableHead icon={<CreditCard size={14} />}>Method</TableHead>
          <TableHead icon={<DollarSign size={14} />}>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell>$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV003</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell>$350.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// Table with Footer Story
export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead icon={<Package size={14} />}>Product</TableHead>
          <TableHead icon={<Package size={14} />}>Quantity</TableHead>
          <TableHead icon={<Package size={14} />}>Price</TableHead>
          <TableHead icon={<Package size={14} />}>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Product A</TableCell>
          <TableCell>2</TableCell>
          <TableCell>$50.00</TableCell>
          <TableCell>$100.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Product B</TableCell>
          <TableCell>1</TableCell>
          <TableCell>$75.00</TableCell>
          <TableCell>$75.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell>$175.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
