const baseUrl = process.env.BENCHMARK_BASE_URL ?? "http://localhost:3067";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchText = async (path) => {
  const response = await fetch(`${baseUrl}${path}`);
  assert(response.ok, `${path} returned ${response.status}`);
  return { response, text: await response.text() };
};

const { text: html } = await fetchText("/benchmarks");
assert(html.includes('"@type":"Dataset"'), "Benchmark page is missing Dataset JSON-LD");
assert(html.includes('rel="canonical"'), "Benchmark page is missing a canonical link");
assert(html.includes("/benchmarks/data.json"), "Benchmark page does not advertise JSON data");
assert(html.includes("/benchmarks/data.csv"), "Benchmark page does not advertise CSV data");
assert(
  html.includes("/benchmarks/data.schema.json"),
  "Benchmark page does not advertise its JSON Schema",
);
assert(html.includes("/benchmarks/agent.md"), "Benchmark page does not advertise agent Markdown");
assert(html.includes('role="tabpanel"'), "Chart tabs are missing a tab panel");
assert(
  html.includes('aria-controls="benchmark-model-chart-panel"') &&
    html.includes('aria-controls="benchmark-format-chart-panel"'),
  "Each chart tab is not linked to its own panel",
);
assert(html.includes("View chart data"), "Hero chart is missing its structured data disclosure");
assert(
  html.includes("Model comparison data") && html.includes("Format comparison data"),
  "Both tab datasets must be present in the server-rendered HTML",
);
assert(html.includes("View render data"), "Render chart is missing its structured data disclosure");
assert(html.includes("View token data"), "Token chart is missing its structured data disclosure");
assert(
  html.includes("View complexity data"),
  "Complexity chart is missing its structured data disclosure",
);
assert(html.includes("View repair data"), "Repair chart is missing its structured data disclosure");

const jsonResponse = await fetch(`${baseUrl}/benchmarks/data.json`);
assert(jsonResponse.ok, `data.json returned ${jsonResponse.status}`);
assert(
  jsonResponse.headers.get("content-type")?.includes("application/json"),
  "data.json has the wrong content type",
);
const data = await jsonResponse.json();
assert(data.schema_version === "1.0.0", "Unexpected benchmark schema version");
assert(data.$schema.endsWith("/benchmarks/data.schema.json"), "Dataset is missing $schema");
assert(
  data.model_board.length === 30,
  `Expected 30 model-board rows, got ${data.model_board.length}`,
);
assert(
  new Set(data.model_board.map((row) => row.model_id)).size === data.model_board.length,
  "Model-board IDs are not unique",
);
assert(
  data.model_board
    .filter((row) => row.cost_type === "self-hosted")
    .every((row) => row.cost_per_task_usd === null),
  "Self-hosted cost must be null rather than zero",
);
assert(
  data.model_board.every((row) => row.family_id && row.family_name),
  "Every model needs explicit family metadata",
);
assert(data.format_comparison.length === 18, "Expected six models × three formats");
assert(data.agent_answers.length >= 8, "Expected direct agent answers");
assert(
  data.provenance.format_comparison.evidence_status === "published",
  "Format-comparison provenance is missing",
);
assert(
  data.provenance.model_board.evidence_status === "summary-only" &&
    data.provenance.model_board.raw_results === null,
  "Model-board evidence limitations are not explicit",
);

const { response: schemaResponse, text: schemaText } = await fetchText(
  "/benchmarks/data.schema.json",
);
assert(
  schemaResponse.headers.get("content-type")?.includes("application/schema+json"),
  "JSON Schema has the wrong content type",
);
const schema = JSON.parse(schemaText);
assert(schema.$id === data.$schema, "JSON Schema $id does not match dataset $schema");

const { response: csvResponse, text: csv } = await fetchText("/benchmarks/data.csv");
assert(
  csvResponse.headers.get("content-type")?.includes("text/csv"),
  "CSV has the wrong content type",
);
assert(csv.trim().split("\n").length === 31, "CSV should contain one header and 30 model rows");

const { response: markdownResponse, text: markdown } = await fetchText("/benchmarks/agent.md");
assert(
  markdownResponse.headers.get("content-type")?.includes("text/markdown"),
  "Agent document has the wrong content type",
);
assert(markdown.includes("## OpenUI model board"), "Agent document is missing the model board");
assert(
  markdown.includes("Self-hosted cost is unknown"),
  "Agent document is missing the cost caveat",
);
assert(markdown.includes("## Direct answers"), "Agent document is missing direct answers");

console.log("Benchmark agent-readability checks passed.");
