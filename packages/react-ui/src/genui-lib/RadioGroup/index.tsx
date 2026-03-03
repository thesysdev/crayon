"use client";

import {
  defineComponent,
  parseRules,
  useFormName,
  useFormValidation,
  useGetFieldValue,
  useIsStreaming,
  useSetDefaultValue,
  useSetFieldValue,
} from "@openuidev/lang-react";
import React from "react";
import { z } from "zod";
import { RadioGroup as OpenUIRadioGroup } from "../../components/RadioGroup";
import { RadioItem as OpenUIRadioItem } from "../../components/RadioItem";
import { RadioItemSchema } from "./schema";

export { RadioItemSchema } from "./schema";

export const RadioItem = defineComponent({
  name: "RadioItem",
  props: RadioItemSchema,
  description: "",
  component: () => null,
});

export const RadioGroup = defineComponent({
  name: "RadioGroup",
  props: z.object({
    name: z.string(),
    items: z.array(RadioItem.ref),
    defaultValue: z.string().optional(),
    rules: z.array(z.string()).optional(),
  }),
  description: "",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const rules = React.useMemo(() => parseRules(props.rules), [props.rules]);
    const existingValue = getFieldValue(formName, props.name);

    useSetDefaultValue({
      formName,
      componentType: "RadioGroup",
      name: props.name,
      existingValue,
      defaultValue: props.defaultValue,
    });

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(props.name, rules, () => getFieldValue(formName, props.name));
        return () => formValidation.unregisterField(props.name);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    const items = props.items ?? [];
    if (!items.length) return null;

    return (
      <OpenUIRadioGroup
        name={props.name}
        value={existingValue ?? props.defaultValue}
        onValueChange={(val: string) => {
          setFieldValue(formName, "RadioGroup", props.name, val, true);
          if (rules.length > 0) {
            formValidation?.validateField(props.name, val, rules);
          }
        }}
        disabled={isStreaming}
      >
        {items.map((item, i) => (
          <OpenUIRadioItem
            key={i}
            value={item.props.value}
            label={item.props.label}
            description={item.props.description || ""}
          />
        ))}
      </OpenUIRadioGroup>
    );
  },
});
