"use client";

import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

import { Card, CardContent } from "@/components/ui/card";

// Content
import { Alert } from "./alert";
import { Avatar } from "./avatar";
import { ShadcnBadgeComponent } from "./badge";
import { CardHeader } from "./card-header";
import { CodeBlock } from "./code-block";
import { Image, ImageBlock } from "./image";
import { MarkDownRenderer } from "./markdown-renderer";
import { Progress } from "./progress";
import { Separator } from "./separator";
import { TextContent } from "./text-content";

// Charts
import {
  AreaChartCondensed,
  BarChartCondensed,
  LineChartCondensed,
  PieChartComponent,
  Point,
  RadarChartComponent,
  RadialChartComponent,
  ScatterChartComponent,
  ScatterSeries,
  Series,
  Slice,
} from "./charts";

// Forms
import { CheckBoxGroup, CheckBoxItem } from "./checkbox-group";
import { DatePicker } from "./date-picker";
import { Form } from "./form";
import { FormControl } from "./form-control";
import { Input } from "./input";
import { Label } from "./label";
import { RadioGroup, RadioItem } from "./radio-group";
import { Select, SelectItem } from "./select";
import { Slider } from "./slider";
import { SwitchGroup, SwitchItem } from "./switch-group";
import { TextArea } from "./textarea";

// Buttons
import { Button } from "./button";
import { Buttons } from "./buttons";

// Layout
import { Accordion, AccordionItemDef } from "./accordion";
import { Carousel } from "./carousel";
import { TabItem, Tabs } from "./tabs";

// Data Display
import { Col, Table } from "./table";
import { Tag, TagBlock } from "./tag";

// Chat-specific
import { FollowUpBlock, FollowUpItem } from "./follow-up-block";

// New components
import { AlertDialogBlock } from "./alert-dialog-block";
import { CalendarBlock } from "./calendar-block";
import { DialogBlock } from "./dialog-block";
import { DrawerBlock } from "./drawer-block";
import { PaginationBlock } from "./pagination-block";
import { Blockquote, Heading, InlineCode } from "./typography";

import { ChatContentChildUnion } from "./unions";
import {
  shadcnAdditionalRules,
  shadcnComponentGroups,
  shadcnExamples,
  shadcnPromptOptions,
} from "./metadata";

const ChatCardChildUnion = z.union([...ChatContentChildUnion.options, Tabs.ref, Carousel.ref]);

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically.",
  component: ({ props, renderNode }) => (
    <Card>
      <CardContent className="p-0 space-y-3">{renderNode(props.children)}</CardContent>
    </Card>
  ),
});

// ── Library ──

export { shadcnComponentGroups, shadcnExamples, shadcnAdditionalRules, shadcnPromptOptions };

export const shadcnChatLibrary = createLibrary({
  root: "Card",
  componentGroups: shadcnComponentGroups,
  components: [
    // Root
    ChatCard,
    CardHeader,
    // Content
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
    // Tables
    Table,
    Col,
    // Charts (2D)
    BarChartCondensed,
    LineChartCondensed,
    AreaChartCondensed,
    RadarChartComponent,
    Series,
    // Charts (1D)
    PieChartComponent,
    RadialChartComponent,
    Slice,
    // Charts (Scatter)
    ScatterChartComponent,
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
    // Follow-ups
    FollowUpBlock,
    FollowUpItem,
    // Layout
    Tabs,
    TabItem,
    Accordion,
    AccordionItemDef,
    Carousel,
    // Data Display
    TagBlock,
    Tag,
    // Typography
    Heading,
    Blockquote,
    InlineCode,
    // Navigation
    PaginationBlock,
    // Overlays
    DialogBlock,
    AlertDialogBlock,
    DrawerBlock,
    // Calendar
    CalendarBlock,
  ],
});
