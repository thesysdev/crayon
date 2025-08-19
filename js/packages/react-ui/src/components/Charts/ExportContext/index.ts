import { createContext, useContext } from "react";

interface ExportContext {
  format: 'image'
}

export const ExportContext = createContext<ExportContext | null>(null)
export const ExportContextProvider = ExportContext.Provider

export const useExportContext = () => {
  return useContext(ExportContext)
}
