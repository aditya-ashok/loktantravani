"use client";

import { useEffect, useState } from "react";

interface CityWeather {
  name: string;
  temp: number;
  condition: string;
  emoji: string;
  humidity: number;
  windSpeed: number;
}

export default function WeatherWidget() {
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || cities.length === 0) return null;

  return (
    <div className="border-b border-[var(--nyt-border)] dark:border-neutral-800 bg-[var(--nyt-light-gray)] dark:bg-neutral-900/50">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-1 flex items-center gap-1">
        {/* Label */}
        <span className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-neutral-500 flex-shrink-0 mr-2">
          Weather
        </span>

        {/* Scrollable city row */}
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide flex-1">
          {cities.map((city) => (
            <div
              key={city.name}
              className="flex items-center gap-1.5 flex-shrink-0 font-inter"
            >
              <span className="text-sm leading-none">{city.emoji}</span>
              <span className="text-[11px] font-semibold text-[var(--nyt-black)] dark:text-neutral-200 whitespace-nowrap">
                {city.name}
              </span>
              <span className="text-[11px] font-bold text-[var(--nyt-black)] dark:text-neutral-100">
                {city.temp}°
              </span>
              <span className="text-[10px] text-[var(--nyt-gray)] dark:text-neutral-500 whitespace-nowrap">
                {city.condition}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
