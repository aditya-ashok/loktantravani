/**
 * GET /api/market-data
 * Returns live Indian stock market data from Yahoo Finance.
 * Falls back to mock data if Yahoo Finance is unreachable.
 */

import { NextResponse } from "next/server";

export const maxDuration = 15;

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

const SYMBOLS = [
  { symbol: "^BSESN", name: "Sensex" },
  { symbol: "^NSEI", name: "Nifty 50" },
  { symbol: "^NSEBANK", name: "Bank Nifty" },
  { symbol: "INR=X", name: "USD/INR" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "CL=F", name: "Crude Oil" },
];

async function fetchYahoo(symbol: string): Promise<MarketItem | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LoktantraVani/1.0)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    const entry = SYMBOLS.find((s) => s.symbol === symbol);
    return {
      symbol,
      name: entry?.name ?? symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      isPositive: change >= 0,
    };
  } catch {
    return null;
  }
}

function getMockData(): MarketItem[] {
  return [
    { symbol: "^BSESN", name: "Sensex", price: 82134.56, change: 312.45, changePercent: 0.38, isPositive: true },
    { symbol: "^NSEI", name: "Nifty 50", price: 24892.3, change: -87.15, changePercent: -0.35, isPositive: false },
    { symbol: "^NSEBANK", name: "Bank Nifty", price: 51423.8, change: 156.2, changePercent: 0.3, isPositive: true },
    { symbol: "INR=X", name: "USD/INR", price: 86.42, change: 0.12, changePercent: 0.14, isPositive: true },
    { symbol: "GC=F", name: "Gold", price: 2645.3, change: -8.7, changePercent: -0.33, isPositive: false },
    { symbol: "CL=F", name: "Crude Oil", price: 78.92, change: 1.34, changePercent: 1.73, isPositive: true },
  ];
}

export async function GET() {
  try {
    const results = await Promise.all(SYMBOLS.map((s) => fetchYahoo(s.symbol)));
    const data = results.filter((r): r is MarketItem => r !== null);

    // If we got at least half the symbols, return live data; otherwise fallback
    if (data.length >= 3) {
      // Fill in any missing symbols from mock
      const mock = getMockData();
      const full = SYMBOLS.map((s) => {
        return data.find((d) => d.symbol === s.symbol) ?? mock.find((m) => m.symbol === s.symbol)!;
      });

      return NextResponse.json(
        { data: full, live: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    return NextResponse.json(
      { data: getMockData(), live: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { data: getMockData(), live: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }
}
