"use client";

import TextField from "@mui/material/TextField";
import {
  defineComponent,
  parseStructuredRules,
  useFormValidation,
  useIsStreaming,
  useStateField,
} from "@openuidev/react-lang";
import React from "react";
import { z } from "zod";

export const TextArea = defineComponent({
  name: "TextArea",
  props: z.object({
    name: z.string(),
    placeholder: z.string().optional(),
    value: z.string().optional(),
    rows: z.number().optional(),
    rules: z.any().optional(),
  }),
  description: "Multi-line text input",
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const formValidation = useFormValidation();
    const field = useStateField(props.name, props.value);
    const rules = React.useMemo(() => parseStructuredRules(props.rules), [props.rules]);
    const hasRules = rules.length > 0;

    React.useEffect(() => {
      if (!isStreaming && hasRules && formValidation) {
        formValidation.registerField(field.name, rules, () => field.value);
        return () => formValidation.unregisterField(field.name);
      }
      return undefined;
    }, [field.name, field.value, formValidation, hasRules, isStreaming, rules]);

    return (
      <TextField
        id={field.name}
        name={field.name}
        placeholder={(props.placeholder as string) || ""}
        value={field.value ?? ""}
        multiline
        minRows={(props.rows as number) || 3}
        size="small"
        variant="outlined"
        fullWidth
        onFocus={() => formValidation?.clearFieldError(field.name)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          field.setValue(e.target.value);
          if (hasRules) formValidation?.clearFieldError(field.name);
        }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          if (hasRules) formValidation?.validateField(field.name, e.target.value, rules);
        }}
        disabled={isStreaming}
      />
    );
  },
});
