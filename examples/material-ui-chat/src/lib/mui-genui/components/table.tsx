"use client";

import Paper from "@mui/material/Paper";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

export const Table = defineComponent({
  name: "Table",
  props: z.object({ children: z.array(z.any()) }),
  description: "Data table with columns and rows",
  component: ({ props, renderNode }) => {
    const cols = renderNode(props.children);
    if (!Array.isArray(cols) || cols.length === 0) {
      return (
        <Paper variant="outlined">
          <MuiTable>
            <TableBody>
              <TableRow>
                <TableCell>No data</TableCell>
              </TableRow>
            </TableBody>
          </MuiTable>
        </Paper>
      );
    }

    const headers: string[] = [];
    const rows: Record<string, React.ReactNode>[][] = [];

    for (const col of cols) {
      const label = col?.props?.label ?? "Column";
      const colData: React.ReactNode[] = col?.props?.children ?? col?.props?.data ?? [];
      headers.push(label);

      for (let i = 0; i < colData.length; i++) {
        if (!rows[i]) rows[i] = [];
        rows[i].push({ [label]: colData[i] });
      }
    }

    return (
      <Paper variant="outlined" sx={{ overflow: "auto" }}>
        <MuiTable size="small">
          <TableHead>
            <TableRow>
              {headers.map((h, idx) => (
                <TableCell key={idx} sx={{ fontWeight: "bold" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, ri) => (
              <TableRow key={ri}>
                {headers.map((h, ci) => (
                  <TableCell key={ci}>{row[ci]?.[h] ?? ""}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </Paper>
    );
  },
});

export const Col = defineComponent({
  name: "Col",
  props: z.object({
    label: z.string(),
    children: z.array(z.any()).optional(),
    data: z.array(z.any()).optional(),
  }),
  description: "A column definition for a Table",
  component: () => null,
});
