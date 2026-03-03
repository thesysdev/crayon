import CodeBlock from "@components/components/CodeBlock/CodeBlock";
import type { ThemeMode } from "@components/types";

interface PreviewCodeProps {
  code?: string;
  themeMode?: ThemeMode;
}

export default function PreviewCode({ code, themeMode }: PreviewCodeProps) {
  if (!code) return null;
  return <CodeBlock code={code} themeMode={themeMode} />;
}
