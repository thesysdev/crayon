import { createLibrary, defineComponent } from "@openuidev/lang-core";
import type { ComponentLibrary } from "@openuidev/thesys-server";
import { z } from "zod";
import { shadcnComponentGroups, shadcnPromptOptions } from "./metadata";

// ── Action schema (no React import required) ──────────────────────────────────

const actionSchema = z
  .union([
    z.object({ type: z.literal("continue_conversation"), context: z.string().optional() }),
    z.object({ type: z.literal("open_url"), url: z.string() }),
    z.object({ type: z.string(), params: z.record(z.string(), z.unknown()).optional() }),
  ])
  .optional();

// ── Validation rules schema ───────────────────────────────────────────────────

const rulesSchema = z
  .object({
    required: z.boolean().optional(),
    email: z.boolean().optional(),
    url: z.boolean().optional(),
    numeric: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  })
  .optional();

// ── Inline series/slice schemas (charts use these inline, not as refs) ────────

const SeriesSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});

const SliceSchema = z.object({
  category: z.string(),
  value: z.number(),
});

// ── Component definitions (schema-only, component: null as never) ─────────────

const Series = defineComponent({
  name: "Series",
  props: SeriesSchema,
  description: "One named data series with values matching labels.",
  component: null as never,
});

const Slice = defineComponent({
  name: "Slice",
  props: SliceSchema,
  description: "A single slice in a PieChart or RadialChart.",
  component: null as never,
});

const Point = defineComponent({
  name: "Point",
  props: z.object({ x: z.number(), y: z.number(), label: z.string().optional() }),
  description: "A single data point in a ScatterChart series.",
  component: null as never,
});

const ScatterSeries = defineComponent({
  name: "ScatterSeries",
  props: z.object({ category: z.string(), points: z.array(Point.ref) }),
  description: "Named scatter series with Point references.",
  component: null as never,
});

const AccordionItemDef = defineComponent({
  name: "AccordionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.any()),
  }),
  description: "Collapsible item inside Accordion. value: unique id, trigger: header text.",
  component: null as never,
});

const Accordion = defineComponent({
  name: "Accordion",
  props: z.object({
    items: z.array(AccordionItemDef.ref),
    type: z.enum(["single", "multiple"]).optional(),
  }),
  description: 'Collapsible sections. type: "single" | "multiple". items: AccordionItem[].',
  component: null as never,
});

const AlertDialogBlock = defineComponent({
  name: "AlertDialogBlock",
  props: z.object({
    triggerLabel: z.string(),
    title: z.string(),
    description: z.string(),
    confirmLabel: z.string().optional(),
    cancelLabel: z.string().optional(),
    triggerVariant: z
      .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
      .optional(),
  }),
  description:
    "Confirmation dialog with cancel and confirm buttons. Clicking confirm sends the confirmLabel as a message.",
  component: null as never,
});

const Alert = defineComponent({
  name: "Alert",
  props: z.object({
    title: z.string(),
    description: z.string(),
    variant: z.enum(["default", "destructive", "info", "success", "warning"]).optional(),
  }),
  description:
    'Alert banner with icon, title, and description. variant: "default" | "destructive" | "info" | "success" | "warning".',
  component: null as never,
});

const Avatar = defineComponent({
  name: "Avatar",
  props: z.object({
    src: z.string().optional(),
    alt: z.string().optional(),
    fallback: z.string(),
  }),
  description: "Circular avatar with image and fallback text.",
  component: null as never,
});

const ShadcnBadgeComponent = defineComponent({
  name: "Badge",
  props: z.object({
    text: z.string(),
    variant: z.enum(["default", "secondary", "destructive", "outline", "ghost", "link"]).optional(),
  }),
  description:
    'Inline label/badge. variant: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link".',
  component: null as never,
});

const Button = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: actionSchema,
    variant: z
      .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
      .optional(),
    size: z.enum(["default", "xs", "sm", "lg", "icon"]).optional(),
  }),
  description:
    'Clickable button. variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link". size: "default" | "xs" | "sm" | "lg" | "icon". action: { type: "continue_conversation" | "open_url", url? }.',
  component: null as never,
});

const Buttons = defineComponent({
  name: "Buttons",
  props: z.object({
    buttons: z.array(Button.ref),
    direction: z.enum(["row", "column"]).optional(),
  }),
  description: 'Group of Button components. direction: "row" | "column".',
  component: null as never,
});

const CalendarBlock = defineComponent({
  name: "CalendarBlock",
  props: z.object({
    mode: z.enum(["single", "multiple", "range"]).optional(),
    defaultMonth: z.string().optional(),
    numberOfMonths: z.number().optional(),
    captionLayout: z.enum(["label", "dropdown"]).optional(),
  }),
  description:
    'Standalone calendar display. mode: "single" | "multiple" | "range". captionLayout: "label" | "dropdown" (default "dropdown"). numberOfMonths defaults to 1.',
  component: null as never,
});

const CardHeader = defineComponent({
  name: "CardHeader",
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
  description: "Title/description header block for a Card.",
  component: null as never,
});

const Carousel = defineComponent({
  name: "Carousel",
  props: z.object({
    slides: z.array(z.array(z.any())),
    variant: z.enum(["default", "card"]).optional(),
  }),
  description:
    'Horizontal sliding content. slides: array of slide arrays. variant: "default" | "card".',
  component: null as never,
});

const BarChartCondensed = defineComponent({
  name: "BarChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    variant: z.enum(["grouped", "stacked"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Vertical bar chart. Use for comparing values across categories.",
  component: null as never,
});

const LineChartCondensed = defineComponent({
  name: "LineChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Line chart for trends over categories.",
  component: null as never,
});

const AreaChartCondensed = defineComponent({
  name: "AreaChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Area chart for showing volume over categories.",
  component: null as never,
});

const PieChartComponent = defineComponent({
  name: "PieChart",
  props: z.object({
    slices: z.array(SliceSchema),
    donut: z.boolean().optional(),
  }),
  description: "Pie or donut chart. slices: Slice[], donut: boolean for ring chart.",
  component: null as never,
});

const RadarChartComponent = defineComponent({
  name: "RadarChart",
  props: z.object({
    labels: z.array(z.string()),
    series: z.array(SeriesSchema),
  }),
  description: "Radar/spider chart for multi-dimensional comparison.",
  component: null as never,
});

const RadialChartComponent = defineComponent({
  name: "RadialChart",
  props: z.object({
    slices: z.array(SliceSchema),
  }),
  description: "Radial bar chart for displaying categorized values in rings.",
  component: null as never,
});

const ScatterChartComponent = defineComponent({
  name: "ScatterChart",
  props: z.object({
    series: z.array(ScatterSeries.ref),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Scatter plot with named series of Point references.",
  component: null as never,
});

const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "Option in a CheckBoxGroup.",
  component: null as never,
});

const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: z.object({
    name: z.string(),
    items: z.array(CheckBoxItem.ref),
  }),
  description: "Multiple checkbox options. items: CheckBoxItem[].",
  component: null as never,
});

const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: z.object({
    code: z.string(),
    language: z.string().optional(),
    title: z.string().optional(),
  }),
  description: "Syntax-highlighted code block with optional language and title.",
  component: null as never,
});

const DatePicker = defineComponent({
  name: "DatePicker",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
  }),
  description: "Date selection input with calendar popover.",
  component: null as never,
});

const DialogBlock = defineComponent({
  name: "DialogBlock",
  props: z.object({
    triggerLabel: z.string(),
    title: z.string(),
    description: z.string().optional(),
    content: z.array(z.any()).default([]),
    triggerVariant: z
      .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
      .optional(),
  }),
  description:
    "Modal dialog triggered by a button. triggerLabel: button text, title/description in header, content: children rendered inside.",
  component: null as never,
});

const DrawerBlock = defineComponent({
  name: "DrawerBlock",
  props: z.object({
    triggerLabel: z.string(),
    title: z.string(),
    description: z.string().optional(),
    content: z.array(z.any()).default([]),
  }),
  description:
    "Bottom drawer panel triggered by a button. triggerLabel: button text, title/description in header, content: children rendered inside.",
  component: null as never,
});

const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({ text: z.string() }),
  description: "Clickable follow-up suggestion — sends text as user message when clicked.",
  component: null as never,
});

const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({ items: z.array(FollowUpItem.ref) }),
  description: "List of follow-up suggestion chips at the end of a response.",
  component: null as never,
});

const FormControl = defineComponent({
  name: "FormControl",
  props: z.object({ label: z.string(), field: z.any() }),
  description: "Wraps a form field with a label and error display.",
  component: null as never,
});

const Form = defineComponent({
  name: "Form",
  props: z.object({
    name: z.string(),
    buttons: Buttons.ref,
    fields: z.array(FormControl.ref).default([]),
  }),
  description:
    "Form container with fields and explicit action buttons. fields: FormControl[], buttons: Buttons.",
  component: null as never,
});

const Image = defineComponent({
  name: "Image",
  props: z.object({ src: z.string(), alt: z.string().optional() }),
  description: "Displays an image with optional alt text.",
  component: null as never,
});

const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: z.object({
    src: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  }),
  description: "Image with optional caption.",
  component: null as never,
});

const Input = defineComponent({
  name: "Input",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    type: z.enum(["text", "email", "password", "number", "url"]).optional(),
    rules: rulesSchema,
  }),
  description:
    'Text input field. type: "text" | "email" | "password" | "number" | "url". rules for validation.',
  component: null as never,
});

const Label = defineComponent({
  name: "Label",
  props: z.object({ text: z.string(), htmlFor: z.string().optional() }),
  description: "Form label. Optionally links to an input via htmlFor.",
  component: null as never,
});

const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: z.object({ text: z.string() }),
  description: "Renders markdown text with GFM support.",
  component: null as never,
});

const PaginationBlock = defineComponent({
  name: "PaginationBlock",
  props: z.object({ currentPage: z.number(), totalPages: z.number() }),
  description: "Page navigation. currentPage and totalPages control which pages are shown.",
  component: null as never,
});

const Progress = defineComponent({
  name: "Progress",
  props: z.object({ value: z.number(), label: z.string().optional() }),
  description: "Progress bar showing completion percentage (0-100). Optional label.",
  component: null as never,
});

const RadioItem = defineComponent({
  name: "RadioItem",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "Option in a RadioGroup.",
  component: null as never,
});

const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: z.object({ name: z.string(), items: z.array(RadioItem.ref) }),
  description: "Radio selection group. items: RadioItem[].",
  component: null as never,
});

const SelectItem = defineComponent({
  name: "SelectItem",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "Option for Select dropdown.",
  component: null as never,
});

const Select = defineComponent({
  name: "Select",
  props: z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: rulesSchema,
  }),
  description: "Dropdown select. items: SelectItem[], placeholder, rules for validation.",
  component: null as never,
});

const Separator = defineComponent({
  name: "Separator",
  props: z.object({ orientation: z.enum(["horizontal", "vertical"]).optional() }),
  description: 'Horizontal or vertical rule. orientation: "horizontal" | "vertical".',
  component: null as never,
});

const Slider = defineComponent({
  name: "Slider",
  props: z.object({
    name: z.string(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    defaultValue: z.number().optional(),
  }),
  description: "Range slider input. min, max, step, defaultValue.",
  component: null as never,
});

const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: z.object({ value: z.string(), label: z.string() }),
  description: "Toggle option in a SwitchGroup.",
  component: null as never,
});

const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: z.object({ name: z.string(), items: z.array(SwitchItem.ref) }),
  description: "Group of toggle switches. items: SwitchItem[].",
  component: null as never,
});

const Col = defineComponent({
  name: "Col",
  props: z.object({
    header: z.string(),
    type: z.enum(["string", "number", "boolean"]).optional(),
  }),
  description: "Column definition for Table — header label and optional type.",
  component: null as never,
});

const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
    rows: z.array(z.array(z.any())),
  }),
  description: "Data table. columns: Col[] with header/type, rows: 2D array of values.",
  component: null as never,
});

const TabItem = defineComponent({
  name: "TabItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.any()),
  }),
  description: "Tab panel. value: unique id, trigger: tab label, content: children.",
  component: null as never,
});

const Tabs = defineComponent({
  name: "Tabs",
  props: z.object({
    items: z.array(TabItem.ref),
    defaultValue: z.string().optional(),
  }),
  description: "Tabbed content. items: TabItem[]. defaultValue: initially active tab.",
  component: null as never,
});

const Tag = defineComponent({
  name: "Tag",
  props: z.object({
    text: z.string(),
    variant: z.enum(["default", "secondary", "destructive", "outline", "ghost"]).optional(),
  }),
  description: "Styled tag/badge. Used inside TagBlock.",
  component: null as never,
});

const TagBlock = defineComponent({
  name: "TagBlock",
  props: z.object({ tags: z.array(z.union([z.string(), Tag.ref])) }),
  description: "Group of tags. Accepts string array or Tag references.",
  component: null as never,
});

const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  description:
    'Text block with optional size. size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
  component: null as never,
});

const TextArea = defineComponent({
  name: "TextArea",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    rows: z.number().optional(),
    rules: rulesSchema,
  }),
  description: "Multi-line text input. rows sets visible height. rules for validation.",
  component: null as never,
});

const Heading = defineComponent({
  name: "Heading",
  props: z.object({
    text: z.string(),
    level: z.enum(["h1", "h2", "h3", "h4"]).optional(),
  }),
  description: 'Heading text. level: "h1" | "h2" | "h3" | "h4". Defaults to "h2".',
  component: null as never,
});

const Blockquote = defineComponent({
  name: "Blockquote",
  props: z.object({ text: z.string(), cite: z.string().optional() }),
  description: "Styled blockquote. Optional cite for attribution.",
  component: null as never,
});

const InlineCode = defineComponent({
  name: "InlineCode",
  props: z.object({ code: z.string() }),
  description: "Inline code snippet rendered with monospace font.",
  component: null as never,
});

// ── Card root ─────────────────────────────────────────────────────────────────

const ChatContentChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  CardHeader.ref,
  Alert.ref,
  ShadcnBadgeComponent.ref,
  Avatar.ref,
  CodeBlock.ref,
  Image.ref,
  ImageBlock.ref,
  Progress.ref,
  Separator.ref,
  BarChartCondensed.ref,
  LineChartCondensed.ref,
  AreaChartCondensed.ref,
  PieChartComponent.ref,
  RadarChartComponent.ref,
  RadialChartComponent.ref,
  ScatterChartComponent.ref,
  Table.ref,
  TagBlock.ref,
  Form.ref,
  Buttons.ref,
  Heading.ref,
  Blockquote.ref,
  InlineCode.ref,
  PaginationBlock.ref,
  DialogBlock.ref,
  AlertDialogBlock.ref,
  DrawerBlock.ref,
  CalendarBlock.ref,
  FollowUpBlock.ref,
  Tabs.ref,
  Carousel.ref,
]);

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({ children: z.array(ChatContentChildUnion) }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically.",
  component: null as never,
});

// ── Library ───────────────────────────────────────────────────────────────────

const lib = createLibrary({
  root: "Card",
  components: [
    ChatCard,
    CardHeader,
    TextContent,
    MarkDownRenderer,
    Alert,
    ShadcnBadgeComponent,
    Avatar,
    CodeBlock,
    Image,
    ImageBlock,
    Progress,
    Separator,
    Table,
    Col,
    BarChartCondensed,
    LineChartCondensed,
    AreaChartCondensed,
    PieChartComponent,
    RadarChartComponent,
    RadialChartComponent,
    ScatterChartComponent,
    Series,
    Slice,
    ScatterSeries,
    Point,
    Form,
    FormControl,
    Label,
    Input,
    TextArea,
    Select,
    SelectItem,
    DatePicker,
    Slider,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    SwitchGroup,
    SwitchItem,
    Button,
    Buttons,
    FollowUpBlock,
    FollowUpItem,
    Tabs,
    TabItem,
    Accordion,
    AccordionItemDef,
    Carousel,
    TagBlock,
    Tag,
    Heading,
    Blockquote,
    InlineCode,
    PaginationBlock,
    DialogBlock,
    AlertDialogBlock,
    DrawerBlock,
    CalendarBlock,
  ],
});

export const shadcnLibraryConfig: ComponentLibrary = {
  root: "Card",
  schema: lib.toJSONSchema(),
  componentGroups: shadcnComponentGroups,
  systemPromptOptions: shadcnPromptOptions,
};
