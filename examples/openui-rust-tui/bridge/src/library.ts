import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod";

// The bridge only parses/evaluates OpenUI Lang — it never renders — so each
// component's `component` is a no-op. The Rust side is the renderer.
const noop = null as unknown as never;

const Series = defineComponent({
  name: "Series",
  description: "One data series for a chart.",
  props: z.object({ category: z.string(), values: z.array(z.number()) }),
  component: noop,
});

const Col = defineComponent({
  name: "Col",
  description: "A table column: a label plus its column data (one entry per row).",
  props: z.object({
    label: z.string(),
    data: z.array(z.union([z.string(), z.number()])),
    type: z.enum(["string", "number"]).optional(),
  }),
  component: noop,
});

const SelectItem = defineComponent({
  name: "SelectItem",
  description: "An option inside a Select.",
  props: z.object({ value: z.string(), label: z.string() }),
  component: noop,
});

const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  description: "A clickable follow-up suggestion; its text is sent to the assistant when chosen.",
  props: z.object({ text: z.string() }),
  component: noop,
});

const Button = defineComponent({
  name: "Button",
  description:
    'A clickable button. Provide an action Action([@ToAssistant("message")]) to control what is sent to the assistant.',
  props: z.object({
    label: z.string(),
    action: z.any().optional(),
    variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  }),
  component: noop,
});

const Input = defineComponent({
  name: "Input",
  description: "A single-line text field inside a Form.",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    type: z.enum(["text", "email", "password", "number", "url"]).optional(),
  }),
  component: noop,
});

const Select = defineComponent({
  name: "Select",
  description: "A single-choice dropdown inside a Form.",
  props: z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
  }),
  component: noop,
});

const FormControl = defineComponent({
  name: "FormControl",
  description: "A labelled form field wrapping one Input or Select.",
  props: z.object({
    label: z.string(),
    input: z.union([Input.ref, Select.ref]),
    hint: z.string().optional(),
  }),
  component: noop,
});

const Buttons = defineComponent({
  name: "Buttons",
  description: "A group of Button components.",
  props: z.object({
    buttons: z.array(Button.ref),
    direction: z.enum(["row", "column"]).optional(),
  }),
  component: noop,
});

const Form = defineComponent({
  name: "Form",
  description:
    "A form with fields and explicit action buttons. Provide Buttons(...) as the second argument.",
  props: z.object({
    name: z.string(),
    buttons: Buttons.ref,
    fields: z.array(FormControl.ref).default([]),
  }),
  component: noop,
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
  component: noop,
});

const Table = defineComponent({
  name: "Table",
  description: "A column-oriented data table. Each Col holds its own data array.",
  props: z.object({ columns: z.array(Col.ref) }),
  component: noop,
});

const TextContent = defineComponent({
  name: "TextContent",
  description: "A block of text. Optional size controls emphasis.",
  props: z.object({
    text: z.string(),
    size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  component: noop,
});

const CardHeader = defineComponent({
  name: "CardHeader",
  description: "A header with an optional title and subtitle.",
  props: z.object({ title: z.string().optional(), subtitle: z.string().optional() }),
  component: noop,
});

const Callout = defineComponent({
  name: "Callout",
  description:
    "A colored callout banner for highlights, tips, or status. Choose a variant matching the tone.",
  props: z.object({
    variant: z.enum(["info", "success", "warning", "error", "neutral"]),
    title: z.string(),
    description: z.string().optional(),
  }),
  component: noop,
});

const TagBlock = defineComponent({
  name: "TagBlock",
  description: "A row of short colored tags/pills (keywords, categories, or labels).",
  props: z.object({ tags: z.array(z.string()) }),
  component: noop,
});

const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  description: "A list of follow-up suggestions shown at the end of a response.",
  props: z.object({ items: z.array(FollowUpItem.ref) }),
  component: noop,
});

const Card = defineComponent({
  name: "Card",
  description: "The root container. Children stack vertically. Every response is a single Card.",
  props: z.object({ children: z.array(z.any()) }),
  component: noop,
});

export const library = createLibrary({
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
