import { defineTool } from "eve/tools";
import { z } from "zod";

/**
 * A tiny, dependency-free tool so the demo exercises the full tool-call path:
 * the model emits a tool call, Eve runs `execute`, and OpenUI renders the call
 * (name + arguments) in its "behind the scenes" panel. The runtime tool name is
 * the filename slug, `get_current_time`.
 */
export default defineTool({
  description:
    "Get the current date and time, optionally for a specific IANA timezone " +
    "(e.g. 'America/New_York', 'Asia/Tokyo'). Use this whenever the user asks " +
    "what the current time or date is.",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe("IANA timezone name such as 'Asia/Kolkata'. Defaults to UTC."),
  }),
  outputSchema: z.object({
    iso: z.string(),
    formatted: z.string(),
    timezone: z.string(),
  }),
  execute({ timezone }) {
    const now = new Date();
    let tz = timezone?.trim() || "UTC";
    let formatted: string;
    try {
      formatted = new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: tz,
      }).format(now);
    } catch {
      // Unknown timezone: fall back to UTC rather than failing the turn.
      tz = "UTC";
      formatted = new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: tz,
      }).format(now);
    }
    return { iso: now.toISOString(), formatted, timezone: tz };
  },
});
