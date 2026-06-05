"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MuiAccordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Accordion = defineComponent({
  name: "Accordion",
  props: z.object({ children: z.array(z.any()) }),
  description: "Collapsible accordion sections",
  component: ({ props, renderNode }) => (
    <Box sx={{ width: "100%" }}>{renderNode(props.children)}</Box>
  ),
});

export const AccordionItemDef = defineComponent({
  name: "AccordionItemDef",
  props: z.object({ title: z.string(), children: z.array(z.any()) }),
  description: "A single accordion section",
  component: ({ props, renderNode }) => (
    <MuiAccordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">{props.title as string}</Typography>
      </AccordionSummary>
      <AccordionDetails>{renderNode(props.children)}</AccordionDetails>
    </MuiAccordion>
  ),
});
