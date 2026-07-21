/**
 * Example function tool: current weather via Open-Meteo (free, no API key).
 *
 * This is the reference for adding your own tools — declare the tool to the
 * model (`getWeatherTool`) and execute it on your server (`executeGetWeather`),
 * wired together through `runFunctionToolLoop` in the chat route.
 */

/** OpenAI Responses `type: "function"` declaration sent to the model. */
export const getWeatherTool = {
  type: "function" as const,
  name: "get_weather",
  description:
    "Get the current weather and a short daily forecast for a city or place name. " +
    "Use whenever the user asks about weather, temperature, rain, or what to wear.",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City or place name, e.g. 'Berlin' or 'San Francisco'.",
      },
    },
    required: ["location"],
    additionalProperties: false,
  },
  strict: false,
};

// https://open-meteo.com/en/docs — WMO weather interpretation codes.
const WEATHER_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "violent rain showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with heavy hail",
};

export async function executeGetWeather(
  argsJson: string,
  ctx: { signal?: AbortSignal } = {},
): Promise<string> {
  let location: string;
  try {
    const args = JSON.parse(argsJson || "{}") as { location?: unknown };
    if (typeof args.location !== "string" || !args.location.trim()) {
      return JSON.stringify({ error: "location is required" });
    }
    location = args.location.trim();
  } catch {
    return JSON.stringify({ error: "invalid JSON arguments" });
  }

  try {
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.searchParams.set("name", location);
    geoUrl.searchParams.set("count", "1");
    const geo = (await (await fetch(geoUrl, { signal: ctx.signal })).json()) as {
      results?: Array<{ name: string; country?: string; latitude: number; longitude: number }>;
    };
    const place = geo.results?.[0];
    if (!place) return JSON.stringify({ error: `No place found for "${location}"` });

    const wxUrl = new URL("https://api.open-meteo.com/v1/forecast");
    wxUrl.searchParams.set("latitude", String(place.latitude));
    wxUrl.searchParams.set("longitude", String(place.longitude));
    wxUrl.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    );
    wxUrl.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    );
    wxUrl.searchParams.set("forecast_days", "3");
    wxUrl.searchParams.set("timezone", "auto");
    const wx = (await (await fetch(wxUrl, { signal: ctx.signal })).json()) as {
      current?: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        weather_code: number;
        wind_speed_10m: number;
      };
      daily?: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
      };
    };

    return JSON.stringify({
      place: `${place.name}${place.country ? `, ${place.country}` : ""}`,
      current: wx.current && {
        temperature_c: wx.current.temperature_2m,
        feels_like_c: wx.current.apparent_temperature,
        humidity_pct: wx.current.relative_humidity_2m,
        wind_kmh: wx.current.wind_speed_10m,
        conditions: WEATHER_CODES[wx.current.weather_code] ?? "unknown",
      },
      daily: wx.daily?.time.map((date, i) => ({
        date,
        high_c: wx.daily!.temperature_2m_max[i],
        low_c: wx.daily!.temperature_2m_min[i],
        precipitation_probability_pct: wx.daily!.precipitation_probability_max[i],
      })),
    });
  } catch (err) {
    return JSON.stringify({
      error: `Weather lookup failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
