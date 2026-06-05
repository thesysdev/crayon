"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import MuiTabs from "@mui/material/Tabs";
import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod";

export const Tabs = defineComponent({
  name: "Tabs",
  props: z.object({ children: z.array(z.any()) }),
  description: "Tabbed section container",
  component: ({ props, renderNode }) => {
    const [value, setValue] = useState(0);
    const children = renderNode(props.children);

    if (!Array.isArray(children)) {
      return <Box>{children}</Box>;
    }

    return (
      <Box sx={{ width: "100%" }}>
        <MuiTabs value={Math.min(value, children.length - 1)} onChange={(_, v) => setValue(v)}>
          {children.map((child, idx: number) => {
            const c = child as React.ReactElement<{ label?: string; value?: string }>;
            const tabLabel = c.props?.label ?? `Tab ${idx + 1}`;
            const tabValue = c.props?.value ?? idx;
            return <Tab key={idx} label={tabLabel} value={tabValue} />;
          })}
        </MuiTabs>
        <Box sx={{ pt: 2 }}>{children[value]}</Box>
      </Box>
    );
  },
});

export const TabItem = defineComponent({
  name: "TabItem",
  props: z.object({ value: z.string(), label: z.string(), children: z.array(z.any()) }),
  description: "A single tab panel",
  component: ({ props, renderNode }) => <Box role="tabpanel">{renderNode(props.children)}</Box>,
});
