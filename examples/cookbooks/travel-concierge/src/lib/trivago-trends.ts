import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod/v4";

// trivago-destination-price-trends forecasts nightly hotel prices month by month, which answers
// "when is it cheapest to go". Like the accommodation search, it needs no API key, and only the
// structured numbers are kept: the result's formatting instructions never reach the model.
const serverUrl = new URL("https://mcp.trivago.com/mcp");

const trendsSchema = z.object({
  destinations: z
    .array(
      z.object({
        name: z.string(),
        monthly_prices: z
          .array(
            z.object({
              month: z.string(),
              star_rating_prices: z
                .array(
                  z.object({
                    star_rating: z.number(),
                    average_price: z.string().nullish(),
                    minimum_price: z.string().nullish(),
                    maximum_price: z.string().nullish(),
                  }),
                )
                .nullish(),
            }),
          )
          .nullish(),
      }),
    )
    .nullish(),
  error: z.string().nullish(),
});

export type MonthPrice = { month: string; average: number; low: number; high: number };
export type PriceTrend = { destination: string; currency: string; stars: number; months: MonthPrice[] };

const amount = (price?: string | null) => Number(price?.replace(/[^\d.]/g, "")) || 0;

export async function priceTrends(
  args: { destination: string; currency: string; start_month: string; end_month: string; stars: number },
  signal?: AbortSignal,
): Promise<PriceTrend> {
  const client = new Client({ name: "openui-booking-assistant", version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(serverUrl), { signal });
  try {
    const result = await client.callTool(
      {
        name: "trivago-destination-price-trends",
        arguments: {
          query: args.destination,
          currency: args.currency,
          start_month: args.start_month,
          end_month: args.end_month,
          hotel_rating: { [`${args.stars}star`]: true },
        },
      },
      undefined,
      { signal, timeout: 45_000 },
    );
    const parsed = trendsSchema.parse(result.structuredContent ?? {});
    if (result.isError || parsed.error) throw new Error(parsed.error ?? "trivago trends failed.");
    const destination = parsed.destinations?.[0];
    if (!destination) throw new Error(`trivago has no price forecast for ${args.destination}.`);
    return {
      destination: destination.name,
      currency: args.currency,
      stars: args.stars,
      months: (destination.monthly_prices ?? []).flatMap((month) => {
        const row =
          month.star_rating_prices?.find((price) => price.star_rating === args.stars) ??
          month.star_rating_prices?.[0];
        return row
          ? [
              {
                month: month.month,
                average: amount(row.average_price),
                low: amount(row.minimum_price),
                high: amount(row.maximum_price),
              },
            ]
          : [];
      }),
    };
  } finally {
    await client.close();
  }
}
