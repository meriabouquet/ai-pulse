import type { Article, Source } from "@prisma/client";
import { ArticleCard } from "./article-card";
import { EmptyState } from "./empty-state";
import { FilterBar } from "./filter-bar";
import { MotionListItem } from "./motion-list-item";
import { SearchBar } from "./search-bar";

type NewsDashboardProps = {
  articles: Article[];
  filters: {
    sources: Source[];
    categories: string[];
    tags: string[];
  };
  activeFilters: {
    source?: string;
    category?: string;
    tag?: string;
    q?: string;
    sort?: "latest" | "popular";
  };
};

export function NewsDashboard({
  articles,
  filters,
  activeFilters
}: NewsDashboardProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            RSS + AI summaries
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
            AIニュースを、日本語で素早く把握
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            OpenAI、Anthropic、Google、Hugging Faceなどの更新を収集し、
            重要な変化だけを短く読めるダッシュボードです。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-xl border bg-card/70 p-2 text-right text-sm shadow-sm backdrop-blur dark:bg-card/40">
          <Metric label="記事" value={articles.length.toString()} />
          <Metric label="ソース" value={filters.sources.length.toString()} />
          <Metric label="タグ" value={filters.tags.length.toString()} />
        </div>
      </div>

      <SearchBar activeFilters={activeFilters} />
      <FilterBar filters={filters} activeFilters={activeFilters} />

      <div className="mt-6 space-y-3 sm:space-y-4">
        {articles.length === 0 ? (
          <EmptyState />
        ) : (
          articles.map((article, index) => (
            <MotionListItem key={article.id} index={index}>
              <ArticleCard article={article} />
            </MotionListItem>
          ))
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
