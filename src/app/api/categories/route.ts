import { NextResponse } from "next/server";
import { deriveCategoriesFromArticles } from "@/lib/server/categories";
import { canAccessArticle, listArticles } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";

export async function GET() {
  const userAuthenticated = await isUserAuthenticated();
  const items = deriveCategoriesFromArticles(
    (await listArticles()).filter((article) => canAccessArticle(article, userAuthenticated)),
  );
  return NextResponse.json({
    ok: true,
    count: items.length,
    items,
  });
}
