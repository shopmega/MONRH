"use client";

import { useEffect, useState } from "react";
import type { Article } from "@/lib/content/home-content";

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
    .map((block) => block.replace(/\s+/g, " ").trim())
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
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [form, setForm] = useState<ArticleInput>(toInput());
  const categoryOptions = Array.from(new Set(items.map((item) => item.categorySlug))).sort();
  const contentBlocksPreview = parseContentBlocks(form.contentText);

  async function loadArticles() {
    const articlesResponse = await fetch("/api/admin/articles");
    const data = (await articlesResponse.json()) as { ok: boolean; items?: Article[] };
    if (data.ok && data.items) setItems(data.items);
  }

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      await loadArticles();
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
      await loadArticles();
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
      await loadArticles();
    } else {
      setStatus("Suppression impossible.");
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
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Cover Image URL (optionnel)
            <input className="input-shell mt-1" value={form.coverImageUrl} onChange={(e) => setForm((c) => ({ ...c, coverImageUrl: e.target.value }))} placeholder="https://..." />
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
            {contentBlocksPreview.map((block, index) => (
              <p key={`preview-${index}`}>{block}</p>
            ))}
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
    </div>
  );
}
