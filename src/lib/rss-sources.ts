import type { PostCategory } from "./types";

export interface RSSSource {
  name: string;
  url: string;
  category: PostCategory;
}

export const RSS_SOURCES: RSSSource[] = [
  // Geopolitics
  { name: "Reuters India", url: "https://feeds.reuters.com/reuters/INtopNews", category: "Geopolitics" },
  { name: "Al Jazeera Asia", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "Geopolitics" },
  { name: "The Hindu World", url: "https://www.thehindu.com/news/international/feeder/default.rss", category: "Geopolitics" },

  // IR
  { name: "The Diplomat", url: "https://thediplomat.com/feed/", category: "IR" },
  { name: "Foreign Policy", url: "https://foreignpolicy.com/feed/", category: "IR" },

  // Politics
  { name: "NDTV Politics", url: "https://feeds.feedburner.com/ndtvnews-india-news", category: "Politics" },
  { name: "Hindustan Times", url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", category: "Politics" },

  // Tech
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Tech" },
  { name: "YourStory", url: "https://yourstory.com/feed", category: "Tech" },

  // GenZ
  { name: "Scroll.in", url: "https://scroll.in/feed", category: "GenZ" },
];

export function getSourcesByCategory(category: PostCategory): RSSSource[] {
  return RSS_SOURCES.filter((s) => s.category === category);
}
