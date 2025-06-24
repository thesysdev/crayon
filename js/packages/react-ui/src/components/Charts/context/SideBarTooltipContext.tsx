import React, { createContext, ReactNode, useContext, useState } from "react";

interface ChartData {
  title: string;
  values: {
    value: number;
    label: string;
    color: string;
  }[];
}

interface SideBarTooltipContextType {
  data: ChartData[];
  isSideBarTooltipOpen: boolean;
  setData: (data: ChartData[]) => void;
  setIsSideBarTooltipOpen: (isOpen: boolean) => void;
}

const SideBarTooltipContext = createContext<SideBarTooltipContextType | undefined>(undefined);

interface SideBarTooltipProviderProps {
  children: ReactNode;
  isSideBarTooltipOpen: boolean;
  setIsSideBarTooltipOpen: (isOpen: boolean) => void;
}

export const SideBarTooltipProvider: React.FC<SideBarTooltipProviderProps> = ({
  children,
  isSideBarTooltipOpen,
  setIsSideBarTooltipOpen,
}) => {
  const [data, setData] = useState<ChartData[]>([]);

  const value: SideBarTooltipContextType = {
    data,
    isSideBarTooltipOpen,
    setData,
    setIsSideBarTooltipOpen,
  };

  return <SideBarTooltipContext.Provider value={value}>{children}</SideBarTooltipContext.Provider>;
};

export const useSideBarTooltip = (): SideBarTooltipContextType => {
  const context = useContext(SideBarTooltipContext);
  if (context === undefined) {
    throw new Error("useSideBarTooltip must be used within a SideBarTooltipProvider");
  }
  return context;
};

export default SideBarTooltipContext;
