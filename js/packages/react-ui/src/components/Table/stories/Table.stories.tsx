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
          "```tsx\nimport { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@crayonai/react-ui';\n```",
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
        <TableRow>
          <TableCell>INV004</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Apple Pay</TableCell>
          <TableCell>$89.99</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV005</TableCell>
          <TableCell>Overdue</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell>$425.50</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV006</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Google Pay</TableCell>
          <TableCell>$199.99</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV007</TableCell>
          <TableCell>Processing</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell>$1,250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV008</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell>$67.25</TableCell>
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
          <TableCell>Wireless Headphones</TableCell>
          <TableCell>2</TableCell>
          <TableCell>$199.99</TableCell>
          <TableCell>$399.98</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bluetooth Speaker</TableCell>
          <TableCell>1</TableCell>
          <TableCell>$89.99</TableCell>
          <TableCell>$89.99</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>USB-C Cable (3m)</TableCell>
          <TableCell>3</TableCell>
          <TableCell>$24.99</TableCell>
          <TableCell>$74.97</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Power Bank 20000mAh</TableCell>
          <TableCell>1</TableCell>
          <TableCell>$49.99</TableCell>
          <TableCell>$49.99</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Wireless Mouse</TableCell>
          <TableCell>2</TableCell>
          <TableCell>$39.99</TableCell>
          <TableCell>$79.98</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Laptop Stand</TableCell>
          <TableCell>1</TableCell>
          <TableCell>$34.99</TableCell>
          <TableCell>$34.99</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell>$729.90</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

// Large Dataset Story
export const LargeDataset: Story = {
  render: () => (
    <Table>
      <TableCaption>Employee Performance Dashboard</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Employee ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Salary</TableHead>
          <TableHead>Join Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>EMP001</TableCell>
          <TableCell>Alice Johnson</TableCell>
          <TableCell>Engineering</TableCell>
          <TableCell>Senior Developer</TableCell>
          <TableCell>$120,000</TableCell>
          <TableCell>Jan 2020</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP002</TableCell>
          <TableCell>Bob Smith</TableCell>
          <TableCell>Design</TableCell>
          <TableCell>UX Designer</TableCell>
          <TableCell>$85,000</TableCell>
          <TableCell>Mar 2021</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP003</TableCell>
          <TableCell>Carol Williams</TableCell>
          <TableCell>Marketing</TableCell>
          <TableCell>Marketing Manager</TableCell>
          <TableCell>$95,000</TableCell>
          <TableCell>Jun 2019</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP004</TableCell>
          <TableCell>David Brown</TableCell>
          <TableCell>Sales</TableCell>
          <TableCell>Sales Representative</TableCell>
          <TableCell>$65,000</TableCell>
          <TableCell>Sep 2022</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP005</TableCell>
          <TableCell>Eve Davis</TableCell>
          <TableCell>Engineering</TableCell>
          <TableCell>DevOps Engineer</TableCell>
          <TableCell>$110,000</TableCell>
          <TableCell>Nov 2020</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP006</TableCell>
          <TableCell>Frank Miller</TableCell>
          <TableCell>HR</TableCell>
          <TableCell>HR Specialist</TableCell>
          <TableCell>$70,000</TableCell>
          <TableCell>Feb 2021</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP007</TableCell>
          <TableCell>Grace Wilson</TableCell>
          <TableCell>Finance</TableCell>
          <TableCell>Financial Analyst</TableCell>
          <TableCell>$80,000</TableCell>
          <TableCell>Aug 2021</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP008</TableCell>
          <TableCell>Henry Taylor</TableCell>
          <TableCell>Engineering</TableCell>
          <TableCell>Product Manager</TableCell>
          <TableCell>$130,000</TableCell>
          <TableCell>Apr 2018</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP009</TableCell>
          <TableCell>Ivy Anderson</TableCell>
          <TableCell>Design</TableCell>
          <TableCell>Graphic Designer</TableCell>
          <TableCell>$60,000</TableCell>
          <TableCell>Jan 2023</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>EMP010</TableCell>
          <TableCell>Jack Thompson</TableCell>
          <TableCell>Sales</TableCell>
          <TableCell>Sales Manager</TableCell>
          <TableCell>$105,000</TableCell>
          <TableCell>Jul 2019</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
