import type { Meta, StoryObj } from "@storybook/react";
import { CircleCheck, CreditCard, DollarSign, Package, Stamp } from "lucide-react";
import {
  ScrollableTable,
  Table,
  TableBody,
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
          "```tsx\nimport { Table, ScrollableTable, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@openuidev/react-ui';\n```",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Basic: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead icon={<Stamp size={14} />}>Invoice</TableHead>
          <TableHead icon={<CircleCheck size={14} />}>Status</TableHead>
          <TableHead icon={<CreditCard size={14} />}>Method</TableHead>
          <TableHead icon={<DollarSign size={14} />} align="right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell align="right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell align="right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV003</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell align="right">$350.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV004</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Apple Pay</TableCell>
          <TableCell align="right">$89.99</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead icon={<Package size={14} />}>Product</TableHead>
          <TableHead align="right">Quantity</TableHead>
          <TableHead align="right">Price</TableHead>
          <TableHead align="right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Wireless Headphones</TableCell>
          <TableCell align="right">2</TableCell>
          <TableCell align="right">$199.99</TableCell>
          <TableCell align="right">$399.98</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bluetooth Speaker</TableCell>
          <TableCell align="right">1</TableCell>
          <TableCell align="right">$89.99</TableCell>
          <TableCell align="right">$89.99</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>USB-C Cable (3m)</TableCell>
          <TableCell align="right">3</TableCell>
          <TableCell align="right">$24.99</TableCell>
          <TableCell align="right">$74.97</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Power Bank 20000mAh</TableCell>
          <TableCell align="right">1</TableCell>
          <TableCell align="right">$49.99</TableCell>
          <TableCell align="right">$49.99</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell align="right">$614.93</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const HorizontalScroll: Story = {
  name: "Scrollable (Horizontal Overflow)",
  render: () => (
    <div style={{ maxWidth: 600 }}>
      <ScrollableTable>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead align="right">Salary</TableHead>
            <TableHead align="right">Bonus</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice Johnson</TableCell>
            <TableCell>Engineering</TableCell>
            <TableCell>Senior Developer</TableCell>
            <TableCell>San Francisco</TableCell>
            <TableCell>Jan 2020</TableCell>
            <TableCell align="right">$120,000</TableCell>
            <TableCell align="right">$15,000</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Smith</TableCell>
            <TableCell>Design</TableCell>
            <TableCell>UX Designer</TableCell>
            <TableCell>New York</TableCell>
            <TableCell>Mar 2021</TableCell>
            <TableCell align="right">$85,000</TableCell>
            <TableCell align="right">$8,500</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Carol Williams</TableCell>
            <TableCell>Marketing</TableCell>
            <TableCell>Marketing Manager</TableCell>
            <TableCell>Chicago</TableCell>
            <TableCell>Jun 2019</TableCell>
            <TableCell align="right">$95,000</TableCell>
            <TableCell align="right">$12,000</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>David Brown</TableCell>
            <TableCell>Sales</TableCell>
            <TableCell>Sales Representative</TableCell>
            <TableCell>Austin</TableCell>
            <TableCell>Sep 2022</TableCell>
            <TableCell align="right">$65,000</TableCell>
            <TableCell align="right">$9,750</TableCell>
            <TableCell>On Leave</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Eve Davis</TableCell>
            <TableCell>Engineering</TableCell>
            <TableCell>DevOps Engineer</TableCell>
            <TableCell>Seattle</TableCell>
            <TableCell>Nov 2020</TableCell>
            <TableCell align="right">$110,000</TableCell>
            <TableCell align="right">$13,200</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </ScrollableTable>
    </div>
  ),
};

export const NumberAlignment: Story = {
  name: "Right-Aligned Numbers",
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Quarter</TableHead>
          <TableHead align="right">Revenue</TableHead>
          <TableHead align="right">Expenses</TableHead>
          <TableHead align="right">Profit</TableHead>
          <TableHead align="right">Margin</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Q1 2024</TableCell>
          <TableCell align="right">$2,450,000</TableCell>
          <TableCell align="right">$1,820,000</TableCell>
          <TableCell align="right">$630,000</TableCell>
          <TableCell align="right">25.7%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Q2 2024</TableCell>
          <TableCell align="right">$2,780,000</TableCell>
          <TableCell align="right">$1,950,000</TableCell>
          <TableCell align="right">$830,000</TableCell>
          <TableCell align="right">29.9%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Q3 2024</TableCell>
          <TableCell align="right">$3,100,000</TableCell>
          <TableCell align="right">$2,100,000</TableCell>
          <TableCell align="right">$1,000,000</TableCell>
          <TableCell align="right">32.3%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Q4 2024</TableCell>
          <TableCell align="right">$3,520,000</TableCell>
          <TableCell align="right">$2,280,000</TableCell>
          <TableCell align="right">$1,240,000</TableCell>
          <TableCell align="right">35.2%</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell align="right">$11,850,000</TableCell>
          <TableCell align="right">$8,150,000</TableCell>
          <TableCell align="right">$3,700,000</TableCell>
          <TableCell align="right">31.2%</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
