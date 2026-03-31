import { getLinkTargets, type LinkSourceType } from "@/lib/linking/link-map";
import { canAccessArticle, listArticles } from "@/lib/server/articles-store";
import { listDocumentTemplates } from "@/lib/server/document-templates-store";
import { TOOL_CATALOG } from "@/lib/tools/tool-catalog";

export type RelatedLinkItem = {
  title: string;
  description: string;
  href: string;
};

export async function resolveRelatedItems(input: {
  sourceType: LinkSourceType;
  sourceId: string;
  userAuthenticated?: boolean;
}): Promise<RelatedLinkItem[]> {
  const targets = await getLinkTargets(input.sourceType, input.sourceId);
  const [articles, documentTemplates] = await Promise.all([listArticles(), listDocumentTemplates()]);
  const userAuthenticated = Boolean(input.userAuthenticated);
  const articleBySlug = Object.fromEntries(articles.map((item) => [item.slug, item]));
  const toolById = Object.fromEntries(TOOL_CATALOG.map((tool) => [tool.id, tool]));
  const documentById = Object.fromEntries(documentTemplates.map((doc) => [doc.id, doc]));

  const relatedArticles: RelatedLinkItem[] = targets.articleSlugs
    .map((slug) => articleBySlug[slug])
    .filter(
      (article): article is NonNullable<typeof article> =>
        Boolean(article) && canAccessArticle(article, userAuthenticated),
    )
    .map((article) => ({
      title: article.title,
      description: article.excerpt,
      href: article.href,
    }));

  const relatedTools: RelatedLinkItem[] = targets.toolIds
    .map((id) => toolById[id])
    .filter(Boolean)
    .map((tool) => ({
      title: tool.label,
      description:
        tool.kind === "simulator"
          ? "Outil de simulation lie a ce sujet."
          : "Outil de protection lie a ce sujet.",
      href: tool.href,
    }));

  const relatedDocs: RelatedLinkItem[] = targets.documentIds
    .map((id) => documentById[id])
    .filter(Boolean)
    .map((doc) => ({
      title: doc.title,
      description: doc.description,
      href: doc.href,
    }));

  return [...relatedArticles, ...relatedTools, ...relatedDocs].slice(0, 6);
}
