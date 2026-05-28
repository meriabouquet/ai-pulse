import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-3 text-3xl font-semibold">記事が見つかりません</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        URLが変更されたか、まだ取り込まれていない記事です。
      </p>
      <Button asChild className="mt-6">
        <Link href="/">ニュース一覧へ</Link>
      </Button>
    </main>
  );
}
