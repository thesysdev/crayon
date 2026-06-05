"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

// Non-rendering data type components (schema-only, for LLM documentation)
const Series = defineComponent({
  name: "Series",
  props: z.object({ name: z.string(), data: z.array(z.number()) }),
  description: "One data series with a name and array of numeric values",
  component: () => null,
});

const Slice = defineComponent({
  name: "Slice",
  props: z.object({ name: z.string(), value: z.number() }),
  description: "One slice with a label and value for pie charts",
  component: () => null,
});

// Content
import { CodeBlock } from "./components/code-block";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { Separator } from "./components/separator";
import { TextContent } from "./components/text-content";

// Data display
import { Alert } from "./components/alert";
import { Avatar } from "./components/avatar";
import { Badge } from "./components/badge";
import { Card, CardHeader } from "./components/card";
import { ImageBlock, ImageComponent } from "./components/image";
import { Progress } from "./components/progress";

// Charts
import {
  AreaChartComponent,
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
} from "./components/charts";

// Forms
import { CheckBoxGroup, CheckBoxItem } from "./components/checkbox-group";
import { DatePicker } from "./components/date-picker";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { Input } from "./components/input";
import { RadioGroup, RadioItem } from "./components/radio-group";
import { Select, SelectItem } from "./components/select";
import { Slider } from "./components/slider";
import { SwitchGroup, SwitchItem } from "./components/switch-group";
import { TextArea } from "./components/textarea";

// Buttons
import { Button } from "./components/button";
import { Buttons } from "./components/buttons";

// Layout
import { Accordion, AccordionItemDef } from "./components/accordion";
import { Stack } from "./components/stack";
import { TabItem, Tabs } from "./components/tabs";

// Tables
import { Col, Table } from "./components/table";

const muiComponents = [
  // Content
  TextContent,
  Separator,
  CodeBlock,
  MarkDownRenderer,

  // Data display
  Card,
  CardHeader,
  Avatar,
  Badge,
  Alert,
  Progress,
  ImageBlock,
  ImageComponent,

  // Charts
  BarChartComponent,
  LineChartComponent,
  AreaChartComponent,
  PieChartComponent,
  Series,
  Slice,

  // Forms
  Form,
  FormControl,
  Input,
  TextArea,
  Select,
  SelectItem,
  CheckBoxGroup,
  CheckBoxItem,
  RadioGroup,
  RadioItem,
  SwitchGroup,
  SwitchItem,
  Slider,
  DatePicker,

  // Buttons
  Button,
  Buttons,

  // Layout
  Stack,
  Tabs,
  TabItem,
  Accordion,
  AccordionItemDef,

  // Tables
  Table,
  Col,
];

export const muiComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: ["TextContent", "Separator", "CodeBlock"],
    notes: ["Markdown supported in TextContent"],
  },
  {
    name: "Data Display",
    components: ["Card", "CardHeader", "Badge", "Avatar", "Alert", "Progress", "ImageBlock"],
    notes: ["Use Card/CardHeader for grouped content sections"],
  },
  {
    name: "Charts",
    components: ["BarChart", "LineChart", "AreaChart", "PieChart"],
    notes: ["Charts use Recharts under the hood"],
  },
  {
    name: "Forms",
    components: [
      "Form",
      "FormControl",
      "Input",
      "TextArea",
      "Select",
      "CheckBoxGroup",
      "RadioGroup",
      "SwitchGroup",
      "Slider",
      "DatePicker",
    ],
    notes: ["Use Form/FormControl/Input for form elements"],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Layout",
    components: ["Stack", "Tabs", "Accordion"],
    notes: ["Use Stack as the root container"],
  },
  {
    name: "Tables",
    components: ["Table"],
    notes: ["Use Table with Col definitions for tabular data"],
  },
];

const muiExamples: string[] = [
  `Example 1 — Table (column-oriented):

root = Stack([title, tbl])
title = TextContent("Top Languages", "large-heavy")
tbl = Table([Col("Language", langs), Col("Users (M)", users), Col("Year", years)])
langs = ["Python", "JavaScript", "Java", "TypeScript", "Go"]
users = [15.7, 14.2, 12.1, 8.5, 5.2]
years = [1991, 1995, 1995, 2012, 2009]`,

  `Example 2 — Bar chart:

root = Stack([title, chart])
title = TextContent("Q4 Revenue", "large-heavy")
chart = BarChart(labels, [s1, s2])
labels = ["Oct", "Nov", "Dec"]
s1 = Series("Product A", [120, 150, 180])
s2 = Series("Product B", [90, 110, 140])`,

  `Example 3 — Form:

root = Stack([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary"), Button("Cancel", Action([@ToAssistant("Cancel")]), "secondary")])`,
];

export const muiAdditionalRules: string[] = [
  "You are building UI with Material UI components.",
  "Use Card/CardHeader for grouped content sections.",
  "Use Stack as the root container.",
  "Use Form/FormControl/Input for form elements.",
  "Use Table with Col definitions for tabular data.",
];

export const muiLibrary = createLibrary({
  components: muiComponents,
  root: "Stack",
  componentGroups: muiComponentGroups,
});

export const muiPromptOptions: PromptOptions = {
  examples: muiExamples,
  additionalRules: muiAdditionalRules,
};
