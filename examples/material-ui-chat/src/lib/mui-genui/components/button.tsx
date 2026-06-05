"use client";

import MuiButton from "@mui/material/Button";
import type { ActionPlan } from "@openuidev/react-lang";
import {
  ACTION_STEPS,
  defineComponent,
  useFormName,
  useFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/react-lang";
import { z } from "zod";

const variantMap: Record<string, "contained" | "outlined" | "text"> = {
  primary: "contained",
  secondary: "outlined",
  ghost: "text",
  tertiary: "text",
};

const colorMap: Record<string, "primary" | "secondary" | "error" | "success" | "warning"> = {
  primary: "primary",
  secondary: "secondary",
  destructive: "error",
};

export const Button = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: z.any().optional(),
    variant: z.string().optional(),
    type: z.string().optional(),
  }),
  description: "Action button with variant and color options",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const formName = useFormName();
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();

    const label = props.label as string;

    return (
      <MuiButton
        variant={variantMap[(props.variant as string) || "primary"] || "contained"}
        color={colorMap[(props.variant as string) || "primary"] || "primary"}
        disabled={isStreaming}
        onClick={() => {
          const action = props.action as ActionPlan | undefined;
          const variant = (props.variant as string) || "primary";

          if (formValidation && variant === "primary") {
            if (action?.steps) {
              const needsValidation = action.steps.some(
                (s) =>
                  s.type === ACTION_STEPS.ToAssistant ||
                  (s.type === ACTION_STEPS.Run && s.refType === "mutation"),
              );
              if (needsValidation && !formValidation.validateForm()) return;
            } else {
              if (!formValidation.validateForm()) return;
            }
          }

          triggerAction(label, formName, action);
        }}
      >
        {label}
      </MuiButton>
    );
  },
});
