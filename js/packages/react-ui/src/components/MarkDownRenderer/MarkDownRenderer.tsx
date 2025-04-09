import clsx from "clsx";
import { memo } from "react";
import ReactMarkdown, { Components, type Options } from "react-markdown";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CodeBlock } from "../CodeBlock";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../Table";
import { useTheme } from "../ThemeProvider";

const variantStyles = {
  clear: "",
  card: "crayon-markdown-renderer-card",
  sunk: "crayon-markdown-renderer-card-sunk",
};

export interface MarkDownRendererProps {
  variant?: "clear" | "card" | "sunk";
  textMarkdown: string;
  options?: Options;
  className?: string;
}

export const MarkDownRenderer = memo((props: MarkDownRendererProps) => {
  const { mode } = useTheme();
  const theme = mode === "dark" ? vscDarkPlus : oneLight;
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");

      if (match || (!className && String(children).includes("\n"))) {
        const language = match?.[1] ?? "text";
        const codeString = String(children).trim();
        return <CodeBlock language={language} codeString={codeString} theme={theme} />;
      }

      return (
        <code className={clsx("crayon-markdown-renderer-code", className)} {...props}>
          {children}
        </code>
      );
    },
    a({ href, children, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="crayon-markdown-renderer-link"
          {...props}
        >
          {children}
        </a>
      );
    },
    table: Table,
    thead: TableHeader,
    th: TableHead,
    tbody: TableBody,
    tr: TableRow,
    td: TableCell,
  };

  const markdownProps = {
    ...props.options,
    components: { ...components, ...props.options?.components },
  };

  return (
    <div
      className={clsx(
        props["variant"] && variantStyles[props["variant"] as keyof typeof variantStyles],
        "crayon-markdown-renderer",
        props.className,
      )}
    >
      <ReactMarkdown {...markdownProps}>{props.textMarkdown}</ReactMarkdown>
    </div>
  );
});
