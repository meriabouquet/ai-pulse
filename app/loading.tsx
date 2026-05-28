import { Header } from "@/components/news/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-7 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-end">
          <div className="space-y-4">
            <Skeleton className="h-3 w-40 rounded-full" />
            <Skeleton className="h-12 w-full max-w-2xl rounded-xl" />
            <Skeleton className="h-5 w-full max-w-xl rounded-xl" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="mb-4 h-16 w-full rounded-xl" />
        <div className="mb-5 space-y-3 border-b border-border/70 pb-5">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-28 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </main>
  );
}
