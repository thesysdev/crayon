"use client";

import { defineComponent } from "@openuidev/lang-react";
import { z } from "zod";
import { SwitchGroup as OpenUISwitchGroup } from "../../components/SwitchGroup";
import { SwitchItem as OpenUISwitchItem } from "../../components/SwitchItem";
import { SwitchItemSchema } from "./schema";

export { SwitchItemSchema } from "./schema";

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Individual switch toggle",
  component: () => null,
});

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: z.object({
    items: z.array(SwitchItem.ref),
    variant: z.enum(["clear", "card", "sunk"]).optional(),
  }),
  description: "Group of switch toggles",
  component: ({ props }) => {
    const items = props.items ?? [];
    return (
      <OpenUISwitchGroup variant={props.variant || "clear"}>
        {items.map((item, i) => (
          <OpenUISwitchItem
            key={i}
            label={item.props.label}
            description={item.props.description}
            name={item.props.name}
            value={item.props.value}
            checked={item.props.checked}
            defaultChecked={item.props.defaultChecked}
            disabled={item.props.disabled}
          />
        ))}
      </OpenUISwitchGroup>
    );
  },
});
