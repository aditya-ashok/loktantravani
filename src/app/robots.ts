import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/author/dashboard"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
      },
      {
        userAgent: "Googlebot-News",
        allow: "/",
        disallow: ["/admin", "/api/", "/author/dashboard"],
      },
    ],
    sitemap: [
      "https://loktantravani.in/sitemap.xml",
      "https://loktantravani.in/news-sitemap.xml",
    ],
  };
}
