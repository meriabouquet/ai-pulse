import { Suspense } from "react";
import { Header } from "@/components/news/header";
import { NewsDashboard } from "@/components/news/news-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getArticles, getFilterOptions } from "@/lib/articles";

type PageProps = {
  searchParams: Promise<{
    source?: string;
    category?: string;
    tag?: string;
    q?: string;
    sort?: "latest" | "popular";
  }>;
};

export const revalidate = 300;
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const [articles, filters] = await Promise.all([
    getArticles({
      source: params.source,
      category: params.category,
      tag: params.tag,
      query: params.q,
      sort: params.sort
    }),
    getFilterOptions()
  ]);

  return (
    <main className="min-h-screen">
      <Header />
      <Suspense fallback={<DashboardSkeleton />}>
        <NewsDashboard
          articles={articles}
          filters={filters}
          activeFilters={params}
        />
      </Suspense>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-5 h-12 w-full" />
      <Skeleton className="mt-5 h-36 w-full" />
    </section>
  );
}
