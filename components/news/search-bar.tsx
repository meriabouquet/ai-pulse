"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type SearchBarProps = {
  activeFilters: {
    source?: string;
    category?: string;
    tag?: string;
    q?: string;
    sort?: "latest" | "popular";
  };
};

export function SearchBar({ activeFilters }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(activeFilters.q ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(activeFilters.q ?? "");
  }, [activeFilters.q]);

  const syncQuery = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = value.trim();

    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false
      });
    });
  }, [pathname, router, searchParams, startTransition]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      syncQuery(query);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, syncQuery]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        syncQuery(query);
      }}
      className="mb-4 flex flex-col gap-2 rounded-xl border bg-card/80 p-2 shadow-sm backdrop-blur transition-colors focus-within:border-foreground/20 dark:bg-card/50 sm:flex-row sm:items-center"
    >
      <div className="flex min-h-11 flex-1 items-center gap-3 px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="ニュース検索"
          name="q"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ニュース、企業、タグを検索"
          type="search"
          value={query}
        />
      </div>
      <Button className="h-10 rounded-lg sm:w-24" type="submit">
        {isPending ? "検索中" : "検索"}
      </Button>
    </form>
  );
}
