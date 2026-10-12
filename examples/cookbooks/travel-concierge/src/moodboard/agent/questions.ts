// The questions the trip agent can put to the traveller. Each ask_* tool pauses the agent: the
// route streams the question to the page, the page shows it on the canvas, and the traveller's
// answer goes back as that tool call's result. Shared by the route (tool schemas) and the page
// (question cards), so both agree on the shapes.

export type Option = { label: string; detail?: string; photo?: string };

export type Question =
  | { type: "dates"; question: string; nights?: number | null; month_hint?: string | null }
  | { type: "destination"; question: string; suggestions: Option[] }
  | { type: "guests"; question: string; adults: number; children: number; rooms: number }
  | { type: "choice"; question: string; options: Option[]; multiple: boolean }
  | { type: "text"; question: string; placeholder?: string | null }
  | { type: "canvas"; question: string; hint?: string | null };

export type Ask = { id: string; question: Question };

// One event per line of the agent route's response.
export type AgentEvent =
  | { type: "text"; segment: number; delta: string }
  | { type: "status"; label: string }
  | { type: "ask"; ask: Ask }
  | { type: "state"; messages: unknown[] }
  | { type: "error"; message: string };

const option = {
  type: "object",
  properties: {
    label: { type: "string", description: "Short name shown on the tile." },
    detail: { type: ["string", "null"], description: "One short line under the label, or null." },
    photo: {
      type: ["string", "null"],
      description:
        "An exact English Wikipedia article title to illustrate the option ('Alfama', 'Pastel de nata'), or null for a text-only option.",
    },
  },
  required: ["label", "detail", "photo"],
  additionalProperties: false,
};

const tool = (name: string, description: string, properties: Record<string, unknown>) => ({
  type: "function" as const,
  function: {
    name,
    description,
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question, short and friendly." },
        ...properties,
      },
      required: ["question", ...Object.keys(properties)],
      additionalProperties: false,
    },
    strict: true,
  },
});

export const askTools = [
  tool(
    "ask_dates",
    "Ask when the traveller is going. Shows an Airbnb-style two-month calendar where they pick check-in and check-out, or say they're flexible. Answer: exact dates, or a flexible length and month.",
    {
      nights: { type: ["integer", "null"], description: "A suggested trip length, or null." },
      month_hint: {
        type: ["string", "null"],
        description: "YYYY-MM to open the calendar on, such as the season they mentioned, or null.",
      },
    },
  ),
  tool(
    "ask_destination",
    "Ask where the traveller wants to go, or which area to stay in. Shows a search field with live place suggestions and photo tiles of your suggestions.",
    { suggestions: { type: "array", items: option, description: "3-6 places to suggest." } },
  ),
  tool(
    "ask_guests",
    "Ask who is travelling: adults, children, and rooms, with Airbnb-style steppers prefilled with your best guess.",
    {
      adults: { type: "integer", minimum: 1, maximum: 16 },
      children: { type: "integer", minimum: 0, maximum: 8 },
      rooms: { type: "integer", minimum: 1, maximum: 8 },
    },
  ),
  tool(
    "ask_choice",
    "Ask the traveller to pick from options, such as a trip style, budget, or one of two directions. Options with photos show as photo tiles.",
    {
      options: { type: "array", items: option, description: "2-6 options." },
      multiple: { type: "boolean", description: "True to let them pick more than one." },
    },
  ),
  tool("ask_text", "Ask an open question the traveller answers in their own words.", {
    placeholder: { type: ["string", "null"], description: "Example answer, or null." },
  }),
  tool(
    "ask_canvas",
    "Ask the traveller to answer by selecting pieces on the board, such as which places, dishes, or stays they love. Their answer is the pieces they select. Only use it when a board is on the canvas.",
    { hint: { type: ["string", "null"], description: "What to select, in a few words, or null." } },
  ),
];

const types: Record<string, Question["type"]> = {
  ask_dates: "dates",
  ask_destination: "destination",
  ask_guests: "guests",
  ask_choice: "choice",
  ask_text: "text",
  ask_canvas: "canvas",
};

export const isAskTool = (name: string) => name in types;

// The model's arguments, shaped into a question. Defaults cover anything it left out.
export function toQuestion(name: string, args: Record<string, unknown>): Question {
  const question = String(args.question ?? "Tell me more?").slice(0, 200);
  const options = (value: unknown) =>
    (Array.isArray(value) ? value : []).slice(0, 6).map((item) => ({
      label: String(item?.label ?? ""),
      detail: item?.detail ? String(item.detail) : undefined,
      photo: item?.photo ? String(item.photo) : undefined,
    }));
  const count = (value: unknown, min: number, fallback: number) =>
    Number.isInteger(value) ? Math.max(min, Number(value)) : fallback;
  switch (types[name]) {
    case "dates":
      return {
        type: "dates",
        question,
        nights: Number.isInteger(args.nights) ? Number(args.nights) : null,
        month_hint: typeof args.month_hint === "string" ? args.month_hint : null,
      };
    case "destination":
      return { type: "destination", question, suggestions: options(args.suggestions) };
    case "guests":
      return {
        type: "guests",
        question,
        adults: count(args.adults, 1, 2),
        children: count(args.children, 0, 0),
        rooms: count(args.rooms, 1, 1),
      };
    case "choice":
      return {
        type: "choice",
        question,
        options: options(args.options),
        multiple: !!args.multiple,
      };
    case "canvas":
      return { type: "canvas", question, hint: (args.hint as string) ?? null };
    default:
      return { type: "text", question, placeholder: (args.placeholder as string) ?? null };
  }
}
