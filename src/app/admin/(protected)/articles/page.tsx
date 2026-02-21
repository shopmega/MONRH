"use client";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/content/home-content";
import { renderArticleContentBlocks } from "@/lib/articles/content-render";

type ArticleInput = {
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  readingTime: string;
  isActive: boolean;
  access: "public" | "logged";
  thumbnailUrl: string;
  coverImageUrl: string;
  contentText: string;
};

function formatContentText(content: string[]): string {
  return content.join("\n\n");
}

function parseContentBlocks(contentText: string): string[] {
  return contentText
    .split(/\r?\n\s*\r?\n/g)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

function toInput(article?: Article): ArticleInput {
  if (!article) {
    return {
      slug: "",
      title: "",
      excerpt: "",
      categorySlug: "general",
      readingTime: "5 min",
      isActive: true,
      access: "public",
      thumbnailUrl: "",
      coverImageUrl: "",
      contentText: "",
    };
  }
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    categorySlug: article.categorySlug,
    readingTime: article.readingTime,
    isActive: article.isActive ?? true,
    access: article.access ?? "public",
    thumbnailUrl: article.thumbnailUrl ?? "",
    coverImageUrl: article.coverImageUrl ?? "",
    contentText: formatContentText(article.content),
  };
}

export default function AdminArticlesPage() {
  const [categories, setCategories] = useState<Array<{ slug: string; count: number }>>([]);
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [form, setForm] = useState<ArticleInput>(toInput());
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>();
  const [mediaStatus, setMediaStatus] = useState<string>();
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [categoryActionStatus, setCategoryActionStatus] = useState<string>();
  const [mergingCategory, setMergingCategory] = useState(false);
  const [fromCategorySlug, setFromCategorySlug] = useState("");
  const [toCategorySlug, setToCategorySlug] = useState("");
  const categoryOptions = Array.from(new Set(items.map((item) => item.categorySlug))).sort();
  const contentBlocksPreview = parseContentBlocks(form.contentText);

  async function loadArticles() {
    const articlesResponse = await fetch("/api/admin/articles");
    const data = (await articlesResponse.json()) as { ok: boolean; items?: Article[] };
    if (data.ok && data.items) setItems(data.items);
  }

  async function loadCategories() {
    const response = await fetch("/api/admin/categories");
    const data = (await response.json()) as {
      ok: boolean;
      items?: Array<{ slug: string; count: number }>;
    };
    if (data.ok && data.items) setCategories(data.items);
  }

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      await Promise.all([loadArticles(), loadCategories()]);
      if (active) setLoading(false);
    }
    initialLoad();
    return () => {
      active = false;
    };
  }, []);

  async function saveArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(undefined);
    const response = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug || undefined,
        title: form.title,
        excerpt: form.excerpt,
        categorySlug: form.categorySlug,
        readingTime: form.readingTime,
        isActive: form.isActive,
        access: form.access,
        thumbnailUrl: form.thumbnailUrl,
        coverImageUrl: form.coverImageUrl,
        content: form.contentText
          ? parseContentBlocks(form.contentText)
          : [],
      }),
    });
    const data = (await response.json()) as { ok: boolean };
    if (data.ok) {
      setStatus("Article enregistre.");
      setForm(toInput());
      await Promise.all([loadArticles(), loadCategories()]);
    } else {
      setStatus("Echec enregistrement.");
    }
    setSaving(false);
  }

  async function deleteArticle(slug: string) {
    const response = await fetch("/api/admin/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = (await response.json()) as { ok: boolean };
    if (data.ok) {
      setStatus("Article supprime.");
      await Promise.all([loadArticles(), loadCategories()]);
    } else {
      setStatus("Suppression impossible.");
    }
  }

  async function importArticles() {
    setImporting(true);
    setImportStatus(undefined);
    try {
      const parsed = JSON.parse(importJson) as unknown;
      const items = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null && "items" in parsed
          ? (parsed as { items: unknown }).items
          : null;

      if (!Array.isArray(items)) {
        setImportStatus("JSON invalide: fournissez un tableau d'articles ou { items: [...] }.");
        setImporting(false);
        return;
      }

      const response = await fetch("/api/admin/articles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        total?: number;
        imported?: number;
        failed?: number;
        errors?: Array<{ index: number; title?: string; error: string }>;
        error?: string;
      };

      if (!data.ok) {
        setImportStatus(`Echec import: ${data.error ?? "unknown_error"}`);
        setImporting(false);
        return;
      }

      const firstError = data.errors?.[0];
      setImportStatus(
        `Import termine: ${data.imported ?? 0}/${data.total ?? 0} article(s) importes.` +
          ((data.failed ?? 0) > 0
            ? ` ${data.failed} echec(s). Premier: index ${firstError?.index ?? "?"}${firstError?.title ? ` (${firstError.title})` : ""} - ${firstError?.error ?? "unknown_error"}.`
            : ""),
      );
      await Promise.all([loadArticles(), loadCategories()]);
    } catch {
      setImportStatus("JSON invalide: impossible de parser le contenu.");
    }
    setImporting(false);
  }

  async function mergeCategories() {
    setMergingCategory(true);
    setCategoryActionStatus(undefined);
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromSlug: fromCategorySlug,
        toSlug: toCategorySlug,
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      updated?: number;
      error?: string;
    };
    if (data.ok) {
      setCategoryActionStatus(`Categories fusionnees: ${data.updated ?? 0} article(s) deplaces.`);
      setFromCategorySlug("");
      setToCategorySlug("");
      await Promise.all([loadArticles(), loadCategories()]);
    } else {
      setCategoryActionStatus(`Echec fusion categories: ${data.error ?? "unknown_error"}`);
    }
    setMergingCategory(false);
  }

  async function uploadArticleMedia(kind: "thumbnail" | "cover", file: File | null | undefined) {
    if (!file) return;
    setMediaStatus(undefined);
    if (kind === "thumbnail") setUploadingThumbnail(true);
    if (kind === "cover") setUploadingCover(true);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      body.append("slug", form.slug || form.title || "article");

      const response = await fetch("/api/admin/articles/media-upload", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as {
        ok: boolean;
        publicUrl?: string;
        error?: string;
      };

      if (!data.ok || !data.publicUrl) {
        setMediaStatus(`Upload echoue: ${data.error ?? "unknown_error"}`);
      } else {
        setForm((current) =>
          kind === "thumbnail"
            ? { ...current, thumbnailUrl: data.publicUrl ?? current.thumbnailUrl }
            : { ...current, coverImageUrl: data.publicUrl ?? current.coverImageUrl },
        );
        setMediaStatus(
          kind === "thumbnail"
            ? "Thumbnail telecharge vers le bucket article-media."
            : "Cover image telechargee vers le bucket article-media.",
        );
      }
    } catch {
      setMediaStatus("Upload echoue: erreur reseau.");
    } finally {
      if (kind === "thumbnail") setUploadingThumbnail(false);
      if (kind === "cover") setUploadingCover(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="soft-card rounded-3xl p-5">
        <p className="section-kicker">Content</p>
        <h2 className="display-font mt-1 text-3xl font-semibold">Articles Management</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Creez et modifiez les articles affiches sur le site.
        </p>
      </section>

      <form onSubmit={saveArticle} className="soft-card rounded-3xl p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Slug (vide = auto)
            <input className="input-shell mt-1" value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">
            Reading Time
            <input className="input-shell mt-1" value={form.readingTime} onChange={(e) => setForm((c) => ({ ...c, readingTime: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">
            Audience
            <select
              className="input-shell mt-1"
              value={form.access}
              onChange={(e) => setForm((c) => ({ ...c, access: e.target.value as "public" | "logged" }))}
            >
              <option value="public">Public</option>
              <option value="logged">Logged only</option>
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))}
            />
            Active
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Title
            <input className="input-shell mt-1" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} required />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Excerpt
            <input className="input-shell mt-1" value={form.excerpt} onChange={(e) => setForm((c) => ({ ...c, excerpt: e.target.value }))} required />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Thumbnail URL (cartes/lists)
            <input className="input-shell mt-1" value={form.thumbnailUrl} onChange={(e) => setForm((c) => ({ ...c, thumbnailUrl: e.target.value }))} placeholder="https://..." />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="input-shell mt-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                uploadArticleMedia("thumbnail", file).catch(() => {});
              }}
            />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Upload direct vers le bucket Supabase <code>article-media</code>.
            </p>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Cover Image URL (optionnel)
            <input className="input-shell mt-1" value={form.coverImageUrl} onChange={(e) => setForm((c) => ({ ...c, coverImageUrl: e.target.value }))} placeholder="https://..." />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="input-shell mt-2"
              onChange={(event) => {
                const file = event.target.files?.[0];
                uploadArticleMedia("cover", file).catch(() => {});
              }}
            />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Fichiers limites a 5 MB. URL publique injectee automatiquement.
            </p>
          </label>
          <label className="text-sm font-semibold">
            Category Slug
            <input
              className="input-shell mt-1"
              value={form.categorySlug}
              list="article-category-options"
              onChange={(e) => setForm((c) => ({ ...c, categorySlug: e.target.value }))}
            />
            <datalist id="article-category-options">
              {categoryOptions.map((slug) => (
                <option key={slug} value={slug} />
              ))}
            </datalist>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Content (one paragraph per block, separate blocks with an empty line)
            <textarea className="input-shell mt-1 min-h-48" value={form.contentText} onChange={(e) => setForm((c) => ({ ...c, contentText: e.target.value }))} required />
          </label>
        </div>
        <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Apercu du rendu article
          </p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            {contentBlocksPreview.length} paragraphe(s). Le rendu public utilise ce meme flux continu.
          </p>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
            {renderArticleContentBlocks(contentBlocksPreview, "admin-article-preview")}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button type="button" className="btn-muted px-4 py-2 text-sm" onClick={() => setForm(toInput())}>
            Nouveau
          </button>
        </div>
        {status ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{status}</p> : null}
        {mediaStatus ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{mediaStatus}</p> : null}
        {uploadingThumbnail || uploadingCover ? (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Upload media en cours...</p>
        ) : null}
      </form>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Articles publies</h3>
        {loading ? <p className="mt-3 text-sm text-[var(--ink-soft)]">Chargement...</p> : null}
        <div className="mt-3 space-y-2">
          {items.map((article) => (
            <article key={article.slug} className="panel-strong rounded-xl p-3">
              <p className="font-semibold">{article.title}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {article.slug} | {article.categorySlug} | {article.lastUpdated}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                {(article.isActive ?? true) ? "active" : "inactive"} | {article.access ?? "public"}
              </p>
              {article.thumbnailUrl ? <p className="mt-1 truncate text-xs text-[var(--ink-soft)]">thumb: {article.thumbnailUrl}</p> : null}
              {article.coverImageUrl ? <p className="mt-1 truncate text-xs text-[var(--ink-soft)]">cover: {article.coverImageUrl}</p> : null}
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-muted px-3 py-1.5 text-xs" onClick={() => setForm(toInput(article))}>
                  Modifier
                </button>
                <button type="button" className="btn-muted px-3 py-1.5 text-xs" onClick={() => deleteArticle(article.slug)}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Import JSON</h3>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Collez un tableau JSON d'articles (ou <code>{"{ items: [...] }"}</code>) puis lancez l'import.
        </p>
        <div className="mt-3">
          <label className="text-sm font-semibold">
            Charger un fichier .json
            <input
              type="file"
              accept="application/json,.json"
              className="input-shell mt-1"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                setImportJson(text);
                setImportStatus(undefined);
              }}
            />
          </label>
        </div>
        <textarea
          className="input-shell mt-3 min-h-48"
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
          placeholder='[{"title":"...","excerpt":"...","categorySlug":"...","readingTime":"5 min","content":["..."]}]'
        />
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-muted)] p-3 text-xs text-[var(--ink-soft)]">
{`{
  "items": [
    {
      "slug": "optionnel-slug",
      "title": "Titre",
      "excerpt": "Resume",
      "categorySlug": "salaire",
      "readingTime": "5 min",
      "isActive": true,
      "access": "public",
      "thumbnailUrl": "https://...",
      "coverImageUrl": "https://...",
      "content": ["Paragraphe 1", "Paragraphe 2"]
    }
  ]
}`}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            onClick={importArticles}
            disabled={importing}
          >
            {importing ? "Import..." : "Importer JSON"}
          </button>
          <button
            type="button"
            className="btn-muted px-4 py-2 text-sm"
            onClick={() => setImportJson("")}
          >
            Vider
          </button>
        </div>
        {importStatus ? <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{importStatus}</p> : null}
      </section>

      <section className="soft-card rounded-3xl p-5">
        <h3 className="display-font text-2xl font-semibold">Gestion des categories</h3>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Les categories sont basees sur <code>categorySlug</code>. Vous pouvez renommer/fusionner une categorie vers une autre.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category.slug}
              className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)]"
            >
              {category.slug} ({category.count})
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Categorie source
            <input
              className="input-shell mt-1"
              list="category-slug-options"
              value={fromCategorySlug}
              onChange={(event) => setFromCategorySlug(event.target.value)}
            />
          </label>
          <label className="text-sm font-semibold">
            Categorie cible
            <input
              className="input-shell mt-1"
              list="category-slug-options"
              value={toCategorySlug}
              onChange={(event) => setToCategorySlug(event.target.value)}
            />
          </label>
          <datalist id="category-slug-options">
            {categories.map((category) => (
              <option key={category.slug} value={category.slug} />
            ))}
          </datalist>
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            onClick={mergeCategories}
            disabled={mergingCategory || !fromCategorySlug.trim() || !toCategorySlug.trim()}
          >
            {mergingCategory ? "Fusion..." : "Fusionner / Renommer"}
          </button>
        </div>
        {categoryActionStatus ? (
          <p className="status-info mt-3 rounded-xl px-3 py-2 text-sm">{categoryActionStatus}</p>
        ) : null}
      </section>
    </div>
  );
}
