"use client";

import type { ComponentGroup } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Card as OpenUICard } from "../components/Card";

// Content
import { Callout } from "./Callout";
import { CardHeader } from "./CardHeader";
import { CodeBlock } from "./CodeBlock";
import { Image } from "./Image";
import { ImageBlock } from "./ImageBlock";
import { ImageGallery } from "./ImageGallery";
import { MarkDownRenderer } from "./MarkDownRenderer";
import { Separator } from "./Separator";
import { TextCallout } from "./TextCallout";
import { TextContent } from "./TextContent";

// Charts
import {
  AreaChartCondensed,
  BarChartCondensed,
  HorizontalBarChart,
  LineChartCondensed,
  PieChart,
  Point,
  RadarChart,
  RadialChart,
  ScatterChart,
  ScatterSeries,
  Series,
  SingleStackedBarChart,
  Slice,
} from "./Charts";

// Forms
import { CheckBoxGroup, CheckBoxItem } from "./CheckBoxGroup";
import { DatePicker } from "./DatePicker";
import { Form } from "./Form";
import { FormControl } from "./FormControl";
import { Input } from "./Input";
import { Label } from "./Label";
import { RadioGroup, RadioItem } from "./RadioGroup";
import { Select, SelectItem } from "./Select";
import { Slider } from "./Slider";
import { SwitchGroup, SwitchItem } from "./SwitchGroup";
import { TextArea } from "./TextArea";

// Buttons
import { Button } from "./Button";
import { Buttons } from "./Buttons";

// Layout (no Stack)
import { Accordion, AccordionItem } from "./Accordion";
import { Carousel } from "./Carousel";
import { Steps, StepsItem } from "./Steps";
import { TabItem, Tabs } from "./Tabs";

// Data Display
import { Col, Table } from "./Table";
import { Tag } from "./Tag";
import { TagBlock } from "./TagBlock";

// Chat-specific
import { FollowUpBlock } from "./FollowUpBlock";
import { FollowUpItem } from "./FollowUpItem";
import { ListBlock } from "./ListBlock";
import { ListItem } from "./ListItem";
import { SectionBlock } from "./SectionBlock";
import { SectionItem } from "./SectionItem";

import { ChatContentChildUnion } from "./unions";

// Tabs and Carousel are added here (not in unions.ts) to avoid the circular dep:
// Tabs/schema.ts imports ContentChildUnion from unions.ts.
const ChatCardChildUnion = z.union([...ChatContentChildUnion.options, Tabs.ref, Carousel.ref]);

// ── Locked Chat Card — no design params, always vertical ──

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically.",
  component: ({ props, renderNode }) => (
    <OpenUICard
      width="full"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--openui-space-m)",
      }}
    >
      {renderNode(props.children)}
    </OpenUICard>
  ),
});

// ── Component Groups ──

export const openuiChatComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: [
      "CardHeader",
      "TextContent",
      "MarkDownRenderer",
      "Callout",
      "TextCallout",
      "Image",
      "ImageBlock",
      "ImageGallery",
      "CodeBlock",
      "Separator",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col"],
  },
  {
    name: "Charts (2D)",
    components: [
      "BarChart",
      "LineChart",
      "AreaChart",
      "RadarChart",
      "HorizontalBarChart",
      "Series",
    ],
  },
  {
    name: "Charts (1D)",
    components: ["PieChart", "RadialChart", "SingleStackedBarChart", "Slice"],
  },
  {
    name: "Charts (Scatter)",
    components: ["ScatterChart", "ScatterSeries", "Point"],
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
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      "SwitchGroup",
      "SwitchItem",
    ],
    notes: [
      "- Define EACH FormControl as its own reference — do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the third Form argument.",
      "- rules is an optional object: { required: true, email: true, min: 8, maxLength: 100 }",
      "- The renderer shows error messages automatically — do NOT generate error text in the UI",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Lists & Follow-ups",
    components: ["ListBlock", "ListItem", "FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use ListBlock with ListItem references for numbered, clickable lists.",
      "- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.",
      "- Clicking a ListItem or FollowUpItem sends its text to the LLM as a user message.",
      '- Example: list = ListBlock([item1, item2])  item1 = ListItem("Option A", "Details about A")',
    ],
  },
  {
    name: "Sections",
    components: ["SectionBlock", "SectionItem"],
    notes: [
      "- SectionBlock renders collapsible accordion sections that auto-open as they stream.",
      "- Each section needs a unique `value` id, a `trigger` label, and a `content` array.",
      '- Example: sections = SectionBlock([s1, s2])  s1 = SectionItem("intro", "Introduction", [content1])',
      "- Set isFoldable=false to render sections as flat headers instead of accordion.",
    ],
  },
  {
    name: "Layout",
    components: ["Tabs", "TabItem", "Accordion", "AccordionItem", "Steps", "StepsItem", "Carousel"],
    notes: [
      "- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.",
      "- Carousel takes an array of slides, where each slide is an array of content: carousel = Carousel([[t1, img1], [t2, img2]])",
      "- IMPORTANT: Every slide in a Carousel must have the same structure — same component types in the same order.",
      "- For image carousels use: [[title, image, description, tags], ...] — every slide must follow this exact pattern.",
      "- Use real, publicly accessible image URLs (e.g. https://picsum.photos/seed/KEYWORD/800/500). Never hallucinate image URLs.",
    ],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag"],
  },
];

// ── Examples ──
export {
  openuiChatAdditionalRules,
  openuiChatExamples,
  openuiChatPromptOptions,
} from "./prompt-options/index";

// ── Library ──

export const openuiChatLibrary = createLibrary({
  root: "Card",
  componentGroups: openuiChatComponentGroups,
  components: [
    // Root
    ChatCard,
    CardHeader,
    // Content
    TextContent,
    MarkDownRenderer,
    Callout,
    TextCallout,
    Image,
    ImageBlock,
    ImageGallery,
    CodeBlock,
    Separator,
    // Tables
    Table,
    Col,
    // Charts (2D)
    BarChartCondensed,
    LineChartCondensed,
    AreaChartCondensed,
    RadarChart,
    HorizontalBarChart,
    Series,
    // Charts (1D)
    PieChart,
    RadialChart,
    SingleStackedBarChart,
    Slice,
    // Charts (Scatter)
    ScatterChart,
    ScatterSeries,
    Point,
    // Forms
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
    // Buttons
    Button,
    Buttons,
    // Lists & Follow-ups
    ListBlock,
    ListItem,
    FollowUpBlock,
    FollowUpItem,
    // Sections
    SectionBlock,
    SectionItem,
    // Layout (no Stack)
    Tabs,
    TabItem,
    Accordion,
    AccordionItem,
    Steps,
    StepsItem,
    Carousel,
    // Data Display
    TagBlock,
    Tag,
  ],
});
