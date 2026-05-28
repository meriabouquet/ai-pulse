export const DEFAULT_SOURCES = [
  {
    name: "OpenAI",
    rssUrl: "https://openai.com/news/rss.xml",
    active: true
  },
  {
    name: "Google AI",
    rssUrl: "https://blog.google/technology/ai/rss/",
    active: true
  },
  {
    name: "Hugging Face",
    rssUrl: "https://huggingface.co/blog/feed.xml",
    active: true
  },
  {
    name: "TechCrunch AI",
    rssUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    active: true
  },
  {
    name: "The Verge AI",
    rssUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    active: true
  },
  {
    name: "Ars Technica AI",
    rssUrl: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    active: true
  },
  {
    name: "VentureBeat AI",
    rssUrl: "https://venturebeat.com/category/ai/feed/",
    active: true
  }
] as const;

export const SOURCE_NAMES = DEFAULT_SOURCES.map((source) => source.name);
