// OpenUI Rust TUI — a ratatui renderer for streamed OpenUI Lang.
//
// A Node "bridge" (bridge/src/bridge.ts) is the OpenUI brain: it uses
// @openuidev/lang-core to parse the streamed OpenUI Lang and emits a serialized
// render tree (JSON, one object per line) on stdout, and accepts actions on
// stdin. This Rust process is a pure renderer + input handler: it draws the tree
// with ratatui and, because ratatui is immediate-mode (we own every widget's
// Rect), mouse hit-testing is pixel-exact and long content scrolls cleanly.

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{self, Receiver};
use std::thread;
use std::time::Duration;

use crossterm::event::{
    self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEvent, KeyModifiers,
    MouseButton, MouseEvent, MouseEventKind,
};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::prelude::*;
use ratatui::widgets::{Block, Borders, Clear, Paragraph};
use serde_json::Value;

// ─────────────────────────── bridge protocol ───────────────────────────

enum BridgeMsg {
    Ready,
    Render { root: Option<Value>, streaming: bool },
    Error(String),
}

fn spawn_bridge() -> std::io::Result<(Child, Receiver<BridgeMsg>, ChildStdin)> {
    let bridge_entry = concat!(env!("CARGO_MANIFEST_DIR"), "/bridge/src/bridge.ts");
    let mut child = Command::new("node")
        .args(["--import", "tsx", bridge_entry])
        .current_dir(concat!(env!("CARGO_MANIFEST_DIR"), "/bridge"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()?;

    let stdout = child.stdout.take().expect("bridge stdout");
    let stdin = child.stdin.take().expect("bridge stdin");
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let Ok(line) = line else { break };
            let Ok(v) = serde_json::from_str::<Value>(&line) else { continue };
            let msg = match v.get("type").and_then(Value::as_str) {
                Some("ready") => BridgeMsg::Ready,
                Some("render") => BridgeMsg::Render {
                    root: v.get("root").filter(|r| !r.is_null()).cloned(),
                    streaming: v.get("streaming").and_then(Value::as_bool).unwrap_or(false),
                },
                Some("error") => {
                    BridgeMsg::Error(v.get("message").and_then(Value::as_str).unwrap_or("error").to_string())
                }
                _ => continue,
            };
            if tx.send(msg).is_err() {
                break;
            }
        }
    });

    Ok((child, rx, stdin))
}

// ─────────────────────────── interactive targets ───────────────────────────

#[derive(Clone)]
enum TargetKind {
    Button { message: String, form: Option<String> },
    FollowUp { text: String },
    Input { form: String, name: String },
    Select { form: String, name: String, options: Vec<(String, String)> },
}

#[derive(Clone)]
struct Target {
    kind: TargetKind,
    top: usize,    // first content line (pre-scroll) this target occupies
    height: usize, // number of content lines
}

#[derive(Clone, Copy, PartialEq)]
enum Focus {
    Composer,
    Target(usize),
}

// ─────────────────────────── app state ───────────────────────────

struct App {
    root: Option<Value>,
    streaming: bool,
    composer: String,
    focus: Focus,
    scroll: usize,
    fields: HashMap<(String, String), String>,
    selects: HashMap<(String, String), String>,
    select_cursor: HashMap<(String, String), usize>,
    error: Option<String>,
    status: String,
    // recomputed each frame:
    targets: Vec<Target>,
    content_area: Rect,
    content_height: usize,
    total_lines: usize,
    should_quit: bool,
}

impl App {
    fn new() -> Self {
        App {
            root: None,
            streaming: false,
            composer: String::new(),
            focus: Focus::Composer,
            scroll: 0,
            fields: HashMap::new(),
            selects: HashMap::new(),
            select_cursor: HashMap::new(),
            error: None,
            status: "Ask for UI — a chart, a table, a callout, or a (long) form.".to_string(),
            targets: Vec::new(),
            content_area: Rect::default(),
            content_height: 0,
            total_lines: 0,
            should_quit: false,
        }
    }
}

const GRAD_START: (u8, u8, u8) = (0, 224, 255);
const GRAD_END: (u8, u8, u8) = (180, 90, 255);

fn gradient_line(text: &str, bold: bool) -> Line<'static> {
    let chars: Vec<char> = text.chars().collect();
    let n = chars.len().max(1) as f32 - 1.0;
    let spans: Vec<Span> = chars
        .iter()
        .enumerate()
        .map(|(i, c)| {
            let t = if n <= 0.0 { 0.0 } else { i as f32 / n };
            let r = (GRAD_START.0 as f32 + (GRAD_END.0 as f32 - GRAD_START.0 as f32) * t) as u8;
            let g = (GRAD_START.1 as f32 + (GRAD_END.1 as f32 - GRAD_START.1 as f32) * t) as u8;
            let b = (GRAD_START.2 as f32 + (GRAD_END.2 as f32 - GRAD_START.2 as f32) * t) as u8;
            let mut style = Style::default().fg(Color::Rgb(r, g, b));
            if bold {
                style = style.add_modifier(Modifier::BOLD);
            }
            Span::styled(c.to_string(), style)
        })
        .collect();
    Line::from(spans)
}

fn main() -> std::io::Result<()> {
    if std::env::var("OPENAI_API_KEY").is_err() {
        eprintln!("OPENAI_API_KEY is not set. Export it (and optionally OPENAI_BASE_URL / OPENAI_MODEL) and retry.");
        std::process::exit(1);
    }

    let (mut child, rx, mut bridge_stdin) = spawn_bridge()?;

    enable_raw_mode()?;
    let mut stdout = std::io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::new();
    let res = run(&mut terminal, &mut app, &rx, &mut bridge_stdin);

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen, DisableMouseCapture)?;
    terminal.show_cursor()?;
    let _ = child.kill();

    res
}

fn run<B: Backend>(
    terminal: &mut Terminal<B>,
    app: &mut App,
    rx: &Receiver<BridgeMsg>,
    bridge_stdin: &mut ChildStdin,
) -> std::io::Result<()> {
    loop {
        // Drain bridge messages.
        while let Ok(msg) = rx.try_recv() {
            match msg {
                BridgeMsg::Ready => {}
                BridgeMsg::Render { root, streaming } => {
                    app.root = root;
                    app.streaming = streaming;
                    app.error = None;
                    if !streaming {
                        app.status = "Tab/click to focus · Enter/click to act · type to fill · ↑↓/click to choose".to_string();
                    }
                }
                BridgeMsg::Error(e) => {
                    app.error = Some(e);
                    app.streaming = false;
                }
            }
        }

        terminal.draw(|f| draw(f, app))?;

        if app.should_quit {
            return Ok(());
        }

        if event::poll(Duration::from_millis(60))? {
            match event::read()? {
                Event::Key(key) => handle_key(app, key, bridge_stdin),
                Event::Mouse(m) => handle_mouse(app, m, bridge_stdin),
                Event::Resize(_, _) => {}
                _ => {}
            }
        }
    }
}

// ─────────────────────────── drawing ───────────────────────────

fn draw(f: &mut Frame, app: &mut App) {
    let area = f.area();
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(1), Constraint::Min(1), Constraint::Length(4)])
        .split(area);

    // Header
    let mut header = gradient_line(" ◆ OpenUI (Rust/ratatui) ", true).spans;
    header.push(Span::styled(
        "  streamed OpenUI Lang, rendered natively",
        Style::default().add_modifier(Modifier::DIM),
    ));
    f.render_widget(Paragraph::new(Line::from(header)), chunks[0]);

    // Content
    let (lines, targets) = build_view(app);
    app.targets = targets;
    app.total_lines = lines.len();
    let content_area = chunks[1];
    let inner_h = content_area.height.saturating_sub(2) as usize; // minus border
    app.content_height = inner_h;
    app.content_area = content_area;

    // Clamp scroll and auto-scroll to the focused target.
    if let Focus::Target(i) = app.focus {
        if let Some(t) = app.targets.get(i) {
            if t.top < app.scroll {
                app.scroll = t.top;
            } else if t.top + t.height > app.scroll + inner_h.max(1) {
                app.scroll = (t.top + t.height).saturating_sub(inner_h.max(1));
            }
        }
    }
    let max_scroll = app.total_lines.saturating_sub(inner_h.max(1));
    if app.scroll > max_scroll {
        app.scroll = max_scroll;
    }

    let scrolled = app.streaming; // subtle hint could be added
    let _ = scrolled;
    let title = if app.total_lines > inner_h {
        format!(" ◆ OpenUI  (scroll ↑↓ · {}/{}) ", app.scroll + 1, app.total_lines)
    } else {
        " ◆ OpenUI ".to_string()
    };
    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::DarkGray))
        .title(Span::styled(title, Style::default().fg(Color::Cyan)));
    let para = Paragraph::new(lines)
        .block(block)
        .scroll((app.scroll as u16, 0));
    f.render_widget(Clear, content_area);
    f.render_widget(para, content_area);

    // Composer
    let composer_focused = app.focus == Focus::Composer;
    let border_color = if composer_focused { Color::Magenta } else { Color::DarkGray };
    let mut composer_spans = vec![Span::styled(
        "❯ ",
        Style::default().fg(if composer_focused { Color::Magenta } else { Color::Gray }),
    )];
    if app.composer.is_empty() {
        composer_spans.push(Span::styled(
            if app.streaming { "waiting for response…" } else { "Message OpenUI…" },
            Style::default().add_modifier(Modifier::DIM),
        ));
    } else {
        composer_spans.push(Span::raw(app.composer.clone()));
        if composer_focused {
            composer_spans.push(Span::styled("▏", Style::default().fg(Color::Magenta)));
        }
    }
    let hint = if let Some(err) = &app.error {
        Line::from(Span::styled(format!("error: {err}"), Style::default().fg(Color::Red)))
    } else {
        Line::from(Span::styled(
            format!("  {}", app.status),
            Style::default().add_modifier(Modifier::DIM),
        ))
    };
    let composer = Paragraph::new(vec![Line::from(composer_spans), hint]).block(
        Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(border_color))
            .title(Span::styled(
                " message · Enter send · Tab focus · Ctrl+C quit ",
                Style::default().add_modifier(Modifier::DIM),
            )),
    );
    f.render_widget(composer, chunks[2]);
}

// ─────────────────────────── view builder (tree → lines + targets) ─────────

fn prop<'a>(node: &'a Value, key: &str) -> Option<&'a Value> {
    node.get("props").and_then(|p| p.get(key))
}
fn pstr(node: &Value, key: &str) -> String {
    prop(node, key).and_then(Value::as_str).unwrap_or("").to_string()
}
fn type_name(node: &Value) -> &str {
    node.get("typeName").and_then(Value::as_str).unwrap_or("")
}

struct ViewCtx<'a> {
    app: &'a App,
    lines: Vec<Line<'static>>,
    targets: Vec<Target>,
    form: Option<String>,
}

fn build_view(app: &App) -> (Vec<Line<'static>>, Vec<Target>) {
    let mut ctx = ViewCtx { app, lines: Vec::new(), targets: Vec::new(), form: None };
    match &app.root {
        None => {
            if app.streaming {
                ctx.lines.push(Line::from(Span::styled(
                    "◐ OpenUI is thinking…",
                    Style::default().fg(Color::Cyan),
                )));
            } else {
                ctx.lines.push(Line::from(Span::styled(
                    "Ask for a chart, a table, a callout, or a long form — it renders here.",
                    Style::default().add_modifier(Modifier::DIM),
                )));
            }
        }
        Some(root) => {
            // The root is a Card; render its children.
            if let Some(children) = prop(root, "children").and_then(Value::as_array) {
                for child in children {
                    walk(&mut ctx, child);
                }
            } else {
                walk(&mut ctx, root);
            }
        }
    }
    (ctx.lines, ctx.targets)
}

fn push_line(ctx: &mut ViewCtx, line: Line<'static>) {
    ctx.lines.push(line);
}

fn walk(ctx: &mut ViewCtx, node: &Value) {
    match type_name(node) {
        "Card" => {
            if let Some(children) = prop(node, "children").and_then(Value::as_array) {
                for c in children {
                    walk(ctx, c);
                }
            }
        }
        "CardHeader" => {
            let title = pstr(node, "title");
            if !title.is_empty() {
                push_line(ctx, gradient_line(&title, true));
            }
            let subtitle = pstr(node, "subtitle");
            if !subtitle.is_empty() {
                push_line(ctx, Line::from(Span::styled(subtitle, Style::default().add_modifier(Modifier::DIM))));
            }
            push_line(ctx, Line::from(""));
        }
        "TextContent" => {
            let text = pstr(node, "text");
            let size = pstr(node, "size");
            let heavy = size.contains("heavy");
            let large = size == "large" || size == "large-heavy";
            if large {
                push_line(ctx, gradient_line(&text, heavy));
            } else {
                let mut style = Style::default();
                if heavy {
                    style = style.add_modifier(Modifier::BOLD);
                }
                if size == "small" {
                    style = style.add_modifier(Modifier::DIM);
                }
                push_line(ctx, Line::from(Span::styled(text, style)));
            }
            push_line(ctx, Line::from(""));
        }
        "Callout" => {
            let variant = pstr(node, "variant");
            let (color, icon) = match variant.as_str() {
                "success" => (Color::Green, "✓"),
                "warning" => (Color::Yellow, "⚠"),
                "error" => (Color::Red, "✕"),
                "neutral" => (Color::Gray, "•"),
                _ => (Color::Cyan, "ℹ"),
            };
            let title = pstr(node, "title");
            push_line(
                ctx,
                Line::from(vec![
                    Span::styled("▌ ", Style::default().fg(color)),
                    Span::styled(format!("{icon} {title}"), Style::default().fg(color).add_modifier(Modifier::BOLD)),
                ]),
            );
            let desc = pstr(node, "description");
            if !desc.is_empty() {
                push_line(
                    ctx,
                    Line::from(vec![Span::styled("▌ ", Style::default().fg(color)), Span::raw(desc)]),
                );
            }
            push_line(ctx, Line::from(""));
        }
        "TagBlock" => {
            let tag_colors = [Color::Cyan, Color::Magenta, Color::Green, Color::Yellow, Color::Blue];
            let mut spans = Vec::new();
            if let Some(tags) = prop(node, "tags").and_then(Value::as_array) {
                for (i, t) in tags.iter().enumerate() {
                    let label = t.as_str().unwrap_or("").to_string();
                    spans.push(Span::styled(
                        format!(" {label} "),
                        Style::default().bg(tag_colors[i % tag_colors.len()]).fg(Color::Black),
                    ));
                    spans.push(Span::raw(" "));
                }
            }
            push_line(ctx, Line::from(spans));
            push_line(ctx, Line::from(""));
        }
        "Table" => render_table(ctx, node),
        "BarChart" => render_bar_chart(ctx, node),
        "FollowUpBlock" => {
            push_line(ctx, Line::from(Span::styled("Related:", Style::default().add_modifier(Modifier::DIM))));
            if let Some(items) = prop(node, "items").and_then(Value::as_array) {
                for it in items {
                    let text = pstr(it, "text");
                    let idx = ctx.targets.len();
                    let focused = ctx.app.focus == Focus::Target(idx);
                    let style = if focused {
                        Style::default().fg(Color::Black).bg(Color::Magenta)
                    } else {
                        Style::default().fg(Color::Magenta)
                    };
                    let top = ctx.lines.len();
                    push_line(ctx, Line::from(Span::styled(format!("{} {}", if focused { "❯" } else { "•" }, text), style)));
                    ctx.targets.push(Target { kind: TargetKind::FollowUp { text }, top, height: 1 });
                }
            }
            push_line(ctx, Line::from(""));
        }
        "Form" => {
            let name = pstr(node, "name");
            let prev_form = ctx.form.clone();
            ctx.form = Some(if name.is_empty() { "form".to_string() } else { name });
            if let Some(fields) = prop(node, "fields").and_then(Value::as_array) {
                for fc in fields {
                    walk(ctx, fc);
                }
            }
            if let Some(buttons) = prop(node, "buttons") {
                walk(ctx, buttons);
            }
            ctx.form = prev_form;
            push_line(ctx, Line::from(""));
        }
        "FormControl" => {
            let label = pstr(node, "label");
            push_line(ctx, Line::from(Span::styled(label, Style::default().add_modifier(Modifier::BOLD))));
            let hint = pstr(node, "hint");
            if !hint.is_empty() {
                push_line(ctx, Line::from(Span::styled(hint, Style::default().add_modifier(Modifier::DIM))));
            }
            if let Some(input) = prop(node, "input") {
                walk(ctx, input);
            }
            push_line(ctx, Line::from(""));
        }
        "Input" => render_input(ctx, node),
        "Select" => render_select(ctx, node),
        "Buttons" => {
            if let Some(buttons) = prop(node, "buttons").and_then(Value::as_array) {
                for b in buttons {
                    walk(ctx, b);
                }
            }
        }
        "Button" => render_button(ctx, node),
        other => {
            push_line(ctx, Line::from(Span::styled(format!("[unsupported: {other}]"), Style::default().fg(Color::Yellow))));
        }
    }
}

fn render_table(ctx: &mut ViewCtx, node: &Value) {
    let empty = Vec::new();
    let columns = prop(node, "columns").and_then(Value::as_array).unwrap_or(&empty);
    let headers: Vec<String> = columns.iter().map(|c| pstr(c, "label")).collect();
    let data: Vec<Vec<String>> = columns
        .iter()
        .map(|c| {
            prop(c, "data")
                .and_then(Value::as_array)
                .map(|d| d.iter().map(cell_to_string).collect())
                .unwrap_or_default()
        })
        .collect();
    let rows = data.iter().map(|d| d.len()).max().unwrap_or(0);
    let widths: Vec<usize> = headers
        .iter()
        .enumerate()
        .map(|(ci, h)| {
            let dw = data[ci].iter().map(|s| s.chars().count()).max().unwrap_or(0);
            h.chars().count().max(dw)
        })
        .collect();
    let pad = |s: &str, w: usize| format!("{:<width$}", s, width = w);
    let header_line: String = headers
        .iter()
        .enumerate()
        .map(|(ci, h)| pad(h, widths[ci]))
        .collect::<Vec<_>>()
        .join("  ");
    push_line(ctx, Line::from(Span::styled(header_line, Style::default().add_modifier(Modifier::BOLD))));
    let sep: String = widths.iter().map(|w| "─".repeat(*w)).collect::<Vec<_>>().join("  ");
    push_line(ctx, Line::from(Span::styled(sep, Style::default().add_modifier(Modifier::DIM))));
    for r in 0..rows {
        let row: String = (0..headers.len())
            .map(|ci| pad(data[ci].get(r).map(String::as_str).unwrap_or(""), widths[ci]))
            .collect::<Vec<_>>()
            .join("  ");
        push_line(ctx, Line::from(row));
    }
    push_line(ctx, Line::from(""));
}

fn cell_to_string(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        Value::Bool(b) => b.to_string(),
        _ => String::new(),
    }
}

fn render_bar_chart(ctx: &mut ViewCtx, node: &Value) {
    let ylabel = pstr(node, "yLabel");
    if !ylabel.is_empty() {
        push_line(ctx, Line::from(Span::styled(ylabel, Style::default().add_modifier(Modifier::DIM))));
    }
    let empty = Vec::new();
    let labels: Vec<String> = prop(node, "labels")
        .and_then(Value::as_array)
        .unwrap_or(&empty)
        .iter()
        .map(|v| v.as_str().unwrap_or("").to_string())
        .collect();
    let series = prop(node, "series").and_then(Value::as_array).cloned().unwrap_or_default();
    let mut rows: Vec<(String, f64)> = Vec::new();
    let multi = series.len() > 1;
    for (i, label) in labels.iter().enumerate() {
        for s in &series {
            let cat = pstr(s, "category");
            let vals = prop(s, "values").and_then(Value::as_array).cloned().unwrap_or_default();
            let v = vals.get(i).and_then(Value::as_f64).unwrap_or(0.0);
            let name = if multi { format!("{label} · {cat}") } else { label.clone() };
            rows.push((name, v));
        }
    }
    let max = rows.iter().map(|(_, v)| v.abs()).fold(1.0_f64, f64::max);
    let name_w = rows.iter().map(|(n, _)| n.chars().count()).max().unwrap_or(0);
    for (name, v) in rows {
        let bar_len = ((v.abs() / max) * 32.0).round() as usize;
        let bar = "█".repeat(bar_len.max(1));
        push_line(
            ctx,
            Line::from(vec![
                Span::raw(format!("{:<width$} │ ", name, width = name_w)),
                gradient_span(&bar),
                Span::raw(format!(" {}", trim_num(v))),
            ]),
        );
    }
    let xlabel = pstr(node, "xLabel");
    if !xlabel.is_empty() {
        push_line(ctx, Line::from(Span::styled(xlabel, Style::default().add_modifier(Modifier::DIM))));
    }
    push_line(ctx, Line::from(""));
}

fn gradient_span(text: &str) -> Span<'static> {
    // Single-color approximation for a bar (cyan-ish); per-char gradient in a
    // Span isn't possible, so we use the gradient start color.
    Span::styled(text.to_string(), Style::default().fg(Color::Rgb(GRAD_START.0, GRAD_START.1, GRAD_START.2)))
}

fn trim_num(v: f64) -> String {
    if v.fract() == 0.0 {
        format!("{}", v as i64)
    } else {
        format!("{v}")
    }
}

fn render_input(ctx: &mut ViewCtx, node: &Value) {
    let form = ctx.form.clone().unwrap_or_default();
    let name = pstr(node, "name");
    let idx = ctx.targets.len();
    let focused = ctx.app.focus == Focus::Target(idx);
    let value = ctx.app.fields.get(&(form.clone(), name.clone())).cloned().unwrap_or_default();
    let shown = if value.is_empty() { pstr(node, "placeholder") } else { value.clone() };
    let style = if focused {
        Style::default().fg(Color::Cyan)
    } else {
        Style::default().fg(Color::Gray)
    };
    let mut spans = vec![
        Span::styled(if focused { "❯ " } else { "  " }, style),
        Span::styled(shown, style),
    ];
    if focused {
        spans.push(Span::styled("▏", Style::default().fg(Color::Cyan)));
    }
    let top = ctx.lines.len();
    push_line(ctx, Line::from(spans));
    ctx.targets.push(Target { kind: TargetKind::Input { form, name }, top, height: 1 });
}

fn render_select(ctx: &mut ViewCtx, node: &Value) {
    let form = ctx.form.clone().unwrap_or_default();
    let name = pstr(node, "name");
    let idx = ctx.targets.len();
    let focused = ctx.app.focus == Focus::Target(idx);
    let empty = Vec::new();
    let items = prop(node, "items").and_then(Value::as_array).unwrap_or(&empty);
    let options: Vec<(String, String)> = items
        .iter()
        .map(|it| {
            let value = pstr(it, "value");
            let label = {
                let l = pstr(it, "label");
                if l.is_empty() { value.clone() } else { l }
            };
            (value, label)
        })
        .collect();
    let selected = ctx.app.selects.get(&(form.clone(), name.clone())).cloned().unwrap_or_default();
    let cursor = *ctx.app.select_cursor.get(&(form.clone(), name.clone())).unwrap_or(&0);
    let top = ctx.lines.len();
    for (i, (value, label)) in options.iter().enumerate() {
        let is_sel = *value == selected;
        let is_cursor = focused && i == cursor;
        let marker = if is_sel { "(•)" } else { "( )" };
        let arrow = if is_cursor { "❯ " } else { "  " };
        let style = if is_cursor {
            Style::default().fg(Color::Cyan)
        } else if is_sel {
            Style::default().fg(Color::Green)
        } else {
            Style::default()
        };
        push_line(ctx, Line::from(Span::styled(format!("{arrow}{marker} {}. {label}", i + 1), style)));
    }
    if focused {
        push_line(ctx, Line::from(Span::styled("  click, ↑↓, or number to choose", Style::default().add_modifier(Modifier::DIM))));
    }
    let height = ctx.lines.len() - top;
    ctx.targets.push(Target { kind: TargetKind::Select { form, name, options }, top, height });
}

fn render_button(ctx: &mut ViewCtx, node: &Value) {
    let label = {
        let l = pstr(node, "label");
        if l.is_empty() { "Button".to_string() } else { l }
    };
    let message = action_message(node).unwrap_or_else(|| label.clone());
    let idx = ctx.targets.len();
    let focused = ctx.app.focus == Focus::Target(idx);
    let style = if focused {
        Style::default().fg(Color::Black).bg(Color::Cyan).add_modifier(Modifier::BOLD)
    } else {
        Style::default().fg(Color::Cyan)
    };
    let top = ctx.lines.len();
    push_line(ctx, Line::from(Span::styled(format!("  [ {label} ]"), style)));
    let form = ctx.form.clone();
    ctx.targets.push(Target { kind: TargetKind::Button { message, form }, top, height: 1 });
}

/// Extract the @ToAssistant message from a Button's evaluated action plan.
fn action_message(node: &Value) -> Option<String> {
    let steps = prop(node, "action")?.get("steps")?.as_array()?;
    for step in steps {
        if let Some(msg) = step.get("message").and_then(Value::as_str) {
            return Some(msg.to_string());
        }
    }
    None
}

// ─────────────────────────── input handling ───────────────────────────

fn send_message(app: &mut App, bridge_stdin: &mut ChildStdin, content: String) {
    if app.streaming {
        return;
    }
    let payload = serde_json::json!({ "type": "send", "content": content });
    let _ = writeln!(bridge_stdin, "{payload}");
    let _ = bridge_stdin.flush();
    app.streaming = true;
    app.scroll = 0;
    app.focus = Focus::Composer;
    app.status = "sent — streaming response…".to_string();
}

fn focusable_count(app: &App) -> usize {
    app.targets.len()
}

fn cycle_focus(app: &mut App, forward: bool) {
    let n = focusable_count(app);
    app.focus = match app.focus {
        Focus::Composer => {
            if n == 0 {
                Focus::Composer
            } else if forward {
                Focus::Target(0)
            } else {
                Focus::Target(n - 1)
            }
        }
        Focus::Target(i) => {
            if forward {
                if i + 1 >= n { Focus::Composer } else { Focus::Target(i + 1) }
            } else if i == 0 {
                Focus::Composer
            } else {
                Focus::Target(i - 1)
            }
        }
    };
}

fn activate_target(app: &mut App, idx: usize, bridge_stdin: &mut ChildStdin) {
    let Some(target) = app.targets.get(idx).cloned() else { return };
    match target.kind {
        TargetKind::FollowUp { text } => send_message(app, bridge_stdin, text),
        TargetKind::Button { message, form } => {
            let content = if let Some(form) = form {
                let mut values = serde_json::Map::new();
                for ((f, n), v) in &app.fields {
                    if *f == form {
                        values.insert(n.clone(), Value::String(v.clone()));
                    }
                }
                for ((f, n), v) in &app.selects {
                    if *f == form {
                        values.insert(n.clone(), Value::String(v.clone()));
                    }
                }
                format!("{message}\n\n[form \"{form}\" values: {}]", Value::Object(values))
            } else {
                message
            };
            send_message(app, bridge_stdin, content);
        }
        TargetKind::Input { .. } => {} // focusing handled by caller; typing edits it
        TargetKind::Select { form, name, options } => {
            let cursor = *app.select_cursor.get(&(form.clone(), name.clone())).unwrap_or(&0);
            if let Some((value, _)) = options.get(cursor) {
                app.selects.insert((form, name), value.clone());
            }
        }
    }
}

fn handle_key(app: &mut App, key: KeyEvent, bridge_stdin: &mut ChildStdin) {
    if key.modifiers.contains(KeyModifiers::CONTROL) && matches!(key.code, KeyCode::Char('c')) {
        app.should_quit = true;
        return;
    }

    match app.focus {
        Focus::Composer => match key.code {
            KeyCode::Enter => {
                let text = app.composer.trim().to_string();
                if !text.is_empty() {
                    app.composer.clear();
                    send_message(app, bridge_stdin, text);
                }
            }
            KeyCode::Backspace => {
                app.composer.pop();
            }
            KeyCode::Tab => cycle_focus(app, true),
            KeyCode::BackTab => cycle_focus(app, false),
            KeyCode::Up => app.scroll = app.scroll.saturating_sub(1),
            KeyCode::Down => app.scroll += 1,
            KeyCode::Char(c) => app.composer.push(c),
            _ => {}
        },
        Focus::Target(i) => {
            let kind = app.targets.get(i).map(|t| t.kind.clone());
            match key.code {
                KeyCode::Tab => cycle_focus(app, true),
                KeyCode::BackTab => cycle_focus(app, false),
                KeyCode::Enter => activate_target(app, i, bridge_stdin),
                KeyCode::Backspace => {
                    if let Some(TargetKind::Input { form, name }) = kind {
                        if let Some(v) = app.fields.get_mut(&(form, name)) {
                            v.pop();
                        }
                    }
                }
                KeyCode::Up => {
                    if let Some(TargetKind::Select { form, name, .. }) = kind {
                        let e = app.select_cursor.entry((form, name)).or_insert(0);
                        *e = e.saturating_sub(1);
                    } else {
                        cycle_focus(app, false);
                    }
                }
                KeyCode::Down => {
                    if let Some(TargetKind::Select { form, name, options }) = kind {
                        let e = app.select_cursor.entry((form, name)).or_insert(0);
                        if *e + 1 < options.len() {
                            *e += 1;
                        }
                    } else {
                        cycle_focus(app, true);
                    }
                }
                KeyCode::Char(c) => match kind {
                    Some(TargetKind::Input { form, name }) => {
                        app.fields.entry((form, name)).or_default().push(c);
                    }
                    Some(TargetKind::Select { form, name, options }) => {
                        if let Some(d) = c.to_digit(10) {
                            let n = d as usize;
                            if n >= 1 && n <= options.len() {
                                app.select_cursor.insert((form.clone(), name.clone()), n - 1);
                                app.selects.insert((form, name), options[n - 1].0.clone());
                            }
                        }
                    }
                    _ => {}
                },
                _ => {}
            }
        }
    }
}

fn handle_mouse(app: &mut App, m: MouseEvent, bridge_stdin: &mut ChildStdin) {
    match m.kind {
        MouseEventKind::ScrollDown => app.scroll += 1,
        MouseEventKind::ScrollUp => app.scroll = app.scroll.saturating_sub(1),
        MouseEventKind::Down(MouseButton::Left) => {
            let (col, row) = (m.column, m.row);
            let ca = app.content_area;
            // Inside content border?
            if row > ca.y && row < ca.y + ca.height.saturating_sub(1) && col > ca.x && col < ca.x + ca.width.saturating_sub(1) {
                let content_line = (row - ca.y - 1) as usize + app.scroll;
                // Find the target containing this line.
                let mut hit: Option<usize> = None;
                let mut sel_option: Option<usize> = None;
                for (ti, t) in app.targets.iter().enumerate() {
                    if content_line >= t.top && content_line < t.top + t.height {
                        hit = Some(ti);
                        if let TargetKind::Select { .. } = t.kind {
                            sel_option = Some(content_line - t.top);
                        }
                        break;
                    }
                }
                if let Some(ti) = hit {
                    app.focus = Focus::Target(ti);
                    let kind = app.targets[ti].kind.clone();
                    match kind {
                        TargetKind::Button { .. } | TargetKind::FollowUp { .. } => {
                            activate_target(app, ti, bridge_stdin)
                        }
                        TargetKind::Select { form, name, options } => {
                            if let Some(oi) = sel_option {
                                if oi < options.len() {
                                    app.select_cursor.insert((form.clone(), name.clone()), oi);
                                    app.selects.insert((form, name), options[oi].0.clone());
                                }
                            }
                        }
                        TargetKind::Input { .. } => {}
                    }
                }
            } else {
                // Clicking outside the content (e.g., composer) focuses the composer.
                app.focus = Focus::Composer;
            }
        }
        _ => {}
    }
}
