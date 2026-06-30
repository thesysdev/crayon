import { AlertCircle } from "lucide-react";

/**
 * Inline fallback shown when a matched renderer's `parse`/`parser` throws.
 * Keeps one bad renderer from blanking the whole thread.
 *
 * @internal
 */
export function ToolCallErrorFallback({ error, toolName }: { error: string; toolName: string }) {
  return (
    <div className="openui-tool-call openui-tool-call--error" data-status="error">
      <div className="openui-tool-call__title-row">
        <span className="openui-tool-call__icon-wrapper">
          <AlertCircle size={14} className="openui-tool-call__icon" />
        </span>
        <span className="openui-tool-call__name">Couldn’t render the {toolName} tool</span>
      </div>
      <div className="openui-tool-call__connector openui-tool-call__connector--last">
        <div className="openui-tool-call__args-block">
          <pre className="openui-tool-code-block__code openui-tool-code-block__code--error">
            {error}
          </pre>
        </div>
      </div>
    </div>
  );
}
