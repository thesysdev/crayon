"use client";

import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { defineComponent } from "@openuidev/react-lang";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <Typography variant="h4" sx={{ my: 1.5 }}>
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography variant="h5" sx={{ my: 1.25 }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="h6" sx={{ my: 1 }}>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body1" sx={{ my: 0.5 }}>
      {children}
    </Typography>
  ),
  a: ({ href, children }) => <Link href={href}>{children}</Link>,
  code: ({ className, children, ...props }) =>
    className ? (
      <Paper
        variant="outlined"
        sx={{ p: 1.5, overflow: "auto", fontFamily: "monospace", fontSize: "0.875rem", my: 1 }}
      >
        <code className={className} {...props}>
          {children}
        </code>
      </Paper>
    ) : (
      <Typography
        component="code"
        variant="body2"
        sx={{ bgcolor: "grey.100", px: 0.5, borderRadius: 0.5, fontFamily: "monospace" }}
      >
        {children}
      </Typography>
    ),
  ul: ({ children }) => (
    <Typography component="ul" variant="body1" sx={{ my: 0.5 }}>
      {children}
    </Typography>
  ),
  ol: ({ children }) => (
    <Typography component="ol" variant="body1" sx={{ my: 0.5 }}>
      {children}
    </Typography>
  ),
  li: ({ children }) => (
    <Typography component="li" variant="body1">
      {children}
    </Typography>
  ),
  blockquote: ({ children }) => (
    <Paper
      variant="outlined"
      sx={{ pl: 2, py: 0.5, my: 1, borderLeft: 4, borderColor: "primary.main" }}
    >
      <Typography variant="body1" color="text.secondary" fontStyle="italic">
        {children}
      </Typography>
    </Paper>
  ),
  hr: () => <Divider sx={{ my: 1 }} />,
};

export const MarkDownRenderer = defineComponent({
  name: "MarkDownRenderer",
  props: z.object({ text: z.string() }),
  description: "Renders markdown text as formatted content",
  component: ({ props }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {props.text as string}
    </ReactMarkdown>
  ),
});
