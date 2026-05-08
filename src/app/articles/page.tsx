import { LibraryPageClient } from "@/components/library-page-client";
import { readAdminConfig } from "@/lib/server/admin-config";
import { canAccessArticle, listArticles } from "@/lib/server/articles-store";
import { isUserAuthenticated } from "@/lib/server/user-session";

export default async function ArticlesPage() {
  const [articles, config, userAuthenticated] = await Promise.all([
    listArticles(),
    readAdminConfig(),
    isUserAuthenticated(),
  ]);
  const visibleArticles = articles.filter((item) => canAccessArticle(item, userAuthenticated));
  const defaultCover = config.websiteSettings.defaultArticleCoverUrl.trim();
  const hydrated = visibleArticles.map((item) => ({
    ...item,
    thumbnailUrl: item.thumbnailUrl || item.coverImageUrl || defaultCover || undefined,
    coverImageUrl: item.coverImageUrl || item.thumbnailUrl || defaultCover || undefined,
  }));
  return <LibraryPageClient initialArticles={hydrated} />;
}
