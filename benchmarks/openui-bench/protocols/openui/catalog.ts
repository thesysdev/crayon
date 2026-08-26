import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));

// Resolve zod through lang-core so the catalog and the parser share one zod
// module instance (two instances break instanceof checks inside the library).
const { z } = require(require.resolve("zod/v4", { paths: [join(HERE, "../../../../packages/lang-core")] }));

export type PropSpec = {
  t: string;
  req?: boolean;
  enum?: string[];
  allowed?: string[];
};

export type CatalogEntry = { desc: string; props: [string, PropSpec][] };

export type ComponentGroup = { name: string; components: string[]; notes: string[] };

// ── defineComponent ──

// `ref` is an opaque marker, not a validating schema: nothing here parses model
// output through zod, so a ref only has to carry its component name into unions.
// `component` defaults to a null renderer because the benchmark never renders.
function defineComponent(def: {
  name: string;
  props: any;
  description: string;
  component?: () => null;
}) {
  return {
    name: def.name,
    props: def.props,
    description: def.description,
    component: def.component ?? (() => null),
    ref: z.unknown().meta({ componentRef: def.name }),
  };
}

// ── Shared value shapes ──

const strings = () => z.array(z.string());
const numbers = () => z.array(z.number());
const cells = () => z.array(z.union([z.string(), z.number()]));

const FieldRules = z.object({
  required: z.boolean().optional(),
  email: z.boolean().optional(),
  url: z.boolean().optional(),
  numeric: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
});

// Action steps and $binding types are stripped from this catalog: a button action
// is an opaque step list, and group values are opaque name/state maps.
const ActionSteps = () => z.array(z.unknown());
const CheckedMap = () => z.record(z.string(), z.boolean());

// ── Content ──

const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  description:
    'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
});

const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: z.object({
    textMarkdown: z.string(),
    variant: z.enum(["clear", "card", "sunk"]).optional(),
  }),
  description: "Renders markdown text with optional container variant",
});

const CardHeader = defineComponent({
  name: "CardHeader",
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
  description: "Header with optional title and subtitle",
});

const Callout = defineComponent({
  name: "Callout",
  props: z.object({
    variant: z.enum(["info", "warning", "error", "success", "neutral"]),
    title: z.string(),
    description: z.string(),
  }),
  description:
    "Callout banner. Optional visible is a reactive $boolean — auto-dismisses after 3s by setting $visible to false.",
});

const TextCallout = defineComponent({
  name: "TextCallout",
  props: z.object({
    variant: z.enum(["neutral", "info", "warning", "success", "danger"]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  description: "Text callout with variant, title, and description",
});

const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: z.object({
    language: z.string(),
    codeString: z.string(),
  }),
  description: "Syntax-highlighted code block",
});

const Image = defineComponent({
  name: "Image",
  props: z.object({
    alt: z.string(),
    src: z.string().optional(),
  }),
  description: "Image with alt text and optional URL",
});

const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: z.object({
    src: z.string(),
    alt: z.string().optional(),
  }),
  description: "Image block with loading state",
});

const ImageGallery = defineComponent({
  name: "ImageGallery",
  props: z.object({
    images: z.array(
      z.object({
        src: z.string(),
        alt: z.string().optional(),
        details: z.string().optional(),
      }),
    ),
  }),
  description: "Gallery grid of images with modal preview",
});

const Separator = defineComponent({
  name: "Separator",
  props: z.object({
    orientation: z.enum(["horizontal", "vertical"]).optional(),
    decorative: z.boolean().optional(),
  }),
  description: "Visual divider between content sections",
});

const Heading = defineComponent({
  name: "Heading",
  props: z.object({
    text: z.string(),
    level: z.enum(["h1", "h2", "h3", "h4"]).optional(),
  }),
  description: "Standalone heading",
});

const Blockquote = defineComponent({
  name: "Blockquote",
  props: z.object({
    text: z.string(),
    cite: z.string().optional(),
  }),
  description: "Quoted text with an optional citation",
});

const InlineCode = defineComponent({
  name: "InlineCode",
  props: z.object({
    code: z.string(),
  }),
  description: "Inline code span",
});

// ── Status and labels ──

const Alert = defineComponent({
  name: "Alert",
  props: z.object({
    title: z.string(),
    description: z.string(),
    variant: z.enum(["default", "destructive", "info", "success", "warning"]).optional(),
  }),
  description: "Alert banner with icon, title, and description",
});

const Avatar = defineComponent({
  name: "Avatar",
  props: z.object({
    src: z.string().optional(),
    alt: z.string().optional(),
    fallback: z.string(),
  }),
  description: "Avatar image with a text fallback",
});

const Badge = defineComponent({
  name: "Badge",
  props: z.object({
    text: z.string(),
    variant: z
      .enum(["default", "secondary", "destructive", "outline", "ghost", "link"])
      .optional(),
  }),
  description: "Small status or category badge",
});

const Progress = defineComponent({
  name: "Progress",
  props: z.object({
    value: z.number(),
    label: z.string().optional(),
  }),
  description: "Progress bar with an optional label",
});

const Tag = defineComponent({
  name: "Tag",
  props: z.object({
    text: z.string(),
    icon: z.string().optional(),
    size: z.enum(["sm", "md", "lg"]).optional(),
    variant: z.enum(["neutral", "info", "success", "warning", "danger"]).optional(),
  }),
  description: "Styled tag/badge with optional icon and variant",
});

const TagBlock = defineComponent({
  name: "TagBlock",
  props: z.object({
    tags: strings(),
  }),
  description: "tags is an array of strings",
});

// ── Charts ──

const Series = defineComponent({
  name: "Series",
  props: z.object({
    category: z.string(),
    values: numbers(),
  }),
  description: "One data series",
});

const Slice = defineComponent({
  name: "Slice",
  props: z.object({
    category: z.string(),
    value: z.number(),
  }),
  description: "One slice with label and numeric value",
});

const Point = defineComponent({
  name: "Point",
  props: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
  }),
  description: "Data point with numeric coordinates",
});

const ScatterSeries = defineComponent({
  name: "ScatterSeries",
  props: z.object({
    name: z.string(),
    points: z.array(Point.ref),
  }),
  description: "Named dataset",
});

const HorizontalBarChart = defineComponent({
  name: "HorizontalBarChart",
  props: z.object({
    labels: strings(),
    series: z.array(Series.ref),
    variant: z.enum(["grouped", "stacked"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Horizontal bars; prefer when category labels are long or for ranked lists",
});

const RadarChart = defineComponent({
  name: "RadarChart",
  props: z.object({
    labels: strings(),
    series: z.array(Series.ref),
  }),
  description:
    "Spider/web chart; use for comparing multiple variables across one or more entities",
});

const PieChart = defineComponent({
  name: "PieChart",
  props: z.object({
    labels: strings(),
    values: numbers(),
    variant: z.enum(["pie", "donut"]).optional(),
    appearance: z.enum(["circular", "semiCircular"]).optional(),
  }),
  description: "Circular slices; use plucked arrays: PieChart(data.categories, data.values)",
});

const RadialChart = defineComponent({
  name: "RadialChart",
  props: z.object({
    labels: strings(),
    values: numbers(),
  }),
  description: "Radial bars; use plucked arrays: RadialChart(data.categories, data.values)",
});

const SingleStackedBarChart = defineComponent({
  name: "SingleStackedBarChart",
  props: z.object({
    labels: strings(),
    values: numbers(),
  }),
  description:
    "Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)",
});

const ScatterChart = defineComponent({
  name: "ScatterChart",
  props: z.object({
    datasets: z.array(ScatterSeries.ref),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "X/Y scatter plot; use for correlations, distributions, and clustering",
});

const AreaChart = defineComponent({
  name: "AreaChart",
  props: z.object({
    labels: strings(),
    series: z.array(Series.ref),
    variant: z.enum(["linear", "natural", "step"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Filled area under lines; use for cumulative totals or volume trends over time",
});

const BarChart = defineComponent({
  name: "BarChart",
  props: z.object({
    labels: strings(),
    series: z.array(Series.ref),
    variant: z.enum(["grouped", "stacked"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Vertical bars; use for comparing values across categories with one or more series",
});

const LineChart = defineComponent({
  name: "LineChart",
  props: z.object({
    labels: strings(),
    series: z.array(Series.ref),
    variant: z.enum(["linear", "natural", "step"]).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
  }),
  description: "Lines over categories; use for trends and continuous data over time",
});

// ── Tables ──

const Col = defineComponent({
  name: "Col",
  props: z.object({
    label: z.string(),
    data: cells(),
    type: z.enum(["string", "number", "action"]).optional(),
  }),
  description: "Column definition — holds label + data array",
});

const Table = defineComponent({
  name: "Table",
  props: z.object({
    columns: z.array(Col.ref),
  }),
  description: "Data table — column-oriented. Each Col holds its own data array.",
});

// ── Forms ──

const Label = defineComponent({
  name: "Label",
  props: z.object({
    text: z.string(),
  }),
  description: "Text label",
});

const SelectItem = defineComponent({
  name: "SelectItem",
  props: z.object({
    value: z.string(),
    label: z.string(),
  }),
  description: "Option for Select",
});

const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: z.object({
    label: z.string(),
    description: z.string(),
    name: z.string(),
    defaultChecked: z.boolean().optional(),
  }),
  description: "CheckBoxItem",
});

const RadioItem = defineComponent({
  name: "RadioItem",
  props: z.object({
    label: z.string(),
    description: z.string(),
    value: z.string(),
  }),
  description: "RadioItem",
});

const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: z.object({
    label: z.string().optional(),
    description: z.string().optional(),
    name: z.string(),
    defaultChecked: z.boolean().optional(),
  }),
  description: "Individual switch toggle",
});

const Input = defineComponent({
  name: "Input",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    type: z.enum(["text", "email", "password", "number", "url"]).optional(),
    rules: FieldRules.optional(),
    value: z.string().optional(),
  }),
  description: "Input",
});

const TextArea = defineComponent({
  name: "TextArea",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    rows: z.number().optional(),
    rules: FieldRules.optional(),
    value: z.string().optional(),
  }),
  description: "TextArea",
});

const Select = defineComponent({
  name: "Select",
  props: z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: FieldRules.optional(),
    value: z.string().optional(),
    size: z.enum(["small", "medium", "large"]).optional(),
  }),
  description: "Select",
});

const DatePicker = defineComponent({
  name: "DatePicker",
  props: z.object({
    name: z.string(),
    mode: z.enum(["single", "range"]).optional(),
    rules: FieldRules.optional(),
    value: strings().optional(),
  }),
  description: "DatePicker",
});

const CalendarBlock = defineComponent({
  name: "CalendarBlock",
  props: z.object({
    mode: z.enum(["single", "multiple", "range"]).optional(),
    defaultMonth: z.string().optional(),
    numberOfMonths: z.number().optional(),
    captionLayout: z.enum(["label", "dropdown"]).optional(),
  }),
  description: "Inline calendar",
});

const Slider = defineComponent({
  name: "Slider",
  props: z.object({
    name: z.string(),
    variant: z.enum(["continuous", "discrete"]),
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
    defaultValue: numbers().optional(),
    label: z.string().optional(),
    rules: FieldRules.optional(),
    value: numbers().optional(),
  }),
  description: "Numeric slider input; supports continuous and discrete (stepped) variants",
});

const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: z.object({
    name: z.string(),
    items: z.array(CheckBoxItem.ref),
    rules: FieldRules.optional(),
    value: CheckedMap().optional(),
  }),
  description: "CheckBoxGroup",
});

const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: z.object({
    name: z.string(),
    items: z.array(RadioItem.ref),
    defaultValue: z.string().optional(),
    rules: FieldRules.optional(),
    value: z.string().optional(),
  }),
  description: "RadioGroup",
});

const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: z.object({
    name: z.string(),
    items: z.array(SwitchItem.ref),
    variant: z.enum(["clear", "card", "sunk"]).optional(),
    value: CheckedMap().optional(),
  }),
  description: "Group of switch toggles",
});

const FormControlInputUnion = z.union([
  Input.ref,
  TextArea.ref,
  Select.ref,
  DatePicker.ref,
  Slider.ref,
  CheckBoxGroup.ref,
  RadioGroup.ref,
]);

const FormControl = defineComponent({
  name: "FormControl",
  props: z.object({
    label: z.string(),
    input: FormControlInputUnion,
    hint: z.string().optional(),
  }),
  description: "Field with label, input component, and optional hint text",
});

// ── Buttons ──

const Button = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: ActionSteps().optional(),
    variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
    type: z.enum(["normal", "destructive"]).optional(),
    size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
  }),
  description: "Clickable button",
});

const Buttons = defineComponent({
  name: "Buttons",
  props: z.object({
    buttons: z.array(Button.ref),
    direction: z.enum(["row", "column"]).optional(),
  }),
  description: 'Group of Button components. direction: "row" (default) | "column".',
});

const Form = defineComponent({
  name: "Form",
  props: z.object({
    name: z.string(),
    buttons: Buttons.ref,
    fields: z.array(FormControl.ref),
  }),
  description: "Form container with fields and explicit action buttons",
});

// ── Steps ──

const StepsItem = defineComponent({
  name: "StepsItem",
  props: z.object({
    title: z.string(),
    details: z.string(),
  }),
  description: "title and details text for one step",
});

const Steps = defineComponent({
  name: "Steps",
  props: z.object({
    items: z.array(StepsItem.ref),
  }),
  description: "Step-by-step guide",
});

// ── Collections ──

const ListItem = defineComponent({
  name: "ListItem",
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    image: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
    actionLabel: z.string().optional(),
  }),
  description: "List row with a title, optional subtitle and image",
});

const ListBlock = defineComponent({
  name: "ListBlock",
  props: z.object({
    items: z.array(ListItem.ref),
    variant: z.enum(["number", "image"]).optional(),
  }),
  description: "A list of items with number or image indicators",
});

const FollowUpItem = defineComponent({
  name: "FollowUpItem",
  props: z.object({
    text: z.string(),
  }),
  description: "Clickable follow-up suggestion; when clicked, sends text as user message",
});

const FollowUpBlock = defineComponent({
  name: "FollowUpBlock",
  props: z.object({
    items: z.array(FollowUpItem.ref),
  }),
  description: "List of clickable follow-up suggestions placed at the end of a response",
});

const PaginationBlock = defineComponent({
  name: "PaginationBlock",
  props: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
  }),
  description: "Page navigation for long result sets",
});

// ── Child unions ──

// Published membership for TabItem.content, AccordionItem.content and Carousel
// slides. Do not extend: these three are spec components and their unions are the
// contract other clients read.
const ContentChildUnion = z.union([
  TextContent.ref,
  MarkDownRenderer.ref,
  CardHeader.ref,
  Callout.ref,
  TextCallout.ref,
  CodeBlock.ref,
  Image.ref,
  ImageBlock.ref,
  ImageGallery.ref,
  Separator.ref,
  HorizontalBarChart.ref,
  RadarChart.ref,
  PieChart.ref,
  RadialChart.ref,
  SingleStackedBarChart.ref,
  ScatterChart.ref,
  AreaChart.ref,
  BarChart.ref,
  LineChart.ref,
  Table.ref,
  TagBlock.ref,
  Form.ref,
  Buttons.ref,
  Steps.ref,
]);

// Components that ship outside the published spec and render as ordinary content.
const ExtraContentUnion = z.union([
  Heading.ref,
  Blockquote.ref,
  InlineCode.ref,
  Alert.ref,
  Badge.ref,
  Avatar.ref,
  Progress.ref,
  PaginationBlock.ref,
  CalendarBlock.ref,
  ListBlock.ref,
  FollowUpBlock.ref,
]);

const SectionContentUnion = z.union([
  ...ContentChildUnion.options,
  ListBlock.ref,
  FollowUpBlock.ref,
]);

// Benchmark decision: an overlay body takes the same content as a card, minus the
// containers that would nest an overlay or a tab strip inside an overlay.
const OverlayContentUnion = z.union([
  ...ContentChildUnion.options,
  ...ExtraContentUnion.options,
]);

// ── Sections, layout, overlays ──

const SectionItem = defineComponent({
  name: "SectionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(SectionContentUnion),
  }),
  description: "Section with a label and collapsible content, used inside SectionBlock",
});

const SectionBlock = defineComponent({
  name: "SectionBlock",
  props: z.object({
    sections: z.array(SectionItem.ref),
    isFoldable: z.boolean().optional(),
  }),
  description: "Collapsible accordion sections; use SectionItem for each section",
});

const TabItem = defineComponent({
  name: "TabItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(ContentChildUnion),
  }),
  description: "value is unique id, trigger is tab label, content is array of components",
});

const Tabs = defineComponent({
  name: "Tabs",
  props: z.object({
    items: z.array(TabItem.ref),
  }),
  description: "Tabbed container",
});

const AccordionItem = defineComponent({
  name: "AccordionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(ContentChildUnion),
  }),
  description: "value is unique id, trigger is section title",
});

const Accordion = defineComponent({
  name: "Accordion",
  props: z.object({
    items: z.array(AccordionItem.ref),
  }),
  description: "Collapsible sections",
});

// children is an array of slides, each slide an array of content, so it derives as
// a value slot rather than a component slot.
const Carousel = defineComponent({
  name: "Carousel",
  props: z.object({
    children: z.array(z.array(ContentChildUnion)),
    variant: z.enum(["card", "sunk"]).optional(),
  }),
  description: "Horizontal scrollable carousel",
});

const DialogBlock = defineComponent({
  name: "DialogBlock",
  props: z.object({
    triggerLabel: z.string(),
    title: z.string(),
    description: z.string().optional(),
    content: z.array(OverlayContentUnion).optional(),
    triggerVariant: z
      .enum(["default", "destructive", "outline", "secondary", "ghost", "link"])
      .optional(),
  }),
  description: "Button that opens a modal dialog with content",
});

const DrawerBlock = defineComponent({
  name: "DrawerBlock",
  props: z.object({
    triggerLabel: z.string(),
    title: z.string(),
    description: z.string().optional(),
    content: z.array(OverlayContentUnion).optional(),
  }),
  description: "Button that opens a slide-out drawer with content",
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
  description: "Button that opens a confirm/cancel dialog",
});

// ── Root ──

// Published Card membership plus the non-spec content components. Stack is in the
// published union but not in this catalog, so it is dropped rather than declared.
const CardChildUnion = z.union([
  ...ContentChildUnion.options,
  Tabs.ref,
  Carousel.ref,
  SectionBlock.ref,
  DialogBlock.ref,
  DrawerBlock.ref,
  AlertDialogBlock.ref,
  ...ExtraContentUnion.options,
]);

// desc is copied verbatim from the published spec, truncation included: it is
// prompt text that must not drift between pipelines.
const Card = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(CardChildUnion),
    variant: z.enum(["card", "sunk", "clear"]).optional(),
    direction: z.enum(["row", "column"]).optional(),
    gap: z.enum(["none", "xs", "s", "m", "l", "xl", "2xl"]).optional(),
    align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(),
    justify: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional(),
    wrap: z.boolean().optional(),
  }),
  description:
    'Styled container. variant: "card" (default, elevated) | "sunk" (recessed) | "clear" (transparent). Always full width. Accepts all Stack flex params (default: di',
});

// ── Component groups ──

export const componentGroups: ComponentGroup[] = [
  {
    name: "Root and layout",
    components: [
      "Card",
      "Tabs",
      "TabItem",
      "Accordion",
      "AccordionItem",
      "Steps",
      "StepsItem",
      "Carousel",
    ],
    notes: [
      "- Card is the root. Everything the user should see must hang off its children list, in reading order.",
      "- Tabs, Accordion and Steps take item references. Define each item on its own line instead of inlining the whole array.",
      "- Every slide of a Carousel must repeat the same component sequence.",
    ],
  },
  {
    name: "Content",
    components: [
      "CardHeader",
      "Heading",
      "TextContent",
      "MarkDownRenderer",
      "Blockquote",
      "InlineCode",
      "CodeBlock",
      "Image",
      "ImageBlock",
      "ImageGallery",
      "Separator",
    ],
    notes: [
      "- Name a section once. A CardHeader followed by a heading that repeats the same words is duplication.",
      "- MarkDownRenderer is for prose that carries its own structure; TextContent is for one short passage.",
      "- Use real, publicly reachable image URLs (e.g. https://picsum.photos/seed/KEYWORD/800/500). Never invent one.",
    ],
  },
  {
    name: "Status and labels",
    components: ["Callout", "TextCallout", "Alert", "Badge", "Tag", "TagBlock", "Progress", "Avatar"],
    notes: [
      "- Callout, TextCallout and Alert carry a message that needs attention. Badge and Tag label a value in place and carry no message.",
      "- Status colors live on Tag (success, warning, info, danger), TextCallout (success, warning, info, danger), Callout (success, warning, info, error) and Alert (success, warning, info, destructive) variants. Badge and Button variants are visual styles from their signatures only: Badge has no success or warning, Button has no ghost.",
      "- Progress shows one value against its whole. Several values compared against each other belong in a chart.",
    ],
  },
  {
    name: "Collections",
    components: [
      "ListBlock",
      "ListItem",
      "SectionBlock",
      "SectionItem",
      "FollowUpBlock",
      "FollowUpItem",
      "PaginationBlock",
    ],
    notes: [
      "- Use ListBlock when each entry is a title plus a line of detail. Use a table when every entry shares the same fields.",
      "- SectionBlock groups long content into collapsible sections; each SectionItem needs a unique value id and holds content components.",
      "- FollowUpBlock belongs at the very end and holds suggested next messages, not controls for the current screen.",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col"],
    notes: [
      "- Table is column-oriented: each Col carries the whole data array for its column, so every Col in a table must hold the same number of values.",
      "- A handful of unrelated facts is not a table. Reach for one only when entries share the same fields.",
    ],
  },
  {
    name: "Charts (2D)",
    components: ["BarChart", "LineChart", "AreaChart", "HorizontalBarChart", "RadarChart", "Series"],
    notes: [
      "- labels holds one entry per position on the category axis; each Series holds one value per label, in the same order.",
      "- Pick by the question: compare categories, follow a trend over time, show accumulation, rank long-named categories, or compare several measures for a few entities.",
    ],
  },
  {
    name: "Charts (1D)",
    components: ["PieChart", "RadialChart", "SingleStackedBarChart", "Slice"],
    notes: [
      "- These take two parallel arrays, labels and values in matching order, and show parts of one whole. They cannot show a trend.",
    ],
  },
  {
    name: "Charts (scatter)",
    components: ["ScatterChart", "ScatterSeries", "Point"],
    notes: [
      "- Use a scatter plot for the relationship between two numeric measures. Each ScatterSeries is one named group of Points.",
    ],
  },
  {
    name: "Forms",
    components: [
      "Form",
      "FormControl",
      "Label",
      "Input",
      "TextArea",
      "Select",
      "SelectItem",
      "DatePicker",
      "CalendarBlock",
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      "SwitchGroup",
      "SwitchItem",
    ],
    notes: [
      "- Define EACH FormControl as its own reference. Do NOT inline every control in one array.",
      "- A FormControl wraps exactly one input: Input, TextArea, Select, DatePicker, Slider, CheckBoxGroup or RadioGroup.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument, and NEVER nest a Form inside a Form.",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
    notes: [
      "- A Button with no action sends its label back as a user message, which is what most screens want.",
      "- Group related buttons in one Buttons reference rather than scattering loose Button references.",
    ],
  },
  {
    name: "Overlays",
    components: ["DialogBlock", "DrawerBlock", "AlertDialogBlock"],
    notes: [
      "- An overlay hides its content behind a trigger. Anything the user must see at a glance belongs on the screen itself.",
      "- AlertDialogBlock is for a confirm-or-cancel decision; DialogBlock and DrawerBlock hold arbitrary content components.",
    ],
  },
];

// ── Derived plain data ──

function unwrapOuter(schema: any) {
  let s = schema;
  let required = true;
  for (;;) {
    const kind = s?._zod?.def?.type;
    if (kind === "optional" || kind === "default" || kind === "nullable") {
      if (kind !== "nullable") required = false;
      s = s._zod.def.innerType;
      continue;
    }
    return { schema: s, required };
  }
}

function directRefNames(schema: any): string[] | null {
  const single = schema?.meta?.()?.componentRef;
  if (typeof single === "string") return [single];
  if (schema?._zod?.def?.type === "union") {
    const names = schema.options.map((o: any) => o?.meta?.()?.componentRef);
    if (names.length > 0 && names.every((n: any) => typeof n === "string")) return names;
  }
  return null;
}

function nestedRefNames(schema: any): string[] | null {
  const { schema: inner } = unwrapOuter(schema);
  const direct = directRefNames(inner);
  if (direct) return direct;
  if (inner?._zod?.def?.type === "array") return nestedRefNames(inner.element);
  return null;
}

function deriveProp(schema: any): PropSpec {
  const { schema: inner, required } = unwrapOuter(schema);
  const kind = inner?._zod?.def?.type;
  // Every shape that is neither a scalar nor a component slot collapses to "array":
  // the plain form has one bucket for value arrays, rule objects and slide arrays.
  let t = "array";
  if (directRefNames(inner)) t = "ref";
  else if (kind === "array" && directRefNames(inner.element)) t = "refs";
  else if (kind === "enum" || kind === "string" || kind === "number" || kind === "boolean")
    t = kind === "enum" ? "string" : kind;

  const spec: PropSpec = { t };
  if (required) spec.req = true;
  if (kind === "enum") spec.enum = inner.options;
  const allowed = nestedRefNames(inner);
  if (allowed) spec.allowed = allowed;
  return spec;
}

// Order is the positional argument order the model must follow, so this list is the
// argument order and zod object key order is load-bearing.
const COMPONENTS = [
  Card,
  TextContent,
  MarkDownRenderer,
  CardHeader,
  Callout,
  TextCallout,
  CodeBlock,
  Image,
  ImageBlock,
  ImageGallery,
  Separator,
  HorizontalBarChart,
  Series,
  RadarChart,
  PieChart,
  RadialChart,
  SingleStackedBarChart,
  ScatterChart,
  ScatterSeries,
  Point,
  AreaChart,
  BarChart,
  LineChart,
  Table,
  Col,
  TagBlock,
  Form,
  Buttons,
  Button,
  FormControl,
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
  Steps,
  StepsItem,
  Tabs,
  TabItem,
  Carousel,
  Slice,
  Label,
  SwitchGroup,
  SwitchItem,
  Accordion,
  AccordionItem,
  Tag,
  FollowUpBlock,
  FollowUpItem,
  ListBlock,
  ListItem,
  SectionBlock,
  SectionItem,
  Alert,
  Avatar,
  Badge,
  Progress,
  PaginationBlock,
  CalendarBlock,
  DialogBlock,
  DrawerBlock,
  AlertDialogBlock,
  Heading,
  Blockquote,
  InlineCode,
];

function toCatalog(components: any[]) {
  const out: Record<string, CatalogEntry> = {};
  for (const c of components) {
    out[c.name] = {
      desc: c.description,
      props: Object.entries(c.props.shape).map(
        ([name, schema]) => [name, deriveProp(schema)] as [string, PropSpec],
      ),
    };
  }
  return out;
}

function checkGroups(groups: ComponentGroup[], catalog: Record<string, CatalogEntry>) {
  const listed = groups.flatMap((g) => g.components);
  const unknown = listed.filter((n) => !catalog[n]);
  const duplicate = listed.filter((n, i) => listed.indexOf(n) !== i);
  const ungrouped = Object.keys(catalog).filter((n) => !listed.includes(n));
  if (unknown.length || duplicate.length || ungrouped.length)
    throw new Error(
      `componentGroups out of sync: unknown=[${unknown}] duplicate=[${duplicate}] ungrouped=[${ungrouped}]`,
    );
  return groups;
}

export const ROOT = "Card";

export const CATALOG: Record<string, CatalogEntry> = toCatalog(COMPONENTS);

export const COMPONENT_GROUPS: ComponentGroup[] = checkGroups(componentGroups, CATALOG);
