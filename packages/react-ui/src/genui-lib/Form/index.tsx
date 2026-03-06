"use client";

import {
  defineComponent,
  FormNameContext,
  FormValidationContext,
  useCreateFormValidation,
  useIsStreaming,
  useTriggerAction,
} from "@openuidev/lang-react";
import { Button as OpenUIButton } from "../../components/Button";
import { Buttons as OpenUIButtons } from "../../components/Buttons";
import { FormSchema } from "./schema";

export { FormSchema } from "./schema";

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Form container with fields and submit button",
  component: ({ props, renderNode }) => {
    const formValidation = useCreateFormValidation();
    const triggerAction = useTriggerAction();
    const isStreaming = useIsStreaming();
    const formName = props.name as string;

    return (
      <FormValidationContext.Provider value={formValidation}>
        <FormNameContext.Provider value={formName}>
          <div role="form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {renderNode(props.fields)}
            {props.buttons
              ? renderNode(props.buttons)
              : !isStreaming && (
                  <OpenUIButtons variant="horizontal">
                    <OpenUIButton
                      variant="primary"
                      size="medium"
                      onClick={() => {
                        const valid = formValidation.validateForm();
                        if (!valid) return;
                        triggerAction(
                          "Submit",
                          `User clicked on Button: submit:${formName}`,
                          formName,
                        );
                      }}
                    >
                      Submit
                    </OpenUIButton>
                  </OpenUIButtons>
                )}
          </div>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});
