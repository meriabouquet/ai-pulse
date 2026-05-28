import { NextResponse } from "next/server";
import { getArticles } from "@/lib/articles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 50);

  const articles = await getArticles({
    source: searchParams.get("source") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") === "popular" ? "popular" : "latest",
    limit: Number.isFinite(limit) ? Math.min(limit, 100) : 50
  });

  return NextResponse.json({ articles });
}
