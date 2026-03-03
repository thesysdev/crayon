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
  type SubComponentOf,
} from "@openuidev/lang-react";
import React from "react";
import { z } from "zod";
import { CheckBoxGroup as OpenUICheckBoxGroup } from "../../components/CheckBoxGroup";
import { CheckBoxItem as OpenUICheckBoxItem } from "../../components/CheckBoxItem";
import { CheckBoxItemSchema } from "./schema";

export { CheckBoxItemSchema } from "./schema";

type CheckBoxItemProps = z.infer<typeof CheckBoxItemSchema>;

function CheckBoxItemControlled({
  item,
  formName,
  getFieldValue,
  setFieldValue,
  isStreaming,
  onChangeExtra,
}: {
  item: SubComponentOf<CheckBoxItemProps>;
  formName: string | undefined;
  getFieldValue: (formName: string | undefined, name: string) => any;
  setFieldValue: (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback?: boolean,
  ) => void;
  isStreaming: boolean;
  onChangeExtra?: (childName: string, newVal: boolean) => void;
}) {
  const existingValue = getFieldValue(formName, item.props.name);

  useSetDefaultValue({
    formName,
    componentType: "CheckBoxItem",
    name: item.props.name,
    existingValue,
    defaultValue: item.props.defaultChecked,
  });

  return (
    <OpenUICheckBoxItem
      name={item.props.name}
      label={item.props.label}
      description={item.props.description || ""}
      checked={existingValue ?? item.props.defaultChecked}
      onChange={(val: boolean) => {
        setFieldValue(formName, "CheckBoxItem", item.props.name, val, true);
        onChangeExtra?.(item.props.name, val);
      }}
      disabled={isStreaming}
    />
  );
}

export const CheckBoxItem = defineComponent({
  name: "CheckBoxItem",
  props: CheckBoxItemSchema,
  description: "",
  component: () => null,
});

export const CheckBoxGroup = defineComponent({
  name: "CheckBoxGroup",
  props: z.object({
    name: z.string(),
    items: z.array(CheckBoxItem.ref),
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
    const items = props.items ?? [];

    const getAggregateValue = React.useCallback(() => {
      const aggregate: Record<string, boolean> = {};
      for (const item of items) {
        aggregate[item.props.name] = !!getFieldValue(formName, item.props.name);
      }
      return aggregate;
    }, [items, formName, getFieldValue]);

    React.useEffect(() => {
      if (!isStreaming && rules.length > 0 && formValidation) {
        formValidation.registerField(props.name, rules, getAggregateValue);
        return () => formValidation.unregisterField(props.name);
      }
      return undefined;
    }, [isStreaming, rules.length > 0]);

    if (!items.length) return null;

    return (
      <OpenUICheckBoxGroup>
        {items.map((item, i) => (
          <CheckBoxItemControlled
            key={i}
            item={item}
            formName={formName}
            getFieldValue={getFieldValue}
            setFieldValue={setFieldValue}
            isStreaming={isStreaming}
            onChangeExtra={(childName: string, newVal: boolean) => {
              if (rules.length > 0) {
                const aggregate = getAggregateValue();
                aggregate[childName] = newVal;
                formValidation?.validateField(props.name, aggregate, rules);
              }
            }}
          />
        ))}
      </OpenUICheckBoxGroup>
    );
  },
});
