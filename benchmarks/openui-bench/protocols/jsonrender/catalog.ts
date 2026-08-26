// json-render catalog for the benchmark, authored through @json-render/core's
// defineCatalog API with Zod prop schemas.
//
// Ref-typed props hold element ids from /elements. json-render has no ref type,
// so they are plain strings (or arrays of strings) carrying the marker
// description below, which is what the derived plain-data form reads back.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// The json-render packages live in the benchmark's root install. Resolve from
// this file first, and fall back to that install when this file is imported
// from elsewhere. Every dependency goes through one require function: two Zod
// module instances would break the library's internal instanceof checks.
const OFFICIAL_ANCHOR = fileURLToPath(new URL("../../package.json", import.meta.url));

function jsonRenderRequire() {
  const local = createRequire(import.meta.url);
  try {
    local.resolve("@json-render/core");
    return local;
  } catch {
    return createRequire(OFFICIAL_ANCHOR);
  }
}

const req = jsonRenderRequire();

// Re-exported so sibling modules share this exact module instance.
export const core = req("@json-render/core");
const { schema } = req("@json-render/react/schema");
const { z } = req("zod");

type ZodProp = {
  readonly description?: string;
  readonly def: { type: string; innerType?: ZodProp; entries?: Record<string, string> };
  readonly options?: string[];
};
type ZodProps = ZodProp & { readonly shape: Record<string, ZodProp> };

type AuthoredComponent = {
  description: string;
  /** json-render's element-level child slot, not a member of the props object. */
  children?: ZodProp;
  props: ZodProps;
};

export type PropType = { t: string; req?: boolean; enum?: string[] };
export type ComponentDef = { desc: string; props: [string, PropType][] };

const REF_NOTE = "key of another element in /elements";
const REFS_NOTE = "keys of other elements in /elements";

const ref = (): ZodProp => z.string().describe(REF_NOTE);
const refs = (): ZodProp => z.array(z.string()).describe(REFS_NOTE);

const COMPONENTS: Record<string, AuthoredComponent> = {
  Card: {
    description:
      'Styled container. variant: "card" (default, elevated) | "sunk" (recessed) | "clear" (transparent). Always full width. Accepts all Stack flex params (default: di',
    children: refs(),
    props: z.object({
      variant: z.enum(["card", "sunk", "clear"]).optional(),
      direction: z.enum(["row", "column"]).optional(),
      gap: z.enum(["none", "xs", "s", "m", "l", "xl", "2xl"]).optional(),
      align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(),
      justify: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional(),
      wrap: z.boolean().optional(),
    }),
  },
  TextContent: {
    description:
      'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
    props: z.object({
      text: z.string(),
      size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
    }),
  },
  MarkDownRenderer: {
    description: "Renders markdown text with optional container variant",
    props: z.object({
      textMarkdown: z.string(),
      variant: z.enum(["clear", "card", "sunk"]).optional(),
    }),
  },
  CardHeader: {
    description: "Header with optional title and subtitle",
    props: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
    }),
  },
  Callout: {
    description:
      "Callout banner. Optional visible is a reactive $boolean — auto-dismisses after 3s by setting $visible to false.",
    props: z.object({
      variant: z.enum(["info", "warning", "error", "success", "neutral"]),
      title: z.string(),
      description: z.string(),
    }),
  },
  TextCallout: {
    description: "Text callout with variant, title, and description",
    props: z.object({
      variant: z.enum(["neutral", "info", "warning", "success", "danger"]).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
    }),
  },
  CodeBlock: {
    description: "Syntax-highlighted code block",
    props: z.object({
      language: z.string(),
      codeString: z.string(),
    }),
  },
  Image: {
    description: "Image with alt text and optional URL",
    props: z.object({
      alt: z.string(),
      src: z.string().optional(),
    }),
  },
  ImageBlock: {
    description: "Image block with loading state",
    props: z.object({
      src: z.string(),
      alt: z.string().optional(),
    }),
  },
  ImageGallery: {
    description: "Gallery grid of images with modal preview",
    props: z.object({
      images: z.array(z.any()),
    }),
  },
  Separator: {
    description: "Visual divider between content sections",
    props: z.object({
      orientation: z.enum(["horizontal", "vertical"]).optional(),
      decorative: z.boolean().optional(),
    }),
  },
  HorizontalBarChart: {
    description: "Horizontal bars; prefer when category labels are long or for ranked lists",
    props: z.object({
      labels: z.array(z.any()),
      series: refs(),
      variant: z.enum(["grouped", "stacked"]).optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
  },
  Series: {
    description: "One data series",
    props: z.object({
      category: z.string(),
      values: z.array(z.any()),
    }),
  },
  RadarChart: {
    description: "Spider/web chart; use for comparing multiple variables across one or more entities",
    props: z.object({
      labels: z.array(z.any()),
      series: refs(),
    }),
  },
  PieChart: {
    description: "Circular slices; use plucked arrays: PieChart(data.categories, data.values)",
    props: z.object({
      labels: z.array(z.any()),
      values: z.array(z.any()),
      variant: z.enum(["pie", "donut"]).optional(),
      appearance: z.enum(["circular", "semiCircular"]).optional(),
    }),
  },
  RadialChart: {
    description: "Radial bars; use plucked arrays: RadialChart(data.categories, data.values)",
    props: z.object({
      labels: z.array(z.any()),
      values: z.array(z.any()),
    }),
  },
  SingleStackedBarChart: {
    description:
      "Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)",
    props: z.object({
      labels: z.array(z.any()),
      values: z.array(z.any()),
    }),
  },
  ScatterChart: {
    description: "X/Y scatter plot; use for correlations, distributions, and clustering",
    props: z.object({
      datasets: refs(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
  },
  ScatterSeries: {
    description: "Named dataset",
    props: z.object({
      name: z.string(),
      points: refs(),
    }),
  },
  Point: {
    description: "Data point with numeric coordinates",
    props: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number().optional(),
    }),
  },
  AreaChart: {
    description: "Filled area under lines; use for cumulative totals or volume trends over time",
    props: z.object({
      labels: z.array(z.any()),
      series: refs(),
      variant: z.enum(["linear", "natural", "step"]).optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
  },
  BarChart: {
    description: "Vertical bars; use for comparing values across categories with one or more series",
    props: z.object({
      labels: z.array(z.any()),
      series: refs(),
      variant: z.enum(["grouped", "stacked"]).optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
  },
  LineChart: {
    description: "Lines over categories; use for trends and continuous data over time",
    props: z.object({
      labels: z.array(z.any()),
      series: refs(),
      variant: z.enum(["linear", "natural", "step"]).optional(),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
  },
  Table: {
    description: "Data table — column-oriented. Each Col holds its own data array.",
    props: z.object({
      columns: refs(),
    }),
  },
  Col: {
    description: "Column definition — holds label + data array",
    props: z.object({
      label: z.string(),
      data: z.array(z.any()),
      type: z.enum(["string", "number", "action"]).optional(),
    }),
  },
  TagBlock: {
    description: "tags is an array of strings",
    props: z.object({
      tags: z.array(z.any()),
    }),
  },
  Form: {
    description: "Form container with fields and explicit action buttons",
    props: z.object({
      name: z.string(),
      buttons: ref(),
      fields: refs(),
    }),
  },
  Buttons: {
    description: 'Group of Button components. direction: "row" (default) | "column".',
    props: z.object({
      buttons: refs(),
      direction: z.enum(["row", "column"]).optional(),
    }),
  },
  Button: {
    description: "Clickable button",
    props: z.object({
      label: z.string(),
      action: z.array(z.any()).optional(),
      variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
      type: z.enum(["normal", "destructive"]).optional(),
      size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
    }),
  },
  FormControl: {
    description: "Field with label, input component, and optional hint text",
    props: z.object({
      label: z.string(),
      input: ref(),
      hint: z.string().optional(),
    }),
  },
  Input: {
    description: "Input",
    props: z.object({
      name: z.string(),
      placeholder: z.string().optional(),
      type: z.enum(["text", "email", "password", "number", "url"]).optional(),
      rules: z.array(z.any()).optional(),
      value: z.string().optional(),
    }),
  },
  TextArea: {
    description: "TextArea",
    props: z.object({
      name: z.string(),
      placeholder: z.string().optional(),
      rows: z.number().optional(),
      rules: z.array(z.any()).optional(),
      value: z.string().optional(),
    }),
  },
  Select: {
    description: "Select",
    props: z.object({
      name: z.string(),
      items: refs(),
      placeholder: z.string().optional(),
      rules: z.array(z.any()).optional(),
      value: z.string().optional(),
      size: z.enum(["small", "medium", "large"]).optional(),
    }),
  },
  SelectItem: {
    description: "Option for Select",
    props: z.object({
      value: z.string(),
      label: z.string(),
    }),
  },
  DatePicker: {
    description: "DatePicker",
    props: z.object({
      name: z.string(),
      mode: z.enum(["single", "range"]).optional(),
      rules: z.array(z.any()).optional(),
      value: z.array(z.any()).optional(),
    }),
  },
  Slider: {
    description: "Numeric slider input; supports continuous and discrete (stepped) variants",
    props: z.object({
      name: z.string(),
      variant: z.enum(["continuous", "discrete"]),
      min: z.number(),
      max: z.number(),
      step: z.number().optional(),
      defaultValue: z.array(z.any()).optional(),
      label: z.string().optional(),
      rules: z.array(z.any()).optional(),
      value: z.array(z.any()).optional(),
    }),
  },
  CheckBoxGroup: {
    description: "CheckBoxGroup",
    props: z.object({
      name: z.string(),
      items: refs(),
      rules: z.array(z.any()).optional(),
      value: z.array(z.any()).optional(),
    }),
  },
  CheckBoxItem: {
    description: "CheckBoxItem",
    props: z.object({
      label: z.string(),
      description: z.string(),
      name: z.string(),
      defaultChecked: z.boolean().optional(),
    }),
  },
  RadioGroup: {
    description: "RadioGroup",
    props: z.object({
      name: z.string(),
      items: refs(),
      defaultValue: z.string().optional(),
      rules: z.array(z.any()).optional(),
      value: z.string().optional(),
    }),
  },
  RadioItem: {
    description: "RadioItem",
    props: z.object({
      label: z.string(),
      description: z.string(),
      value: z.string(),
    }),
  },
  Steps: {
    description: "Step-by-step guide",
    props: z.object({
      items: refs(),
    }),
  },
  StepsItem: {
    description: "title and details text for one step",
    props: z.object({
      title: z.string(),
      details: z.string(),
    }),
  },
  Tabs: {
    description: "Tabbed container",
    props: z.object({
      items: refs(),
    }),
  },
  TabItem: {
    description: "value is unique id, trigger is tab label, content is array of components",
    props: z.object({
      value: z.string(),
      trigger: z.string(),
      content: refs(),
    }),
  },
  Carousel: {
    description: "Horizontal scrollable carousel",
    children: z.array(z.any()),
    props: z.object({
      variant: z.enum(["card", "sunk"]).optional(),
    }),
  },
  Slice: {
    description: "One slice with label and numeric value",
    props: z.object({
      category: z.string(),
      value: z.number(),
    }),
  },
  Label: {
    description: "Text label",
    props: z.object({
      text: z.string(),
    }),
  },
  SwitchGroup: {
    description: "Group of switch toggles",
    props: z.object({
      name: z.string(),
      items: refs(),
      variant: z.enum(["clear", "card", "sunk"]).optional(),
      value: z.array(z.any()).optional(),
    }),
  },
  SwitchItem: {
    description: "Individual switch toggle",
    props: z.object({
      label: z.string().optional(),
      description: z.string().optional(),
      name: z.string(),
      defaultChecked: z.boolean().optional(),
    }),
  },
  Accordion: {
    description: "Collapsible sections",
    props: z.object({
      items: refs(),
    }),
  },
  AccordionItem: {
    description: "value is unique id, trigger is section title",
    props: z.object({
      value: z.string(),
      trigger: z.string(),
      content: refs(),
    }),
  },
  Tag: {
    description: "Styled tag/badge with optional icon and variant",
    props: z.object({
      text: z.string(),
      icon: z.string().optional(),
      size: z.enum(["sm", "md", "lg"]).optional(),
      variant: z.enum(["neutral", "info", "success", "warning", "danger"]).optional(),
    }),
  },
  FollowUpBlock: {
    description: "List of clickable follow-up suggestions placed at the end of a response",
    props: z.object({
      items: refs(),
    }),
  },
  FollowUpItem: {
    description: "Clickable follow-up suggestion; when clicked, sends text as user message",
    props: z.object({
      text: z.string(),
    }),
  },
  ListBlock: {
    description: "A list of items with number or image indicators",
    props: z.object({
      items: refs(),
      variant: z.enum(["number", "image"]).optional(),
    }),
  },
  ListItem: {
    description: "List row with a title, optional subtitle and image",
    props: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      image: z.array(z.any()).optional(),
      actionLabel: z.string().optional(),
    }),
  },
  SectionBlock: {
    description: "Collapsible accordion sections; use SectionItem for each section",
    props: z.object({
      sections: refs(),
      isFoldable: z.boolean().optional(),
    }),
  },
  SectionItem: {
    description: "Section with a label and collapsible content, used inside SectionBlock",
    props: z.object({
      value: z.string(),
      trigger: z.string(),
      content: refs(),
    }),
  },
  Alert: {
    description: "Alert banner with icon, title, and description",
    props: z.object({
      title: z.string(),
      description: z.string(),
      variant: z.enum(["default", "destructive", "info", "success", "warning"]).optional(),
    }),
  },
  Avatar: {
    description: "Avatar image with a text fallback",
    props: z.object({
      src: z.string().optional(),
      alt: z.string().optional(),
      fallback: z.string(),
    }),
  },
  Badge: {
    description: "Small status or category badge",
    props: z.object({
      text: z.string(),
      variant: z.enum(["default", "secondary", "destructive", "outline", "ghost", "link"]).optional(),
    }),
  },
  Progress: {
    description: "Progress bar with an optional label",
    props: z.object({
      value: z.number(),
      label: z.string().optional(),
    }),
  },
  PaginationBlock: {
    description: "Page navigation for long result sets",
    props: z.object({
      currentPage: z.number(),
      totalPages: z.number(),
    }),
  },
  CalendarBlock: {
    description: "Inline calendar",
    props: z.object({
      mode: z.enum(["single", "multiple", "range"]).optional(),
      defaultMonth: z.string().optional(),
      numberOfMonths: z.number().optional(),
      captionLayout: z.enum(["label", "dropdown"]).optional(),
    }),
  },
  DialogBlock: {
    description: "Button that opens a modal dialog with content",
    props: z.object({
      triggerLabel: z.string(),
      title: z.string(),
      description: z.string().optional(),
      content: refs().optional(),
      triggerVariant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
    }),
  },
  DrawerBlock: {
    description: "Button that opens a slide-out drawer with content",
    props: z.object({
      triggerLabel: z.string(),
      title: z.string(),
      description: z.string().optional(),
      content: refs().optional(),
    }),
  },
  AlertDialogBlock: {
    description: "Button that opens a confirm/cancel dialog",
    props: z.object({
      triggerLabel: z.string(),
      title: z.string(),
      description: z.string(),
      confirmLabel: z.string().optional(),
      cancelLabel: z.string().optional(),
      triggerVariant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
    }),
  },
  Heading: {
    description: "Standalone heading",
    props: z.object({
      text: z.string(),
      level: z.enum(["h1", "h2", "h3", "h4"]).optional(),
    }),
  },
  Blockquote: {
    description: "Quoted text with an optional citation",
    props: z.object({
      text: z.string(),
      cite: z.string().optional(),
    }),
  },
  InlineCode: {
    description: "Inline code span",
    props: z.object({
      code: z.string(),
    }),
  },
};

// Plain-data view of a single authored prop. Key order is t, enum, req.
function propType(node: ZodProp): PropType {
  let inner = node;
  let req = true;
  if (inner.def.type === "optional") {
    req = false;
    inner = inner.def.innerType as ZodProp;
  }
  let t: string;
  let values: string[] | undefined;
  if (inner.description === REF_NOTE) {
    t = "ref";
  } else if (inner.description === REFS_NOTE) {
    t = "refs";
  } else {
    switch (inner.def.type) {
      case "enum":
        t = "string";
        values = [...(inner.options ?? Object.values(inner.def.entries ?? {}))];
        break;
      case "string":
      case "number":
      case "boolean":
      case "array":
        t = inner.def.type;
        break;
      default:
        throw new Error(`unsupported prop schema: ${inner.def.type}`);
    }
  }
  const out: PropType = { t };
  if (values) out.enum = values;
  if (req) out.req = true;
  return out;
}

/** Derived plain-data catalog, for tooling that diffs catalogs across protocols. */
export const CATALOG: Record<string, ComponentDef> = {};
/** Ref-typed prop names per component, excluding children. Used by the graph walk. */
export const REF_PROP_NAMES = new Map<string, Set<string>>();

const components: Record<string, { description: string; props: ZodProps }> = {};

for (const [name, def] of Object.entries(COMPONENTS)) {
  // children is listed first because the ground-truth catalog lists it first.
  const props: [string, PropType][] = [];
  if (def.children) props.push(["children", propType(def.children)]);
  for (const [pn, node] of Object.entries(def.props.shape)) props.push([pn, propType(node)]);
  CATALOG[name] = { desc: def.description, props };

  const refProps = props
    .filter(([pn, ty]) => pn !== "children" && (ty.t === "ref" || ty.t === "refs"))
    .map(([pn]) => pn);
  if (refProps.length) REF_PROP_NAMES.set(name, new Set(refProps));

  // catalog.prompt() prints component descriptions but drops prop-level Zod
  // descriptions, so the element-id rule for ref props has to ride along here.
  let description = def.description || name;
  if (refProps.length) {
    description += ` (${refProps.join(", ")}: element key(s) of other /elements entries, not literal text)`;
  }
  components[name] = { description, props: def.props };
}

export const catalog = core.defineCatalog(schema, { components, actions: {} });
