import { createHash } from "node:crypto";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type DuplicateCandidate = {
  id: string;
  importance: number;
  tags: string[];
  score: number;
  strategy: "url" | "embedding" | "title";
};

export type DedupeInput = {
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  content?: string | null;
};

export type DedupePreparedInput = {
  canonicalUrl: string;
  normalizedTitle: string;
  titleHash: string;
  embedding: number[] | null;
};

const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_EMBEDDING_THRESHOLD = 0.9;
const DEFAULT_TITLE_THRESHOLD = 0.86;
const SEARCH_WINDOW_DAYS_BEFORE = 14;
const SEARCH_WINDOW_DAYS_AFTER = 2;

const TRACKING_PARAMS = [
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term"
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "for",
  "from",
  "in",
  "into",
  "is",
  "its",
  "new",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "これ",
  "その",
  "する",
  "ため",
  "について"
]);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function prepareDedupeInput(
  input: DedupeInput
): Promise<DedupePreparedInput> {
  const canonicalUrl = canonicalizeUrl(input.url);
  const normalizedTitle = normalizeTitle(input.title);
  const titleHash = hashTitle(normalizedTitle);
  const embedding = await createTitleEmbedding(input);

  return {
    canonicalUrl,
    normalizedTitle,
    titleHash,
    embedding
  };
}

export async function findDuplicateArticle(
  input: DedupeInput,
  prepared: DedupePreparedInput
): Promise<DuplicateCandidate | null> {
  const urlDuplicate = await findUrlDuplicate(prepared.canonicalUrl, input.url);
  if (urlDuplicate) {
    return urlDuplicate;
  }

  if (prepared.embedding) {
    const embeddingDuplicate = await findEmbeddingDuplicate(
      prepared.embedding,
      input.publishedAt
    );
    if (embeddingDuplicate) {
      return embeddingDuplicate;
    }
  }

  return findTitleDuplicate(prepared.normalizedTitle, input.publishedAt);
}

export async function storeArticleEmbedding(articleId: string, embedding: number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Article" SET embedding = $1::vector WHERE id = $2`,
      vectorLiteral(embedding),
      articleId
    );
  } catch (error) {
    console.error("pgvector embedding store failed", error);
  }
}

export function canonicalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    for (const param of TRACKING_PARAMS) {
      url.searchParams.delete(param);
    }

    const sortedParams = [...url.searchParams.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    );
    url.search = "";
    for (const [key, paramValue] of sortedParams) {
      url.searchParams.append(key, paramValue);
    }

    const path = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "");
    url.pathname = path.length > 0 ? path : "/";

    return url.toString();
  } catch {
    return value.trim();
  }
}

export function normalizeTitle(title: string) {
  return decodeHtmlEntities(title)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map(normalizeCommonTypos)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .join(" ")
    .trim();
}

export function hashTitle(normalizedTitle: string) {
  return createHash("sha256").update(normalizedTitle).digest("hex").slice(0, 24);
}

export function cosineSimilarity(a: string | number[], b: string | number[]) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return numericCosineSimilarity(a, b);
  }

  const left = vectorizeText(String(a));
  const right = vectorizeText(String(b));
  const keys = [...new Set([...left.keys(), ...right.keys()])];
  return numericCosineSimilarity(
    keys.map((key) => left.get(key) ?? 0),
    keys.map((key) => right.get(key) ?? 0)
  );
}

function getEmbeddingThreshold() {
  return Number(
    process.env.DUPLICATE_EMBEDDING_THRESHOLD ??
      process.env.DUPLICATE_TITLE_THRESHOLD ??
      DEFAULT_EMBEDDING_THRESHOLD
  );
}

function getTitleThreshold() {
  return Number(process.env.DUPLICATE_TITLE_THRESHOLD ?? DEFAULT_TITLE_THRESHOLD);
}

async function createTitleEmbedding(input: DedupeInput) {
  if (!openai) {
    return null;
  }

  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: [
        input.title,
        input.source,
        normalizeTitle(input.title),
        input.content?.slice(0, 500) ?? ""
      ]
        .filter(Boolean)
        .join("\n"),
      dimensions: EMBEDDING_DIMENSIONS
    });

    return response.data[0]?.embedding ?? null;
  } catch (error) {
    console.error("OpenAI embedding failed", error);
    return null;
  }
}

async function findUrlDuplicate(canonicalUrl: string, rawUrl: string) {
  const article = await prisma.article.findFirst({
    where: {
      OR: [{ canonicalUrl }, { url: rawUrl }]
    },
    select: {
      id: true,
      importance: true,
      tags: true
    }
  });

  return article
    ? {
        ...article,
        score: 1,
        strategy: "url" as const
      }
    : null;
}

async function findEmbeddingDuplicate(embedding: number[], publishedAt: Date) {
  let rows: {
    id: string;
    importance: number;
    tags: string[];
    score: number;
  }[] = [];

  try {
    rows = await prisma.$queryRawUnsafe(
      `
        SELECT id, importance, tags, 1 - (embedding <=> $1::vector) AS score
        FROM "Article"
        WHERE embedding IS NOT NULL
          AND "publishedAt" BETWEEN $2 AND $3
        ORDER BY embedding <=> $1::vector
        LIMIT 8
      `,
      vectorLiteral(embedding),
      ...publishedAtWindow(publishedAt)
    );
  } catch (error) {
    console.error("pgvector duplicate search failed", error);
    return null;
  }

  const match = rows.find((row) => row.score >= getEmbeddingThreshold());

  return match
    ? {
        ...match,
        strategy: "embedding" as const
      }
    : null;
}

async function findTitleDuplicate(normalizedTitle: string, publishedAt: Date) {
  const candidates = await prisma.article.findMany({
    where: {
      publishedAt: {
        gte: publishedAtWindow(publishedAt)[0],
        lte: publishedAtWindow(publishedAt)[1]
      }
    },
    select: {
      id: true,
      normalizedTitle: true,
      importance: true,
      tags: true
    },
    take: 250,
    orderBy: { publishedAt: "desc" }
  });

  const threshold = getTitleThreshold();
  const match = candidates
    .map((candidate) => ({
      ...candidate,
      score: typoTolerantTitleSimilarity(
        normalizedTitle,
        candidate.normalizedTitle
      )
    }))
    .sort((a, b) => b.score - a.score)
    .find((candidate) => candidate.score >= threshold);

  return match
    ? {
        id: match.id,
        importance: match.importance,
        tags: match.tags,
        score: match.score,
        strategy: "title" as const
      }
    : null;
}

function typoTolerantTitleSimilarity(a: string, b: string) {
  const tokenScore = cosineSimilarity(a, b);
  const trigramScore = jaccard(trigrams(a), trigrams(b));
  const editScore = normalizedEditSimilarity(a, b);

  return tokenScore * 0.55 + trigramScore * 0.3 + editScore * 0.15;
}

function numericCosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const x = a[index] ?? 0;
    const y = b[index] ?? 0;
    dot += x * y;
    leftNorm += x * x;
    rightNorm += y * y;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function vectorizeText(value: string) {
  const vector = new Map<string, number>();
  for (const token of normalizeTitle(value).split(/\s+/).filter(Boolean)) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }
  return vector;
}

function trigrams(value: string) {
  const compact = `  ${value.replace(/\s+/g, " ")}  `;
  const grams = new Set<string>();

  for (let index = 0; index < compact.length - 2; index += 1) {
    grams.add(compact.slice(index, index + 3));
  }

  return grams;
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

function normalizedEditSimilarity(a: string, b: string) {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) {
    return 1;
  }

  return 1 - levenshteinDistance(a, b) / maxLength;
}

function levenshteinDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function normalizeCommonTypos(token: string) {
  return token
    .replace(/^chatgpt$/, "chatgpt")
    .replace(/^gpt[\s-]?/, "gpt")
    .replace(/^openai$/, "openai")
    .replace(/^anthropic$/, "anthropic");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'");
}

function publishedAtWindow(publishedAt: Date): [Date, Date] {
  const windowStart = new Date(publishedAt);
  windowStart.setDate(windowStart.getDate() - SEARCH_WINDOW_DAYS_BEFORE);
  const windowEnd = new Date(publishedAt);
  windowEnd.setDate(windowEnd.getDate() + SEARCH_WINDOW_DAYS_AFTER);
  return [windowStart, windowEnd];
}

function vectorLiteral(embedding: number[]) {
  return `[${embedding.map((value) => sanitizeVectorNumber(value)).join(",")}]`;
}

function sanitizeVectorNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toFixed(8);
}

export function isPgVectorMissingError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.message.includes("vector")
  );
}
