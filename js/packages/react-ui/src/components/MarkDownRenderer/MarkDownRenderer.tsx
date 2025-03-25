import clsx from "clsx";
import { memo } from "react";
import ReactMarkdown, { Components, type Options } from "react-markdown";
import { CodeBlock } from "../CodeBlock";

const variantStyles = {
  clear: "",
  card: "crayon-rmr-card",
  sunk: "crayon-rmr-card-sunk",
};

export interface MarkDownRendererProps {
  variant?: "clear" | "card" | "sunk";
  textMarkdown: string;
  options?: Options;
}

export const MarkDownRenderer = memo((props: MarkDownRendererProps) => {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");

      if (match || (!className && String(children).includes("\n"))) {
        const language = match?.[1] ?? "text";
        const codeString = String(children).trim();
        return <CodeBlock language={language} codeString={codeString} />;
      }

      return (
        <code className={clsx("crayon-rmr-code", className)} {...props}>
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
          className="crayon-rmr-link"
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div
      className={clsx(
        props["variant"] && variantStyles[props["variant"] as keyof typeof variantStyles],
        "crayon-markdown-renderer",
      )}
    >
      <ReactMarkdown components={components} {...props.options}>
        {props.textMarkdown}
      </ReactMarkdown>
    </div>
  );
});
