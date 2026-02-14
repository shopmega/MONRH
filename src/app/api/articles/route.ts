import { NextRequest, NextResponse } from "next/server";
import { canAccessArticle, listArticles } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const userAuthenticated = await isUserAuthenticated();
  const allArticles = await listArticles();
  const visibleArticles = allArticles.filter((article) => canAccessArticle(article, userAuthenticated));
  const items = category
    ? visibleArticles.filter((article) => article.categorySlug === category)
    : visibleArticles;

  return NextResponse.json({
    ok: true,
    count: items.length,
    items,
  });
}
