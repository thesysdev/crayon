import CodeBlock from "@design-system/components/CodeBlock/CodeBlock";
import type { ThemeMode } from "@design-system/types";

interface PreviewCodeProps {
  code?: string;
  themeMode?: ThemeMode;
}

export default function PreviewCode({ code, themeMode }: PreviewCodeProps) {
  if (!code) return null;
  return <CodeBlock code={code} themeMode={themeMode} />;
}
