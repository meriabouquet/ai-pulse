import type { Article } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ArticleCard({ article }: { article: Article }) {
  const summaryLines = article.summary.split("\n").filter(Boolean);

  return (
    <article className="group rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm shadow-black/[0.015] transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-card hover:shadow-md hover:shadow-black/[0.04] dark:bg-card/45 dark:shadow-black/20 dark:hover:border-white/15 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <SourceBadge source={article.source} />
            <span className="tabular-nums">
              {formatDistanceToNow(article.publishedAt, {
                addSuffix: true,
                locale: ja
              })}
            </span>
            <Badge className="rounded-lg" variant="outline">
              <Sparkles className="mr-1 h-3 w-3" />
              {article.importance}
            </Badge>
            <Badge className="rounded-lg" variant="muted">
              {difficultyLabel(article.difficulty)}
            </Badge>
          </div>
          <Link href={`/article/${article.slug}`}>
            <h2 className="text-pretty text-lg font-semibold leading-snug tracking-normal transition-colors group-hover:text-foreground/85 sm:text-xl">
              {article.title}
            </h2>
          </Link>
          <ul className="mt-3 space-y-1.5 text-sm leading-6 text-muted-foreground">
            {summaryLines.map((line, index) => (
              <li className="flex gap-2" key={`${article.id}-${index}`}>
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link key={tag} href={{ pathname: "/", query: { tag } }}>
                <Badge
                  className="rounded-lg border-border/70 bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-accent hover:text-foreground dark:bg-muted/40"
                  variant="outline"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
        <Button
          asChild
          className="rounded-lg transition-transform group-hover:translate-x-0.5"
          size="sm"
          variant="outline"
        >
          <a href={article.url} rel="noreferrer" target="_blank">
            元記事
            <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function difficultyLabel(value: Article["difficulty"]) {
  const labels = {
    BEGINNER: "入門",
    INTERMEDIATE: "中級",
    ADVANCED: "上級"
  };

  return labels[value];
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-border/70 bg-background px-2.5 py-1 font-medium text-foreground shadow-sm dark:bg-background/60">
      {source}
    </span>
  );
}
