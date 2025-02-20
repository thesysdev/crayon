import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../Card";
import { Steps, StepsProps } from "../Steps";

const stepsData = [
  {
    title: "Calorie Surplus",
    details:
      "Explore effective methods for gaining weight in a healthy way, such as creating balanced meal plans, incorporating resistance exercises, and focusing on nutrient-rich foods.",
  },
  {
    title: "Protein Intake",
    details:
      "Uncover effective approaches to achieve healthy weight gain, including designing nutritious meal schedules, engaging in strength workouts, and utilizing dietary supplements.",
  },
  {
    title: "Resistance Training",
    details:
      "Learn about optimal techniques for healthy weight gain, featuring personalized meal strategies, weightlifting routines, and essential vitamins and minerals.",
  },
  {
    title: "Rest and Recovery",
    details:
      "Find out the top tips for gaining weight healthily, like meal prepping, doing strength training exercises, and choosing high-calorie, nutritious snacks.",
  },
];

const meta: Meta<StepsProps> = {
  title: "Components/Steps",
  component: Steps,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Steps } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  tags: ["!dev", "autodocs"],
  argTypes: {
    steps: {
      control: false,
      description:
        "Array of step objects containing title and details. Title is a string and details is a React Node.",
      table: {
        category: "Content",
        type: { summary: "Step[]" },
        defaultValue: { summary: "[]" },
        required: true,
      },
    },
  },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StepsStory: Story = {
  name: "Steps",
  args: {
    steps: stepsData,
  },
  render: (args) => (
    <Card style={{ width: "500px" }}>
      <Steps {...args} />
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `
const steps = [
  {
    title: "Calorie Surplus",
    details: "Explore effective methods for gaining weight in a healthy way...",
  },
  {
    title: "Protein Intake",
    details: "Uncover effective approaches to achieve healthy weight gain...",
  },
  {
    title: "Resistance Training",
    details: "Learn about optimal techniques for healthy weight gain...",
  },
  {
    title: "Rest and Recovery",
    details: "Find out the top tips for gaining weight healthily...",
  },
];

<Card style={{ width: "500px" }}>
  <Steps steps={steps} />
</Card>`,
      },
    },
  },
};
