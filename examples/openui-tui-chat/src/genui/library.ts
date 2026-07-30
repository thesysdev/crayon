import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod";
import { views } from "./components.js";

// Leaf / structural components first so containers can reference `.ref`.

const Series = defineComponent({
  name: "Series",
  description: "One data series for a chart.",
  props: z.object({ category: z.string(), values: z.array(z.number()) }),
  component: views.Series,
});

const Col = defineComponent({
  name: "Col",
  description: "A table column: a label plus its column data (one entry per row).",
  props: z.object({
    label: z.string(),
    data: z.array(z.union([z.string(), z.number()])),
    type: z.enum(["string", "number"]).optional(),
  }),
  component: views.Col,
});

const SelectItem = defineComponent({
  name: "SelectItem",
  description: "An option inside a Select.",
  props: z.object({ value: z.string(), label: z.string() }),
  component: views.SelectItem,
});

const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  description: "A clickable follow-up suggestion. Its text is sent to the assistant when chosen.",
  props: z.object({ text: z.string() }),
  component: views.FollowUpItem,
});

const Button = defineComponent({
  name: "Button",
  description:
    "A clickable button. Provide an action Action([@ToAssistant(\"message\")]) to control what is sent to the assistant.",
  props: z.object({
    label: z.string(),
    action: z.any().optional(),
    variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  }),
  component: views.Button,
});

const Input = defineComponent({
  name: "Input",
  description: "A single-line text field inside a Form.",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  }),
  component: views.Input,
});

const Select = defineComponent({
  name: "Select",
  description: "A single-choice dropdown inside a Form.",
  props: z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
  }),
  component: views.Select,
});

const FormControl = defineComponent({
  name: "FormControl",
  description: "A labelled form field wrapping one Input or Select.",
  props: z.object({
    label: z.string(),
    input: z.union([Input.ref, Select.ref]),
    hint: z.string().optional(),
  }),
  component: views.FormControl,
});

const Buttons = defineComponent({
  name: "Buttons",
  description: "A group of Button components.",
  props: z.object({
    buttons: z.array(Button.ref),
    direction: z.enum(["row", "column"]).optional(),
  }),
  component: views.Buttons,
});

const Form = defineComponent({
  name: "Form",
  description: "A form with fields and explicit action buttons. Provide Buttons(...) as the second argument.",
  props: z.object({
    name: z.string(),
    buttons: Buttons.ref,
    fields: z.array(FormControl.ref).default([]),
  }),
  component: views.Form,
});

const BarChart = defineComponent({
  name: "BarChart",
  description: "A bar chart. Use for comparing values across categories.",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(Series.ref),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  component: views.BarChart,
});

const Table = defineComponent({
  name: "Table",
  description: "A column-oriented data table. Each Col holds its own data array.",
  props: z.object({ columns: z.array(Col.ref) }),
  component: views.Table,
});

const TextContent = defineComponent({
  name: "TextContent",
  description: "A block of text. Optional size controls emphasis.",
  props: z.object({
    text: z.string(),
    size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  component: views.TextContent,
});

const CardHeader = defineComponent({
  name: "CardHeader",
  description: "A header with an optional title and subtitle.",
  props: z.object({ title: z.string().optional(), subtitle: z.string().optional() }),
  component: views.CardHeader,
});

const Callout = defineComponent({
  name: "Callout",
  description:
    "A colored callout banner for highlights, tips, or status. Choose a variant that matches the tone.",
  props: z.object({
    variant: z.enum(["info", "success", "warning", "error", "neutral"]),
    title: z.string(),
    description: z.string().optional(),
  }),
  component: views.Callout,
});

const TagBlock = defineComponent({
  name: "TagBlock",
  description: "A row of short colored tags/pills (keywords, categories, or labels).",
  props: z.object({ tags: z.array(z.string()) }),
  component: views.TagBlock,
});

const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  description: "A list of follow-up suggestions shown at the end of a response.",
  props: z.object({ items: z.array(FollowUpItem.ref) }),
  component: views.FollowUpBlock,
});

const Card = defineComponent({
  name: "Card",
  description: "The root container. Children stack vertically. Every response is a single Card.",
  props: z.object({ children: z.array(z.any()) }),
  component: views.Card,
});

export const tuiLibrary = createLibrary({
  components: [
    Card,
    CardHeader,
    TextContent,
    Callout,
    TagBlock,
    Table,
    Col,
    BarChart,
    Series,
    FollowUpBlock,
    FollowUpItem,
    Form,
    FormControl,
    Input,
    Select,
    SelectItem,
    Buttons,
    Button,
  ],
  root: "Card",
});
