"use client";

import { useEffect, useState } from "react";

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

export default function StockTicker() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch("/api/market-data");
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        if (mounted && json.data) {
          setItems(json.data);
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Don't render anything while loading or on error
  if (items.length === 0 && !error) {
    return (
      <div className="bg-[#111] h-[34px] flex items-center justify-center">
        <div className="flex gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && items.length === 0) return null;

  const formatPrice = (price: number, symbol: string) => {
    if (symbol === "INR=X") return `₹${price.toFixed(2)}`;
    if (symbol === "GC=F" || symbol === "CL=F") return `$${price.toFixed(2)}`;
    return price.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-[#111] border-b border-gray-800 overflow-hidden h-[34px] flex items-center relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#111] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#111] to-transparent z-10 pointer-events-none" />

      {/* Scrolling content — duplicate for seamless loop */}
      <div className="flex whitespace-nowrap animate-stock-ticker">
        {[...items, ...items].map((item, i) => (
          <div
            key={`${item.symbol}-${i}`}
            className="inline-flex items-center gap-1.5 mx-5 text-[11px] font-inter"
          >
            <span className="text-gray-400 font-semibold uppercase tracking-wide">
              {item.name}
            </span>
            <span className="text-white font-bold">
              {formatPrice(item.price, item.symbol)}
            </span>
            <span
              className={`font-semibold ${
                item.isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {item.isPositive ? "▲" : "▼"}{" "}
              {Math.abs(item.change).toFixed(2)} ({Math.abs(item.changePercent).toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
