import clsx from "clsx";
// import 'katex/dist/katex.min.css'
// todo: ask @abhithesys about this
import { memo, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CheckCheck, Copy } from "lucide-react";
import { IconButton } from "../IconButton";

const CodeBlock = ({ language, codeString }: { language: string; codeString: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="group relative crayon-rmr-code-block-wrapper">
      <IconButton
        onClick={handleCopy}
        variant="secondary"
        size={"small"}
        className={clsx(
          "absolute right-2 top-2 opacity-0 group-hover:opacity-100",
          copied ? "text-green-500 hover:!bg-[#00800033]" : "hover:!bg-[#ffffff1a]",
        )}
        icon={copied ? <CheckCheck /> : <Copy />}
      />
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="!m-0 rounded-lg"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const variantStyles = {
  clear: "",
  card: "bg-white rounded-lg p-4",
  sunk: "bg-gray-100 rounded-lg p-4",
};

interface MarkDownRendererProps {
  variant?: "clear" | "card" | "sunk";
  textMarkdown: string;
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
        <code
          className={clsx(
            className,
            "rounded bg-[#282c34] px-1.5 py-1 text-sm font-normal text-gray-100",
            "before:hidden after:hidden",
          )}
          {...props}
        >
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
          className="text-blue-400 no-underline transition-colors hover:underline"
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
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkEmoji, [remarkBreaks, { breaks: true }]]}
        rehypePlugins={[rehypeKatex]}
        components={components}
        // className={clsx(
        //   "prose text-primary max-w-none",
        //   "prose-headings:font-semibold prose-headings:text-primary",
        //   "prose-headings:mt-3 prose-headings:mb-2",
        //   "[&>*]:text-[16px] [&>*]:font-light [&>*]:leading-[1.4] dark:[&>*]:text-white/70",
        //   "prose-p:text-primary prose-p:leading-relaxed",
        //   "prose-strong:text-primary prose-strong:font-semibold",
        //   "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-primary",
        //   "prose-ul:list-disc prose-ul:leading-4 prose-ol:list-decimal prose-ol:leading-4 prose-ol:pl-[20px] prose-ul:pl-[20px]",
        //   "prose-li:marker:text-gray-400 prose-li:leading-4 prose-li:text-primary",
        //   "prose-h1:text-primary prose-h1:text-[20px] prose-h1:font-medium prose-h1:leading-[1.125]",
        //   "prose-h2:text-primary prose-h2:text-[16px] prose-h2:font-light prose-h2:leading-[1.125]",
        //   "prose-hr:border-white/8",
        //   "prose-pre:bg-[#1E1E1E] prose-pre:p-3 prose-pre:my-2 prose-pre:rounded-lg prose-pre:overflow-auto",
        // )}
      >
        {props.textMarkdown}
      </ReactMarkdown>
    </div>
  );
});
