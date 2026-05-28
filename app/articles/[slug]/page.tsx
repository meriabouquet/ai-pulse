import { redirect } from "next/navigation";

type LegacyArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyArticlePage({
  params
}: LegacyArticlePageProps) {
  const { slug } = await params;
  redirect(`/article/${slug}`);
}
