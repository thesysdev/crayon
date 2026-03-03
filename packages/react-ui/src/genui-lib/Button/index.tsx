"use client";

import {
  defineComponent,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/lang-react";
import { Button as OpenUIButton } from "../../components/Button";
import { ButtonSchema } from "./schema";

export { ButtonSchema } from "./schema";

const variantMap: Record<string, "primary" | "secondary" | "tertiary"> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "tertiary",
  tertiary: "tertiary",
};

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description: "Clickable button",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    return (
      <OpenUIButton
        variant={variantMap[props.variant as string] || "primary"}
        size={(props.size as "extra-small" | "small" | "medium" | "large") || "medium"}
        buttonType={props.type as "normal" | "destructive"}
        disabled={isStreaming}
        onClick={() => {
          if (formValidation) {
            const valid = formValidation.validateForm();
            if (!valid) return;
          }
          const label = props.label as string;
          const action = props.action as string;
          triggerAction(label, `User clicked on Button: ${action}`, formName);
        }}
      >
        {props.label as string}
      </OpenUIButton>
    );
  },
});
