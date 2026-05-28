import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1
    }
  ];

  try {
    const articles = await prisma.article.findMany({
      select: {
        slug: true,
        updatedAt: true
      },
      orderBy: { publishedAt: "desc" },
      take: 5000
    });

    return [
      ...baseEntries,
      ...articles.map((article) => ({
        url: absoluteUrl(`/article/${article.slug}`),
        lastModified: article.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7
      }))
    ];
  } catch (error) {
    console.error("Failed to generate article sitemap entries", error);
    return baseEntries;
  }
}
