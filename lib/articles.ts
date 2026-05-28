import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type ArticleFilters = {
  source?: string;
  category?: string;
  tag?: string;
  query?: string;
  sort?: "latest" | "popular";
  limit?: number;
};

export async function getArticles(filters: ArticleFilters = {}) {
  const where: Prisma.ArticleWhereInput = {};

  if (filters.source) {
    where.source = filters.source;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.tag) {
    where.tags = { has: filters.tag };
  }

  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { summary: { contains: filters.query, mode: "insensitive" } },
      { source: { contains: filters.query, mode: "insensitive" } },
      { tags: { has: filters.query } }
    ];
  }

  return prisma.article.findMany({
    where,
    orderBy:
      filters.sort === "popular"
        ? [{ importance: "desc" }, { publishedAt: "desc" }]
        : [{ publishedAt: "desc" }],
    take: filters.limit ?? 60
  });
}

export async function getFilterOptions() {
  const [sources, articles] = await Promise.all([
    prisma.source.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    }),
    prisma.article.findMany({
      select: {
        tags: true,
        category: true
      },
      take: 500,
      orderBy: { publishedAt: "desc" }
    })
  ]);

  const tags = [...new Set(articles.flatMap((article) => article.tags))]
    .filter(Boolean)
    .sort();
  const categories = [
    ...new Set(articles.map((article) => article.category).filter(Boolean))
  ].sort() as string[];

  return { sources, tags, categories };
}
