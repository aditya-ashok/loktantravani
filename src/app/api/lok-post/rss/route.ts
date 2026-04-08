import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Block private/local IPs
  try {
    const u = new URL(url);
    if (
      ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(u.hostname) ||
      u.hostname.startsWith("192.168.") ||
      u.hostname.startsWith("10.")
    ) {
      return NextResponse.json({ error: "Private URLs not allowed" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Malformed URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "LoktantraVani/1.0 RSS Reader",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: `Feed returned ${response.status}` }, { status: 502 });
    }

    const xml = await response.text();

    const items: { title: string; link: string; pubDate: string; description: string; source: string; category: string }[] = [];
    const itemMatches = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
    const entryMatches = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
    const allEntries = [...itemMatches, ...entryMatches];

    const clean = (s: string) =>
      s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim();

    for (const entry of allEntries.slice(0, 20)) {
      const title = (entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
      const link =
        (entry.match(/<link[^>]*href=["']([^"']+)["']/i) ||
          entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "";
      const pubDate =
        (entry.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
          entry.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
          entry.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i) || [])[1] || "";
      const desc =
        (entry.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
          entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
          entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i) || [])[1] || "";
      const source = (entry.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || "";
      const category =
        (entry.match(/<category[^>]*>([\s\S]*?)<\/category>/i) ||
          entry.match(/<category[^>]*term=["']([^"']+)["']/i) || [])[1] || "";

      if (clean(title)) {
        items.push({
          title: clean(title),
          link: clean(link),
          pubDate: clean(pubDate),
          description: clean(desc).slice(0, 300),
          source: clean(source),
          category: clean(category),
        });
      }
    }

    const feedTitle =
      (xml.match(/<channel[\s>][\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i) ||
        xml.match(/<feed[\s>][\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";

    return NextResponse.json({
      feedTitle: clean(feedTitle),
      items,
    });
  } catch (err: unknown) {
    if ((err as Error).name === "AbortError") {
      return NextResponse.json({ error: "Feed timed out (10s)" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
