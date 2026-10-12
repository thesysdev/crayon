// GET /api/planner/weather?lat=12.97&lon=77.59
// The planner home's weather: Open-Meteo for the conditions, BigDataCloud for the place name.
// Both are keyless. Without coordinates (location denied), BigDataCloud places the caller by IP.

export type Weather = {
  place: string;
  country: string;
  countryCode: string;
  temp: number;
  high: number;
  low: number;
  code: number;
  isDay: boolean;
};

async function json(url: string) {
  const response = await fetch(url, { next: { revalidate: 600 } });
  if (!response.ok) throw new Error(`${new URL(url).host} answered ${response.status}`);
  return response.json();
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const hasCoords = params.has("lat") && params.has("lon") && Number.isFinite(lat) && Number.isFinite(lon);
  try {
    const where = await json(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en${hasCoords ? `&latitude=${lat}&longitude=${lon}` : ""}`,
    );
    const at = hasCoords ? { lat, lon } : { lat: where.latitude, lon: where.longitude };
    const forecast = await json(
      `https://api.open-meteo.com/v1/forecast?latitude=${at.lat}&longitude=${at.lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
    );
    const weather: Weather = {
      place: where.city || where.locality || where.principalSubdivision || where.countryName || "Where you are",
      country: where.countryName ?? "",
      countryCode: where.countryCode ?? "",
      temp: Math.round(forecast.current.temperature_2m),
      high: Math.round(forecast.daily.temperature_2m_max[0]),
      low: Math.round(forecast.daily.temperature_2m_min[0]),
      code: forecast.current.weather_code,
      isDay: forecast.current.is_day === 1,
    };
    return Response.json(weather);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Weather is unavailable." }, { status: 502 });
  }
}
