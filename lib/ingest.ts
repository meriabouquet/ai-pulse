import { Prisma } from "@prisma/client";
import { summarizeArticle } from "./ai";
import {
  findDuplicateArticle,
  prepareDedupeInput,
  storeArticleEmbedding
} from "./dedupe";
import { prisma } from "./prisma";
import { fetchFeed } from "./rss";
import { DEFAULT_SOURCES } from "./sources";
import { slugify } from "./utils";

export type IngestResult = {
  sources: number;
  fetched: number;
  created: number;
  skippedDuplicates: number;
  failed: number;
  errors: string[];
};

const DEFAULT_LIMIT = Number(process.env.INGEST_LIMIT_PER_SOURCE ?? 12);
export async function ingestNews(): Promise<IngestResult> {
  await ensureSources();

  const sources = await prisma.source.findMany({
    where: { active: true },
    orderBy: { name: "asc" }
  });

  const result: IngestResult = {
    sources: sources.length,
    fetched: 0,
    created: 0,
    skippedDuplicates: 0,
    failed: 0,
    errors: []
  };

  for (const source of sources) {
    try {
      const items = (await fetchFeed(source.rssUrl)).slice(0, DEFAULT_LIMIT);
      result.fetched += items.length;

      for (const item of items) {
        try {
          const created = await upsertArticle({
            sourceId: source.id,
            sourceName: source.name,
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            content: item.content
          });

          if (created) {
            result.created += 1;
          } else {
            result.skippedDuplicates += 1;
          }
        } catch (error) {
          result.failed += 1;
          result.errors.push(formatError(source.name, item.title, error));
        }
      }
    } catch (error) {
      result.failed += 1;
      result.errors.push(formatError(source.name, source.rssUrl, error));
    }
  }

  return result;
}

async function ensureSources() {
  for (const source of DEFAULT_SOURCES) {
    await prisma.source.upsert({
      where: { name: source.name },
      create: source,
      update: {
        rssUrl: source.rssUrl,
        active: source.active
      }
    });
  }
}

async function upsertArticle(input: {
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  publishedAt: Date;
  content: string;
}) {
  const dedupeInput = {
    title: input.title,
    url: input.url,
    source: input.sourceName,
    publishedAt: input.publishedAt,
    content: input.content
  };
  const prepared = await prepareDedupeInput(dedupeInput);
  const duplicate = await findDuplicateArticle(dedupeInput, prepared);

  if (duplicate) {
    await prisma.article.update({
      where: { id: duplicate.id },
      data: {
        importance: Math.max(duplicate.importance, 70),
        tags: [...new Set([...duplicate.tags, input.sourceName])]
      }
    });
    return false;
  }

  const summary = await summarizeArticle({
    title: input.title,
    source: input.sourceName,
    url: input.url,
    content: input.content
  });

  const slug = await uniqueSlug(input.title);

  const article = await prisma.article.create({
    data: {
      title: input.title,
      slug,
      summary: summary.summary.join("\n"),
      url: input.url,
      canonicalUrl: prepared.canonicalUrl,
      source: input.sourceName,
      sourceId: input.sourceId,
      publishedAt: input.publishedAt,
      tags: summary.tags,
      category: summary.category,
      importance: summary.importance,
      difficulty: summary.difficulty,
      normalizedTitle: prepared.normalizedTitle,
      titleHash: prepared.titleHash
    }
  });

  if (prepared.embedding) {
    await storeArticleEmbedding(article.id, prepared.embedding);
  }

  return true;
}

async function uniqueSlug(title: string) {
  const base = slugify(title) || "article";
  let slug = base;
  let index = 2;

  while (
    await prisma.article.findUnique({
      where: { slug },
      select: { id: true }
    })
  ) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

function formatError(source: string, label: string, error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `${source}: ${label} (${error.code})`;
  }

  return `${source}: ${label} (${error instanceof Error ? error.message : String(error)})`;
}
