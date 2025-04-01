import clsx from "clsx";
import { CheckCheck, Copy } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IconButton } from "../IconButton";

export interface CodeBlockProps {
  language: string;
  codeString: string;
  theme?: {
    [key: string]: React.CSSProperties;
  };
}

export const CodeBlock = ({ language, codeString, theme }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="crayon-code-block-wrapper">
      <IconButton
        onClick={handleCopy}
        variant="secondary"
        size={"small"}
        className={clsx("crayon-code-block-copy-button", {
          "crayon-code-block-copy-button-copied": copied,
        })}
        icon={copied ? <CheckCheck /> : <Copy />}
      />
      <SyntaxHighlighter
        style={theme ?? vscDarkPlus}
        language={language}
        PreTag="div"
        className="crayon-code-block-syntax-highlighter"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};
