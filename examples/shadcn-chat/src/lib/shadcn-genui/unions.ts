import { z } from "zod";

import { Alert } from "./alert";
import { AlertDialogBlock } from "./alert-dialog-block";
import { ShadcnBadgeComponent } from "./badge";
import { CalendarBlock } from "./calendar-block";
import { CodeBlock } from "./code-block";
import { DialogBlock } from "./dialog-block";
import { DrawerBlock } from "./drawer-block";
import { FollowUpBlock } from "./follow-up-block";
import { Image, ImageBlock } from "./image";
import { MarkDownRenderer } from "./markdown-renderer";
import { PaginationBlock } from "./pagination-block";
import { Progress } from "./progress";
import { Separator } from "./separator";
import { TextContent } from "./text-content";
import { Blockquote, Heading, InlineCode } from "./typography";

import {
  AreaChartCondensed,
  BarChartCondensed,
  LineChartCondensed,
  PieChartComponent,
  RadarChartComponent,
  RadialChartComponent,
  ScatterChartComponent,
} from "./charts";

import { Table } from "./table";
import { TagBlock } from "./tag";

import { Avatar } from "./avatar";
import { Buttons } from "./buttons";
import { CardHeader } from "./card-header";
import { Form } from "./form";

export const ContentChildUnion = z.union([
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
]);

export const ChatContentChildUnion = z.union([...ContentChildUnion.options, FollowUpBlock.ref]);
