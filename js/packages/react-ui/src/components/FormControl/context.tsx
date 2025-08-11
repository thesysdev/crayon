import React, { createContext, useContext } from "react";

export interface FormControlContextValue {
  isError: boolean;
}

const FormControlContext = createContext<FormControlContextValue | undefined>(undefined);

export function useFormControlContext(): FormControlContextValue | undefined {
  return useContext(FormControlContext);
}

export function FormControlProvider(
  props: React.PropsWithChildren<{ value: FormControlContextValue }>,
) {
  const { value, children } = props;
  return <FormControlContext.Provider value={value}>{children}</FormControlContext.Provider>;
}
