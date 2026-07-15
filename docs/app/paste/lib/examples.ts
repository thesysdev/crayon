/**
 * Built-in example programs. Most are ported from lang-harness/samples so
 * playground behavior can be compared 1:1 with the CLI harness.
 */

export interface Example {
  id: string;
  label: string;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "valid",
    label: "Valid: basic stack",
    code: `root = Stack([title, body])

title = TextContent("Quarterly Overview")
body = TextContent("Revenue up 12% QoQ; headcount at 128.")
`,
  },
  {
    id: "invalid",
    label: "Validation errors",
    code: `root = Stack([heading, Table(5, []), missingRef])

heading = TextContent("Broken example")
stray = TextContent("nobody references me")
`,
  },
  {
    id: "partial",
    label: "Truncated / incomplete",
    code: `root = Stack([title, body, chart])

title = TextContent("Live streaming demo")
body = TextContent("This program is truncated mid-statement to show partial parsing.")
chart = BarChart(["Q1", "Q2", "Q3"], [series`,
  },
  {
    id: "two-required",
    label: "Missing required props",
    code: `root = Stack([intro, CodeBlock("typescript", "const x: number = 42;"), outro])

intro = TextContent("Example:")
outro = TextContent("Done.")
`,
  },
  {
    id: "root-drop",
    label: "Streaming: root drop",
    code: `root = ImageGallery([{"src": "https://x.test/a.jpg", "alt": "ok"}, {"alt": "missing required src"}])
`,
  },
  {
    id: "nested-drop",
    label: "Streaming: nested drop",
    code: `root = Stack([heading, gallery, footer])

heading = TextContent("Team offsite photos")
gallery = ImageGallery([{"src": "https://x.test/a.jpg", "alt": "day one"}, {"alt": "missing src — drops the WHOLE gallery"}])
footer = TextContent("12 photos total")
`,
  },
  {
    id: "kitchen-sink",
    label: "Kitchen sink (form + table + chart)",
    code: `root = Stack([title, note, form, tbl, chart])

title = TextContent("paste playground", "large-heavy")
note = Callout("info", "Demo", "A form with validation, a table and a chart — rendered fully client-side.")
form = Form("contact", btns, [nameField, emailField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary")])
tbl = Table([Col("Language", langs), Col("Users (M)", users)])
langs = ["Python", "JavaScript", "Go"]
users = [15.7, 14.2, 5.2]
chart = BarChart(["Q1", "Q2", "Q3"], [Series("Revenue", [120, 150, 180])], "grouped")
`,
  },
];

export const DEFAULT_EXAMPLE = EXAMPLES[0];
