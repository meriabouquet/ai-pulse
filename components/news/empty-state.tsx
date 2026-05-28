import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">ニュースがまだありません</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        RSS取り込みを実行すると、AIニュースの要約がここに表示されます。
      </p>
      <Button asChild className="mt-5 rounded-lg" variant="outline">
        <Link href="/">フィルターを解除</Link>
      </Button>
    </div>
  );
}
