import type { PostCategory } from "./types";

export interface RSSSource {
  name: string;
  url: string;
  category: PostCategory;
}

export const RSS_SOURCES: RSSSource[] = [
  // India / Bharat Pulse
  { name: "NDTV India", url: "https://feeds.feedburner.com/ndtvnews-india-news", category: "India" },
  { name: "The Hindu India", url: "https://www.thehindu.com/news/national/feeder/default.rss", category: "India" },
  { name: "Hindustan Times India", url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", category: "India" },

  // World / Globe Drop
  { name: "Reuters World", url: "https://feeds.reuters.com/reuters/INtopNews", category: "World" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "World" },
  { name: "The Hindu World", url: "https://www.thehindu.com/news/international/feeder/default.rss", category: "World" },

  // Politics / Neta Watch
  { name: "NDTV Politics", url: "https://feeds.feedburner.com/ndtvnews-india-news", category: "Politics" },
  { name: "Hindustan Times Politics", url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", category: "Politics" },
  { name: "The Hindu Politics", url: "https://www.thehindu.com/news/national/feeder/default.rss", category: "Politics" },

  // Geopolitics / Power Moves
  { name: "The Diplomat", url: "https://thediplomat.com/feed/", category: "Geopolitics" },
  { name: "Foreign Policy", url: "https://foreignpolicy.com/feed/", category: "Geopolitics" },
  { name: "Al Jazeera Asia", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "Geopolitics" },

  // IR
  { name: "The Diplomat IR", url: "https://thediplomat.com/feed/", category: "IR" },
  { name: "Foreign Policy IR", url: "https://foreignpolicy.com/feed/", category: "IR" },

  // Economy / Paisa Talk
  { name: "Livemint Economy", url: "https://www.livemint.com/rss/economy", category: "Economy" },
  { name: "Economic Times", url: "https://economictimes.indiatimes.com/rssfeedstopstories.cms", category: "Economy" },
  { name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews", category: "Economy" },

  // Markets
  { name: "Livemint Markets", url: "https://www.livemint.com/rss/markets", category: "Markets" },
  { name: "Economic Times Markets", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", category: "Markets" },

  // Sports / Game On
  { name: "ESPN India", url: "https://www.espn.com/espn/rss/news", category: "Sports" },
  { name: "NDTV Sports", url: "https://feeds.feedburner.com/ndtvsports-latest", category: "Sports" },
  { name: "Hindustan Times Sports", url: "https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml", category: "Sports" },

  // Tech / Tech Bro
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Tech" },
  { name: "YourStory", url: "https://yourstory.com/feed", category: "Tech" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "Tech" },

  // Defence / Shield & Sword
  { name: "Defence News", url: "https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml", category: "Defence" },
  { name: "NDTV India Defence", url: "https://feeds.feedburner.com/ndtvnews-india-news", category: "Defence" },
  { name: "The Hindu Defence", url: "https://www.thehindu.com/news/national/feeder/default.rss", category: "Defence" },

  // Opinion / Hot Takes
  { name: "The Hindu Opinion", url: "https://www.thehindu.com/opinion/feeder/default.rss", category: "Opinion" },
  { name: "Hindustan Times Opinion", url: "https://www.hindustantimes.com/feeds/rss/opinion/rssfeed.xml", category: "Opinion" },
  { name: "Scroll.in", url: "https://scroll.in/feed", category: "Opinion" },

  // Cities / City Vibes
  { name: "NDTV Delhi", url: "https://feeds.feedburner.com/ndtvnews-india-news", category: "Cities" },
  { name: "Hindustan Times Cities", url: "https://www.hindustantimes.com/feeds/rss/cities/rssfeed.xml", category: "Cities" },
  { name: "The Hindu Cities", url: "https://www.thehindu.com/news/cities/feeder/default.rss", category: "Cities" },

  // West Asia
  { name: "Al Jazeera Middle East", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "West Asia" },
  { name: "Reuters Middle East", url: "https://feeds.reuters.com/reuters/INtopNews", category: "West Asia" },
];

export function getSourcesByCategory(category: PostCategory): RSSSource[] {
  return RSS_SOURCES.filter((s) => s.category === category);
}
