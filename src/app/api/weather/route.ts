import { NextResponse } from "next/server";

const CITIES = [
  { name: "Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867 },
];

// WMO Weather interpretation codes -> emoji + condition
function weatherCodeToInfo(code: number): { emoji: string; condition: string } {
  if (code === 0) return { emoji: "☀️", condition: "Clear" };
  if (code === 1) return { emoji: "🌤️", condition: "Mostly Clear" };
  if (code === 2) return { emoji: "⛅", condition: "Partly Cloudy" };
  if (code === 3) return { emoji: "☁️", condition: "Overcast" };
  if (code === 45 || code === 48) return { emoji: "🌫️", condition: "Fog" };
  if (code === 51 || code === 53 || code === 55) return { emoji: "🌦️", condition: "Drizzle" };
  if (code === 56 || code === 57) return { emoji: "🌧️", condition: "Freezing Drizzle" };
  if (code === 61 || code === 63 || code === 65) return { emoji: "🌧️", condition: "Rain" };
  if (code === 66 || code === 67) return { emoji: "🌧️", condition: "Freezing Rain" };
  if (code === 71 || code === 73 || code === 75) return { emoji: "🌨️", condition: "Snow" };
  if (code === 77) return { emoji: "🌨️", condition: "Snow Grains" };
  if (code === 80 || code === 81 || code === 82) return { emoji: "🌧️", condition: "Showers" };
  if (code === 85 || code === 86) return { emoji: "🌨️", condition: "Snow Showers" };
  if (code === 95) return { emoji: "⛈️", condition: "Thunderstorm" };
  if (code === 96 || code === 99) return { emoji: "⛈️", condition: "Thunderstorm + Hail" };
  return { emoji: "🌡️", condition: "Unknown" };
}

let cachedData: { cities: unknown[]; fetchedAt: number } | null = null;
const CACHE_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  // Return cached data if still fresh
  if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_MS) {
    return NextResponse.json(
      { cities: cachedData.cities },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
    );
  }

  try {
    const results = await Promise.all(
      CITIES.map(async (city) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FKolkata`;
        const res = await fetch(url, { next: { revalidate: 1800 } });
        if (!res.ok) throw new Error(`Failed for ${city.name}`);
        const data = await res.json();
        const current = data.current;
        const { emoji, condition } = weatherCodeToInfo(current.weather_code);
        return {
          name: city.name,
          temp: Math.round(current.temperature_2m),
          condition,
          emoji,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
        };
      })
    );

    cachedData = { cities: results, fetchedAt: Date.now() };
    return NextResponse.json(
      { cities: results },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
    );
  } catch (err) {
    console.error("Weather API error:", err);
    // Return stale cache if available
    if (cachedData) {
      return NextResponse.json(
        { cities: cachedData.cities },
        { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
      );
    }
    return NextResponse.json({ cities: [] }, { status: 500 });
  }
}
