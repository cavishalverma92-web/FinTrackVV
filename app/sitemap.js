import { getIntelligenceSnapshot } from "./api/intelligence/route";
import { slugify } from "./lib/content";

export default async function sitemap() {
  const baseUrl = "https://fin-track-vv.vercel.app";
  const intelligence = await getIntelligenceSnapshot();
  const articles = (intelligence.newsItems || []).map((item) => ({
    url: `${baseUrl}/article/${item.slug}`,
    lastModified: item.publishedAt || intelligence.updatedAt || new Date().toISOString(),
    changeFrequency: "hourly",
    priority: 0.7,
  }));
  const entities = [...new Set((intelligence.newsItems || []).flatMap((item) => item.entities || []))].map((name) => ({
    url: `${baseUrl}/entity/${slugify(name)}`,
    lastModified: intelligence.updatedAt || new Date().toISOString(),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: intelligence.updatedAt || new Date().toISOString(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${baseUrl}/penalties`,
      lastModified: intelligence.updatedAt || new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...articles,
    ...entities,
  ];
}
