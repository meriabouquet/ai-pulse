import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FilterBarProps = {
  filters: {
    sources: { name: string }[];
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

export function FilterBar({ filters, activeFilters }: FilterBarProps) {
  const hasFilters =
    activeFilters.source ||
    activeFilters.category ||
    activeFilters.tag ||
    activeFilters.q;

  return (
    <div className="space-y-4 border-b border-border/70 pb-5">
      <div className="flex flex-wrap items-center gap-2">
        <FilterLink
          label="最新順"
          params={withPersistedFilters(activeFilters, { sort: "latest" })}
          active={!activeFilters.sort || activeFilters.sort === "latest"}
        />
        <FilterLink
          label="人気順"
          params={withPersistedFilters(activeFilters, { sort: "popular" })}
          active={activeFilters.sort === "popular"}
        />
        {hasFilters ? (
          <Button asChild className="rounded-lg" size="sm" variant="outline">
            <Link href="/">リセット</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {filters.sources.map((source) => (
          <FilterLink
            key={source.name}
            label={source.name}
            params={withPersistedFilters(activeFilters, { source: source.name })}
            active={activeFilters.source === source.name}
          />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {filters.categories.map((category) => (
          <FilterLink
            key={category}
            label={category}
            params={withPersistedFilters(activeFilters, { category })}
            active={activeFilters.category === category}
          />
        ))}
        {filters.tags.slice(0, 18).map((tag) => (
          <Link
            key={tag}
            href={{
              pathname: "/",
              query: withPersistedFilters(activeFilters, { tag })
            }}
          >
            <Badge
              className="rounded-lg px-2.5 py-1 transition-colors hover:border-foreground/20 hover:bg-accent"
              variant={activeFilters.tag === tag ? "default" : "muted"}
            >
              {tag}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterLink({
  label,
  params,
  active
}: {
  label: string;
  params: Record<string, string>;
  active: boolean;
}) {
  return (
    <Button
      asChild
      className="rounded-lg"
      size="sm"
      variant={active ? "default" : "outline"}
    >
      <Link href={{ pathname: "/", query: params }}>{label}</Link>
    </Button>
  );
}

function withPersistedFilters(
  activeFilters: FilterBarProps["activeFilters"],
  next: Record<string, string>
) {
  return {
    ...(activeFilters.q ? { q: activeFilters.q } : {}),
    ...(activeFilters.sort ? { sort: activeFilters.sort } : {}),
    ...(activeFilters.source ? { source: activeFilters.source } : {}),
    ...(activeFilters.category ? { category: activeFilters.category } : {}),
    ...(activeFilters.tag ? { tag: activeFilters.tag } : {}),
    ...next
  };
}
