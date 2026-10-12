import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall as ToolCall,
} from "openai/resources/chat/completions";
import { executeSearchStays, searchStaysTool, today } from "../../../lib/tools/search-stays";

// The journal's agent loop, shared by the entry and the detail sheet. It streams the program as
// plain text and, between completions, can search trivago (the same search_stays tool the
// moodboard uses, imported from lib). The model only places hotels by id, as Hotel("hotel1");
// the route appends trivago's own data for those ids after the program as one
// `]]>trivago:{…}` line, which the page reads and strips. Names, prices and booking links
// therefore always come from trivago, never from the model.

type Stay = {
  id: string;
  name: string;
  stars: number | null;
  guest_rating: string | null;
  reviews: string | null;
  price_per_night: string;
  total: string;
  amenities: string | null;
  location: string | null;
  photo: string | null;
  booking_site: string | null;
  url: string;
};

/** trivago's hotels as the app sees them, keyed by the id the model places (hotel1, hotel2…). */
export const hotelData = (stays: Stay[], first: number) =>
  Object.fromEntries(
    stays.map((s, i) => [
      `hotel${first + i}`,
      {
        name: s.name,
        price: s.price_per_night,
        total: s.total,
        rating: s.guest_rating ?? undefined,
        reviews: s.reviews ?? undefined,
        location: s.location ?? undefined,
        photo: s.photo ?? undefined,
        url: s.url,
        site: s.booking_site ?? undefined,
        stars: s.stars ?? undefined,
        amenities: s.amenities ?? undefined,
      },
    ]),
  );

/** The data line the route appends after the program; the page reads it and strips it. */
export const trivagoLine = (hotels: Record<string, unknown>) => `\n]]>trivago:${JSON.stringify(hotels)}\n`;

/** How to use search_stays; `when` says when this agent should search. */
export const staysRules = (date: string, when: string) => [
  `Today is ${date}. You can call search_stays to look up real hotels with live prices from trivago. ${when}`,
  "Unless the traveller said otherwise, search two adults in one room for two nights starting 30 days from today, in the destination's currency, sorted 'recommended', with no other filters.",
  "When you search, call search_stays before writing anything: write no program until its result is back.",
  "The tool's result gives each hotel an id (hotel1, hotel2…). Place a hotel as Hotel(\"hotel1\"), for example Stays(\"Where to sleep\", [Hotel(\"hotel1\"), Hotel(\"hotel4\"), Hotel(\"hotel2\")]). The app fills in its name, photo, price and booking link from trivago, so never write those, and never invent hotels. If the search fails or finds nothing, leave hotels out.",
];

export function streamAgent({
  request,
  system,
  messages,
  maxTokens = 6000,
}: {
  request: Request;
  system: string;
  messages: ChatCompletionMessageParam[];
  maxTokens?: number;
}) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) return Response.json({ error: "Set THESYS_API_KEY in .env.local." }, { status: 500 });
  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  const signal = request.signal;
  const encoder = new TextEncoder();
  const convo: ChatCompletionMessageParam[] = [{ role: "system", content: system }, ...messages];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => controller.enqueue(encoder.encode(text));
      const hotels: Record<string, unknown> = {};
      let count = 0;
      try {
        for (let step = 0; step < 3; step++) {
          const completion = await gateway.chat.completions.create(
            {
              model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
              messages: convo,
              tools: step < 2 ? [searchStaysTool()] : undefined,
              max_completion_tokens: maxTokens,
              stream: true,
            },
            { signal },
          );
          let content = "";
          const calls: ToolCall[] = [];
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              content += delta.content;
              write(delta.content);
            }
            for (const part of delta?.tool_calls ?? []) {
              const call = (calls[part.index] ??= { id: "", type: "function", function: { name: "", arguments: "" } });
              if (part.id) call.id = part.id;
              if (part.function?.name) call.function.name += part.function.name;
              if (part.function?.arguments) call.function.arguments += part.function.arguments;
            }
          }
          convo.push({ role: "assistant", content: content || null, ...(calls.length ? { tool_calls: calls } : {}) });
          if (!calls.length) break;
          for (const call of calls) convo.push({ role: "tool", tool_call_id: call.id, content: await run(call) });
        }
      } catch (error) {
        if (!signal.aborted) console.error("Journal agent failed.", error);
      } finally {
        if (!signal.aborted && Object.keys(hotels).length) write(trivagoLine(hotels));
        controller.close();
      }

      async function run(call: ToolCall) {
        if (call.function.name !== "search_stays") return JSON.stringify({ error: `Unknown tool ${call.function.name}.` });
        try {
          const result = JSON.parse(await executeSearchStays(call.function.arguments, { signal })) as {
            stays: Stay[];
            [key: string]: unknown;
          };
          const first = count + 1;
          count += result.stays.length;
          Object.assign(hotels, hotelData(result.stays, first));
          // The model hears what was found and what to call each hotel, not the photos or links.
          return JSON.stringify({
            ...result,
            stays: result.stays.map((s, i) => ({
              id: `hotel${first + i}`,
              name: s.name,
              stars: s.stars,
              guest_rating: s.guest_rating,
              price_per_night: s.price_per_night,
              location: s.location,
            })),
          });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
        }
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}

export { today };

/** A live search with the journal's defaults (two adults, two nights a month out), for samples. */
export async function sampleStays(destination: string, currency = "EUR", signal?: AbortSignal) {
  const start = new Date(Date.now() + 30 * 86_400_000);
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA").format(d);
  const args = {
    destination,
    check_in: day(start),
    check_out: day(new Date(start.getTime() + 2 * 86_400_000)),
    adults: 2,
    children_ages: [],
    rooms: 1,
    currency,
    max_price_per_night: null,
    stars: [],
    min_guest_rating: "any",
    amenities: [],
    sort: "recommended",
  };
  const result = JSON.parse(await executeSearchStays(JSON.stringify(args), { signal })) as { stays: Stay[] };
  return trivagoLine(hotelData(result.stays.slice(0, 4), 1));
}
