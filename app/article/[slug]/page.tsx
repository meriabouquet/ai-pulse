import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Header } from "@/components/news/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    return {
      title: "Article not found"
    };
  }

  const description = article.summary.replace(/\n/g, " ").slice(0, 160);
  const canonical = absoluteUrl(`/article/${article.slug}`);

  return {
    title: article.title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      url: canonical,
      siteName: "AI Pulse"
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description
    }
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug }
  });

  if (!article) {
    notFound();
  }

  const relatedArticles = await prisma.article.findMany({
    where: {
      id: { not: article.id },
      OR: [
        { tags: { hasSome: article.tags } },
        { source: article.source },
        ...(article.category ? [{ category: article.category }] : [])
      ]
    },
    orderBy: [{ importance: "desc" }, { publishedAt: "desc" }],
    take: 5
  });

  const canonical = absoluteUrl(`/article/${article.slug}`);
  const summaryLines = article.summary.split("\n").filter(Boolean);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary.replace(/\n/g, " "),
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    url: canonical,
    mainEntityOfPage: canonical,
    isBasedOn: article.canonicalUrl ?? article.url,
    publisher: {
      "@type": "Organization",
      name: "AI Pulse",
      url: absoluteUrl("/")
    },
    author: {
      "@type": "Organization",
      name: article.source
    },
    keywords: article.tags.join(", "),
    articleSection: article.category ?? "AI News"
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AI Pulse",
        item: absoluteUrl("/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.source,
        item: absoluteUrl(`/?source=${encodeURIComponent(article.source)}`)
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: canonical
      }
    ]
  };

  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-12">
        <article className="min-w-0">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(breadcrumbSchema)
            }}
          />

          <nav
            aria-label="パンくず"
            className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          >
            <Link className="hover:text-foreground" href="/">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              className="hover:text-foreground"
              href={{ pathname: "/", query: { source: article.source } }}
            >
              {article.source}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="line-clamp-1 text-foreground">{article.title}</span>
          </nav>

          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={{ pathname: "/", query: { source: article.source } }}
              className="rounded-lg border border-border/70 bg-background px-2.5 py-1 font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
            >
              {article.source}
            </Link>
            <time dateTime={article.publishedAt.toISOString()}>
              {format(article.publishedAt, "yyyy年M月d日 HH:mm", { locale: ja })}
            </time>
            <Badge className="rounded-lg" variant="outline">
              重要度 {article.importance}
            </Badge>
            {article.category ? (
              <Link href={{ pathname: "/", query: { category: article.category } }}>
                <Badge className="rounded-lg" variant="muted">
                  {article.category}
                </Badge>
              </Link>
            ) : null}
          </div>

          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
            {article.title}
          </h1>

          <section className="mt-7 rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm dark:bg-card/45 sm:p-6">
            <h2 className="text-sm font-semibold">3行要約</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {summaryLines.map((line, index) => (
                <li className="flex gap-3" key={`${article.id}-${index}`}>
                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-5 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link key={tag} href={{ pathname: "/", query: { tag } }}>
                <Badge
                  className="rounded-lg px-2.5 py-1 transition-colors hover:bg-accent"
                  variant="secondary"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-lg">
              <a href={article.url} rel="canonical noreferrer" target="_blank">
                元記事を読む
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild className="rounded-lg" variant="outline">
              <Link href={{ pathname: "/", query: { source: article.source } }}>
                {article.source} の記事を見る
              </Link>
            </Button>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm dark:bg-card/40">
            <h2 className="text-sm font-semibold">関連記事</h2>
            <div className="mt-4 space-y-3">
              {relatedArticles.map((related) => (
                <Link
                  className="block rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-accent"
                  href={`/article/${related.slug}`}
                  key={related.id}
                >
                  <p className="line-clamp-2 text-sm font-medium leading-5">
                    {related.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {related.source}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
