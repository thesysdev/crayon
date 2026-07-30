import { Box, Text, useFocus, useInput } from "ink";
import { Component, Fragment, type ReactNode, useState } from "react";
import { renderBars } from "./chart.js";
import { FormNameProvider, useFormName, useTui } from "./context.js";

/** The render contract each library component receives (matches lang-core's ComponentRenderProps). */
interface ViewProps {
  props: Record<string, unknown>;
  renderNode: (value: unknown) => ReactNode;
  statementId?: string;
}

/** Common signature for every library view (keeps the library's component type uniform). */
export type View = (p: ViewProps) => ReactNode;

const str = (v: unknown): string => (v == null ? "" : String(v));

// ─────────────────────────── tree walker ───────────────────────────

/** Walk any evaluated value into Ink nodes (mirrors react-lang's renderDeep). */
export function RenderValue({ value }: { value: unknown }): ReactNode {
  if (value == null || value === false) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <Text>{String(value)}</Text>;
  }
  if (Array.isArray(value)) {
    return (
      <>
        {value.map((v, i) => (
          <Fragment key={i}>
            <RenderValue value={v} />
          </Fragment>
        ))}
      </>
    );
  }
  if (typeof value === "object" && (value as { type?: string }).type === "element") {
    return <RenderNode node={value as ElementLike} />;
  }
  return null;
}

interface ElementLike {
  type: "element";
  typeName: string;
  props: Record<string, unknown>;
  statementId?: string;
}

function RenderNode({ node }: { node: ElementLike }): ReactNode {
  const { library } = useTui();
  const Comp = library.components[node.typeName]?.component as
    | ((p: ViewProps) => ReactNode)
    | undefined;

  if (!Comp) return <Text color="yellow">[unknown component: {node.typeName}]</Text>;

  return (
    <ElementErrorBoundary name={node.typeName}>
      <Comp
        props={node.props ?? {}}
        renderNode={(v) => <RenderValue value={v} />}
        statementId={node.statementId}
      />
    </ElementErrorBoundary>
  );
}

class ElementErrorBoundary extends Component<
  { name: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <Text color="red">[render error in {this.props.name}]</Text>;
    }
    return this.props.children;
  }
}

// ─────────────────────────── content components ───────────────────────────

function CardView({ props, renderNode }: ViewProps) {
  const children = Array.isArray(props.children) ? props.children : [];
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
      {children.map((c, i) => (
        <Box key={i} flexDirection="column">
          {renderNode(c)}
        </Box>
      ))}
    </Box>
  );
}

function CardHeaderView({ props }: ViewProps) {
  return (
    <Box flexDirection="column">
      {props.title ? <Text bold>{str(props.title)}</Text> : null}
      {props.subtitle ? <Text dimColor>{str(props.subtitle)}</Text> : null}
    </Box>
  );
}

function TextContentView({ props }: ViewProps) {
  const size = str(props.size);
  const heavy = size.includes("heavy") || size === "large";
  return <Text bold={heavy}>{str(props.text)}</Text>;
}

function TableView({ props }: ViewProps) {
  const columns = Array.isArray(props.columns) ? props.columns : [];
  const headers = columns.map((c) => str((c as ElementLike)?.props?.label));
  const data = columns.map((c) => {
    const d = (c as ElementLike)?.props?.data;
    return Array.isArray(d) ? d.map((x) => str(x)) : [];
  });
  const rowCount = Math.max(0, ...data.map((d) => d.length));
  const widths = headers.map((h, ci) =>
    Math.max(h.length, ...(data[ci]!.length ? data[ci]!.map((s) => s.length) : [0])),
  );
  const pad = (s: string, w: number) => (s.length >= w ? s : s + " ".repeat(w - s.length));
  const line = (cells: string[]) => cells.map((c, ci) => pad(c, widths[ci]!)).join("  ");

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>{line(headers)}</Text>
      <Text dimColor>{widths.map((w) => "─".repeat(w)).join("  ")}</Text>
      {Array.from({ length: rowCount }).map((_, ri) => (
        <Text key={ri}>{line(headers.map((_, ci) => data[ci]![ri] ?? ""))}</Text>
      ))}
    </Box>
  );
}

function BarChartView({ props }: ViewProps) {
  const labels = Array.isArray(props.labels) ? props.labels.map(str) : [];
  const series = Array.isArray(props.series) ? (props.series as { props?: Record<string, unknown> }[]) : [];
  const lines = renderBars(labels, series);
  return (
    <Box flexDirection="column" marginTop={1}>
      {props.yLabel ? <Text dimColor>{str(props.yLabel)}</Text> : null}
      {lines.map((ln, i) => (
        <Text key={i} color="cyan">
          {ln}
        </Text>
      ))}
      {props.xLabel ? <Text dimColor>{str(props.xLabel)}</Text> : null}
    </Box>
  );
}

// ─────────────────────────── interactive components ───────────────────────────

function FollowUpBlockView({ props, renderNode }: ViewProps) {
  const items = Array.isArray(props.items) ? props.items : [];
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>Related (Tab to focus, Enter to ask):</Text>
      {items.map((it, i) => (
        <Box key={i}>{renderNode(it)}</Box>
      ))}
    </Box>
  );
}

function FollowUpItemView({ props }: ViewProps) {
  const { interactive } = useTui();
  const text = str(props.text);
  return interactive ? (
    <FollowUpItemInteractive text={text} />
  ) : (
    <Text color="magenta">{"• "}{text}</Text>
  );
}

function FollowUpItemInteractive({ text }: { text: string }) {
  const { isFocused } = useFocus();
  const { triggerAction } = useTui();
  useInput(
    (_input, key) => {
      if (key.return) triggerAction(text);
    },
    { isActive: isFocused },
  );
  return (
    <Text color={isFocused ? "black" : "magenta"} backgroundColor={isFocused ? "magenta" : undefined}>
      {isFocused ? "❯ " : "• "}
      {text}
    </Text>
  );
}

function ButtonsView({ props, renderNode }: ViewProps) {
  const buttons = Array.isArray(props.buttons) ? props.buttons : [];
  const direction = props.direction === "column" ? "column" : "row";
  return (
    <Box flexDirection={direction} gap={1} marginTop={1}>
      {buttons.map((b, i) => (
        <Box key={i}>{renderNode(b)}</Box>
      ))}
    </Box>
  );
}

function ButtonView({ props }: ViewProps) {
  const { interactive } = useTui();
  const label = str(props.label) || "Button";
  return interactive ? (
    <ButtonInteractive label={label} action={props.action} />
  ) : (
    <Text color="cyan">{`[ ${label} ]`}</Text>
  );
}

function ButtonInteractive({ label, action }: { label: string; action: unknown }) {
  const { isFocused } = useFocus();
  const formName = useFormName();
  const { triggerAction } = useTui();
  useInput(
    (_input, key) => {
      if (key.return) triggerAction(label, formName, action);
    },
    { isActive: isFocused },
  );
  return (
    <Text color={isFocused ? "black" : "cyan"} backgroundColor={isFocused ? "cyan" : undefined}>
      {` ${label} `}
    </Text>
  );
}

function FormView({ props, renderNode }: ViewProps) {
  const name = str(props.name) || "form";
  const fields = Array.isArray(props.fields) ? props.fields : [];
  return (
    <FormNameProvider value={name}>
      <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1} marginTop={1}>
        <Text dimColor>Tab between fields · type to fill · number keys or ↑↓ to choose · Enter on a button to submit</Text>
        {fields.map((f, i) => (
          <Box key={i}>{renderNode(f)}</Box>
        ))}
        <Box>{renderNode(props.buttons)}</Box>
      </Box>
    </FormNameProvider>
  );
}

function FormControlView({ props, renderNode }: ViewProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>{str(props.label)}</Text>
      {props.hint ? <Text dimColor>{str(props.hint)}</Text> : null}
      <Box>{renderNode(props.input)}</Box>
    </Box>
  );
}

function InputView({ props }: ViewProps) {
  const { interactive } = useTui();
  if (!interactive) {
    return (
      <Text dimColor>
        {"  "}
        {str(props.placeholder) || str(props.name)}
      </Text>
    );
  }
  return <InputInteractive props={props} />;
}

function InputInteractive({ props }: { props: Record<string, unknown> }) {
  const { isFocused } = useFocus();
  const formName = useFormName();
  const { getFieldValue, setFieldValue } = useTui();
  const name = str(props.name);
  const value = str(getFieldValue(formName, name));
  useInput(
    (input, key) => {
      if (key.backspace || key.delete) {
        setFieldValue(formName, "Input", name, value.slice(0, -1));
        return;
      }
      if (key.return || key.tab || key.upArrow || key.downArrow || key.leftArrow || key.rightArrow)
        return;
      if (input && !key.ctrl && !key.meta) setFieldValue(formName, "Input", name, value + input);
    },
    { isActive: isFocused },
  );
  const shown = value.length ? value : str(props.placeholder);
  return (
    <Text color={isFocused ? "cyan" : "gray"}>
      {isFocused ? "❯ " : "  "}
      {shown}
      {isFocused ? "▏" : ""}
    </Text>
  );
}

function SelectView({ props }: ViewProps) {
  const { interactive } = useTui();
  const items = Array.isArray(props.items) ? props.items : [];
  if (!interactive) {
    return (
      <Box flexDirection="column">
        {items.map((it, i) => (
          <Text key={i} dimColor>
            {"  ( ) "}
            {str((it as ElementLike)?.props?.label ?? (it as ElementLike)?.props?.value)}
          </Text>
        ))}
      </Box>
    );
  }
  return <SelectInteractive props={props} />;
}

function SelectInteractive({ props }: { props: Record<string, unknown> }) {
  const { isFocused } = useFocus();
  const formName = useFormName();
  const { getFieldValue, setFieldValue } = useTui();
  const name = str(props.name);
  const items = Array.isArray(props.items) ? props.items : [];
  const options = items.map((it) => ({
    value: str((it as ElementLike)?.props?.value),
    label: str((it as ElementLike)?.props?.label ?? (it as ElementLike)?.props?.value),
  }));
  const current = str(getFieldValue(formName, name));
  const initialIndex = Math.max(
    0,
    options.findIndex((o) => o.value === current),
  );
  const [cursor, setCursor] = useState(initialIndex);
  // Bumped on every choice so the row re-renders immediately, even when the
  // cursor index is unchanged (e.g. pressing Enter) where a store-only update
  // may not repaint on the next frame.
  const [, bump] = useState(0);

  // Arrow keys select immediately (radio-group behaviour) for instant feedback;
  // Enter also confirms the current row.
  const choose = (index: number) => {
    const clamped = Math.max(0, Math.min(options.length - 1, index));
    const option = options[clamped];
    setCursor(clamped);
    bump((n) => n + 1);
    if (option) setFieldValue(formName, "Select", name, option.value);
  };

  useInput(
    (input, key) => {
      // Number keys pick an option directly — no cursor movement needed.
      if (/^[1-9]$/.test(input) && !key.ctrl && !key.meta) {
        const index = Number(input) - 1;
        if (index < options.length) choose(index);
        return;
      }
      if (key.upArrow) choose(cursor - 1);
      else if (key.downArrow) choose(cursor + 1);
      else if (key.return) choose(cursor);
    },
    { isActive: isFocused },
  );

  return (
    <Box flexDirection="column">
      {options.map((o, i) => {
        const isSel = o.value === current;
        const isCursor = isFocused && i === cursor;
        return (
          <Text key={o.value || i} color={isCursor ? "cyan" : isSel ? "green" : undefined}>
            {isCursor ? "❯ " : "  "}
            {isSel ? "(•) " : "( ) "}
            {i + 1}. {o.label}
          </Text>
        );
      })}
      {isFocused ? <Text dimColor> press 1-{options.length} or ↑↓ to choose</Text> : null}
    </Box>
  );
}

/** No-op view for purely structural nodes (parent reads their props directly). */
function StructuralView(_props: ViewProps): ReactNode {
  return null;
}

export const views: Record<string, View> = {
  Card: CardView,
  CardHeader: CardHeaderView,
  TextContent: TextContentView,
  Table: TableView,
  Col: StructuralView,
  BarChart: BarChartView,
  Series: StructuralView,
  FollowUpBlock: FollowUpBlockView,
  FollowUpItem: FollowUpItemView,
  Form: FormView,
  FormControl: FormControlView,
  Input: InputView,
  Select: SelectView,
  SelectItem: StructuralView,
  Buttons: ButtonsView,
  Button: ButtonView,
};
