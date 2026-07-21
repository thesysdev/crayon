import clsx from "clsx";
import { CheckCheck, Copy } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { IconButton } from "../IconButton";

export interface CodeBlockProps {
  language: string;
  codeString: string;
  /**
   * Optional react-syntax-highlighter style object, applied as inline styles.
   * When omitted, highlighting is class-based and themed by prismThemes.scss
   * (light/dark follows the color scheme and `data-openui-mode`).
   */
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
    <div className="openui-code-block-wrapper">
      <IconButton
        onClick={handleCopy}
        variant="secondary"
        size={"small"}
        className={clsx("openui-code-block-copy-button", {
          "openui-code-block-copy-button-copied": copied,
        })}
        icon={copied ? <CheckCheck /> : <Copy />}
        aria-label={copied ? "Copied to clipboard" : "Copy code"}
      />
      <SyntaxHighlighter
        {...(theme
          ? { style: theme }
          : {
              useInlineStyles: false,
              // Overrides the default codeTagProps, which bake theme styles
              // inline on the code tag even with useInlineStyles={false}.
              codeTagProps: { className: language ? `language-${language}` : undefined },
            })}
        language={language}
        PreTag="div"
        className="openui-code-block-syntax-highlighter"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};
