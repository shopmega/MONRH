import { NextResponse } from "next/server";
import { canAccessArticle, getArticleBySlugFromStore } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const userAuthenticated = await isUserAuthenticated();
  const article = await getArticleBySlugFromStore(slug);

  if (!article || !canAccessArticle(article, userAuthenticated)) {
    return NextResponse.json(
      { ok: false, message: "Article not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    item: article,
  });
}
