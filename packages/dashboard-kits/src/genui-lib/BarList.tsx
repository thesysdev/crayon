"use client";

import { defineComponent, reactive, useStateField } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { BarList as BarListView } from "../components/BarList";
import { formatSchema, itemSchema } from "../core/schemas";
import { Pending } from "./Pending";

export const BarList = defineComponent({
  name: "BarList",
  description:
    'Ranked list of categories as labeled horizontal bars, with each value, its share, and its change. Best for top-N comparisons with long names: channels, countries, sources, products. Pass a breakdown tool\'s items directly: BarList(byCountry.items, "currency"). When a card stacks it under another chart, give it a caption: BarList(sources.activation, "percent", 6, "Activated in week 1"). When the items carry filter keys, pass the matching filter $binding last and selecting a row filters the dashboard: BarList(byCategory.items, "currency", 8, "", $category).',
  props: z.object({
    items: z.array(itemSchema).default([]),
    format: formatSchema.optional(),
    limit: z.number().optional(),
    caption: z.string().optional(),
    selected: reactive(z.string().optional()),
  }),
  component: ({ props }) => {
    const field = useStateField("breakdownSelection", props.selected);
    const items = props.items ?? [];
    if (items.length === 0) return <Pending kind="list" />;
    return (
      <BarListView
        items={items}
        format={props.format}
        limit={props.limit}
        caption={props.caption || undefined}
        selected={typeof field.value === "string" ? field.value : undefined}
        onSelect={field.isReactive ? (key) => field.setValue(key) : undefined}
      />
    );
  },
});
