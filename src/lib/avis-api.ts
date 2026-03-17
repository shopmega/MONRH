/**
 * Server-only client for the AVis (Reviewly) API.
 * Use from API routes or server components; do not import in client components.
 *
 * Suggested companies (names entered in document generator when no match was selected)
 * are stored in suggested_companies. Use listSuggestedCompanies() to export them and
 * add new businesses to Reviewly (e.g. via a create/suggest endpoint when available).
 */

export type AVisBusiness = {
  id: string;
  name: string;
  location: string | null;
  category: string | null;
  logo_url: string | null;
  city: string | null;
  overall_rating: number | null;
  description: string | null;
  is_claimed: boolean;
};

export type AVisSearchOptions = {
  limit?: number;
  page?: number;
  city?: string;
  category?: string;
};

export type AVisSearchResult = {
  results: AVisBusiness[];
  query: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: { category: string | null; city: string | null };
  meta?: { responseTime?: string };
};

export async function searchCompanies(
  q: string,
  options: AVisSearchOptions = {},
): Promise<AVisSearchResult> {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiUrl) {
    throw new Error("AVIS_API_URL is not configured");
  }

  const trimmed = q.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return {
      results: [],
      query: trimmed,
      pagination: { page: 1, limit: options.limit ?? 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      filters: { category: options.category ?? null, city: options.city ?? null },
    };
  }

  const params = new URLSearchParams();
  params.set("q", trimmed);
  if (options.limit != null) params.set("limit", String(Math.min(50, Math.max(1, options.limit))));
  if (options.page != null) params.set("page", String(Math.max(1, options.page)));
  if (options.city) params.set("city", options.city);
  if (options.category) params.set("category", options.category);

  const url = `${apiUrl}/api/businesses/search?${params.toString()}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`AVis API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as AVisSearchResult;
  return data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export function getAvisSiteUrl(): string {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  return process.env.NEXT_PUBLIC_AVIS_SITE_URL?.replace(/\/$/, "") || apiUrl || "https://reviewly-ma.vercel.app";
}
