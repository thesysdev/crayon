import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG, COMPONENT_GROUPS, ROOT } from "./catalog.ts";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const core = require(join(HERE, "../../../../packages/lang-core/dist/index.cjs"));

// Prompt inputs: changing any of these changes the prompt the models see and
// invalidates every raw generated against it.
const RULES = [
  "The root children list is a COMPLETE commitment: every component you define MUST be reachable from root's children, directly or through a listed parent. A defined-but-unreferenced statement renders NOTHING and its content is silently missing from the final screen. Before writing root, enumerate every section you plan to emit; after writing everything, verify every defined variable is reachable from root. The most common mistake is defining a section heading, series or button and never listing it in any children or reference list; every name you define must appear in at least one.",
  'All component arguments are positional, in the exact order shown in each signature. Never write named arguments: no \`name: value\` and no \`name=value\` inside any component call. To reach a later optional argument, pass the earlier optionals too, using null to skip. WRONG: \`Card([a, b], direction: "row", gap: "l")\`. RIGHT: \`Card([a, b], "card", "row", "l")\`. Enum-typed arguments accept ONLY the listed values, exactly as written; never invent variants that are not in the signature.',
  "Enum lists are closed: a value that is not printed in the signature does not exist, even if other UI libraries use it. Before writing an enum value, check it appears in the signature; if the value you want is missing, use the closest listed value or omit the optional argument.",
];

const EXAMPLES = [
  `root = Card([header, status, alert, revenueSection, actions])
header = CardHeader("Revenue Overview", "Last 30 days")
status = Tag("On track", null, null, "success")
alert = Alert("Refund spike", "Refunds rose 14% week over week", "warning")
revenueSection = Card([revenueHeading, kpis, trend], "sunk")
revenueHeading = Heading("Weekly revenue", "h3")
kpis = Table([kpiName, kpiValue])
kpiName = Col("Metric", ["Revenue", "Orders", "Refunds"])
kpiValue = Col("Value", ["$128,400", "1,982", "$3,120"])
trend = LineChart(["W1", "W2", "W3", "W4"], [revSeries], "natural", "Week", "USD")
revSeries = Series("Revenue", [24100, 30800, 34600, 38900])
actions = Buttons([exportBtn, shareBtn])
exportBtn = Button("Export CSV")
shareBtn = Button("Share report", null, "secondary")`,
  `root = Card([intro, form])
intro = CardHeader("Book a demo", "Tell us about your team")
form = Form("demo-request", formButtons, [nameField, emailField, sizeField, planField])
nameField = FormControl("Full name", nameInput)
nameInput = Input("name", "Jane Smith")
emailField = FormControl("Work email", emailInput, "We only use this to reply")
emailInput = Input("email", "jane@company.com", "email")
sizeField = FormControl("Team size", sizeSelect)
sizeSelect = Select("team_size", [sizeS, sizeM, sizeL], "Choose a range")
sizeS = SelectItem("1-10", "1-10 people")
sizeM = SelectItem("11-50", "11-50 people")
sizeL = SelectItem("51+", "51+ people")
planField = FormControl("Interested plan", planRadio)
planRadio = RadioGroup("plan", [planCloud, planSelf])
planCloud = RadioItem("Cloud", "Managed by us", "cloud")
planSelf = RadioItem("Self-hosted", "Runs in your infra", "self")
formButtons = Buttons([submitBtn, cancelBtn])
submitBtn = Button("Request demo", null, "primary")
cancelBtn = Button("Cancel", null, "tertiary")`,
];

function typeString(s: { t: string; enum?: string[]; allowed?: string[] }) {
  if (s.enum) return s.enum.map((e) => (typeof e === "string" ? `"${e}"` : e)).join(" | ");
  if (s.t === "refs") return s.allowed?.length ? `(${s.allowed.join(" | ")})[]` : "Component[]";
  if (s.t === "ref") return s.allowed?.length ? s.allowed.join(" | ") : "Component";
  if (s.t === "array") return s.allowed?.length ? `(${s.allowed.join(" | ")})[]` : "(string | number)[]";
  return s.t;
}

function componentSpecs() {
  const components: Record<string, { signature: string; description: string }> = {};
  for (const [name, c] of Object.entries(CATALOG)) {
    const args = c.props
      .map(([pn, s]) => `${pn}${s.req ? "" : "?"}: ${typeString(s)}`)
      .join(", ");
    components[name] = { signature: `${name}(${args})`, description: c.desc };
  }
  return components;
}

// generatePrompt hardcodes a Stack call as the positional-args example; this catalog
// has no Stack, and the example alone induces Stack calls. No-op once the template
// derives its example from the catalog.
function fixStackExample(p: string) {
  return p
    .replace('`Stack([children], "row", "l")`', '`Card([children], "card", "row", "l")`')
    .replace('`Stack([children], direction: "row", gap: "l")`', '`Card([children], direction: "row", gap: "l")`');
}

export function systemPrompt(): string {
  return fixStackExample(
    core.generatePrompt({
      root: ROOT,
      components: componentSpecs(),
      componentGroups: COMPONENT_GROUPS,
      additionalRules: RULES,
      examples: EXAMPLES,
    }),
  );
}
