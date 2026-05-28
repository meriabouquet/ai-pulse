import Parser from "rss-parser";
import { stripHtml } from "./utils";

export type FeedItem = {
  title: string;
  url: string;
  publishedAt: Date;
  content: string;
};

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "AI Pulse RSS Bot/0.1 (+https://example.com)"
  }
});

export async function fetchFeed(rssUrl: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(rssUrl);

  return feed.items
    .map((item) => {
      const title = stripHtml(item.title ?? "");
      const url = item.link ?? item.guid ?? "";
      const rawDate = item.isoDate ?? item.pubDate;
      const publishedAt = rawDate ? new Date(rawDate) : new Date();
      const extendedItem = item as typeof item & {
        "content:encoded"?: string;
      };
      const content = stripHtml(
        item.contentSnippet ?? item.content ?? extendedItem["content:encoded"] ?? ""
      );

      return {
        title,
        url,
        publishedAt,
        content
      };
    })
    .filter((item) => item.title.length > 0 && item.url.length > 0);
}
