import Link from "next/link";
import { Activity, RefreshCw, Signal } from "lucide-react";
import { refreshNews } from "@/app/actions/refresh-news";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="flex items-center gap-2" href="/">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-normal">AI Pulse</span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              AI news intelligence
            </span>
          </span>
        </Link>
        <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground shadow-sm md:flex">
          <Signal className="h-3.5 w-3.5" />
          Live RSS monitor
        </div>
        <div className="flex items-center gap-1.5">
          <form action={refreshNews}>
            <Button className="rounded-lg" size="sm" variant="ghost" title="RSSを再取得">
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              更新
            </Button>
          </form>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
