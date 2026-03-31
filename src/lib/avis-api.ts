/**
 * Server-only client for the AVISINE company intelligence API.
 * Use from API routes or server components; do not import in client components.
 *
 * Suggested companies (names entered in document generator when no match was selected)
 * are stored in suggested_companies. Use listSuggestedCompanies() to export them and
 * add new businesses to AVISINE (e.g. via a create/suggest endpoint when available).
 */

export type AVisCompany = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  logo_url: string | null;
  city: string | null;
  overall_rating: number | null;
  description: string | null;
  is_claimed: boolean;
  entity_type: "company";
  match_confidence: "high";
};

export type AVisSearchOptions = {
  limit?: number;
  page?: number;
  city?: string;
  category?: string;
};

export type AVisSearchResult = {
  results: AVisCompany[];
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
  meta?: {
    responseTime?: string;
    contractVersion?: "companies.v1";
    source?: "businesses_adapter";
  };
};

export type AVisResolveRequest = {
  companyName: string;
  sourceUrl?: string;
  city?: string;
};

export type AVisResolveResult = {
  companyId: string | null;
  confidence: "high" | "medium" | "low" | "none";
  method: "slug" | "id" | "name" | "website" | "scored" | "none";
  normalizedCompanySlug: string;
  candidates: Array<{
    companyId: string;
    score: number;
    reason: string;
  }>;
  meta?: {
    contractVersion?: "companies.resolve.v1";
    source?: "businesses_adapter";
  };
};

export type AVisCompanyDetail = {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  location: string | null;
  category: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  overall_rating: number | null;
  review_count: number;
  is_claimed: boolean;
  entity_type: "company";
  trust_summary?: {
    overallScore: number;
    confidenceLevel: "low" | "medium" | "high";
    confidenceLabel: string;
    sourceMixLabel: string;
    whyThisResult: string;
    lastUpdatedAt: string | null;
  } | null;
};

export type AVisCompanyDetailResult = {
  company: AVisCompanyDetail | null;
  meta?: {
    contractVersion?: "companies.detail.v1";
    source?: "businesses_adapter";
    verificationSource?: "monrh_verification_bridge" | "unconfigured";
    trustSource?: "trust_scores_v1";
  };
  error?: string;
  message?: string;
};

export type AVisCompanyContextCardResult = {
  companyId: string | null;
  contextCard: {
    id: string;
    slug: string | null;
    name: string;
    city: string | null;
    category: string | null;
    overallRating: number | null;
    reviewCount: number;
    isClaimed: boolean;
    trustSummary: {
      overallScore: number;
      confidenceLevel: "low" | "medium" | "high";
      confidenceLabel: string;
      sourceMixLabel: string;
      whyThisResult: string;
      lastUpdatedAt: string | null;
    } | null;
    verificationSummary: {
      total: number;
      verified: number;
      rejected: number;
      needsMoreInfo: number;
      criticalQueueCount: number;
      evidenceArtifactCount: number;
      evidenceAvailableCount: number;
    } | null;
    salarySummary: {
      submissionCount: number;
      medianMonthlySalary: number | null;
      pctAboveCityAvg: number | null;
      pctAboveSectorAvg: number | null;
      mostReportedJobTitle: string | null;
    } | null;
    riskSummary: {
      level: "low" | "medium" | "high";
      reasons: string[];
    };
  } | null;
  meta?: {
    contractVersion?: "companies.context-card.v1";
    source?: "company_core_adapter";
    trustSource?: "trust_scores_v1";
    verificationSource?: "monrh_verification_bridge" | "unconfigured";
  };
  error?: string;
  message?: string;
};

export type AVisCompanyRiskSummaryResult = {
  companyId: string | null;
  riskSummary: {
    level: "low" | "medium" | "high";
    reasons: string[];
    trustScore: number | null;
    confidenceLevel: "low" | "medium" | "high" | null;
    verificationTotal: number;
    salarySubmissionCount: number;
    criticalQueueCount: number;
  } | null;
  meta?: {
    contractVersion?: "companies.risk-summary.v1";
    source?: "company_core_adapter";
  };
  error?: string;
  message?: string;
};

export type AVisCompanySalaryBenchmarksResult = {
  companyId: string | null;
  salaryBenchmarks: {
    submissionCount: number;
    medianMonthlySalary: number | null;
    pctAboveCityAvg: number | null;
    pctAboveSectorAvg: number | null;
    mostReportedJobTitle: string | null;
  } | null;
  meta?: {
    contractVersion?: "companies.salary-benchmarks.v1";
    source?: "company_core_adapter";
  };
  error?: string;
  message?: string;
};

export type AVisCompanyTrustResult = {
  companyId: string | null;
  trust: Record<string, unknown> | null;
  sources: Array<{
    id: "reviews" | "salaries" | "verification";
    label: string;
    count: number;
  }>;
  assumptions: string[];
  missingInformation: string[];
  signalsSummary: {
    reviewCount: number;
    salaryCount: number;
    approvedOfferCount: number;
    offerTransparencyScore: number | null;
    offerSalaryDisclosureRate: number | null;
    verificationCount: number;
    verifiedCount: number;
    rejectedCount: number;
    needsMoreInfoCount: number;
    evidenceArtifactCount: number;
    evidenceAvailableCount: number;
    verificationQueueOpenCount: number;
    verificationQueueInReviewCount: number;
    verificationQueueCriticalCount: number;
    moderationReviewTotal: number;
    moderationRejectedReviewCount: number;
    moderationFlaggedReviewCount: number;
    moderationQueueOpenCount: number;
    moderationQueueInReviewCount: number;
    moderationQueueCriticalCount: number;
    isClaimed: boolean;
  } | null;
  meta?: {
    contractVersion?: "companies.trust.v1";
    source?: "trust_scores_v1";
    scoreVersion?: "trust_v1";
    generatedAt?: string | null;
    persisted?: boolean;
    verificationSource?: "monrh_verification_bridge" | "unconfigured";
  };
  error?: string;
  message?: string;
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

  const url = `${apiUrl}/api/v1/companies/search?${params.toString()}`;
  
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

export async function resolveCompany(payload: AVisResolveRequest): Promise<AVisResolveResult> {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiUrl) {
    throw new Error("AVIS_API_URL is not configured");
  }

  const companyName = payload.companyName.trim();
  if (!companyName) {
    return {
      companyId: null,
      confidence: "none",
      method: "none",
      normalizedCompanySlug: "",
      candidates: [],
    };
  }

  const res = await fetch(`${apiUrl}/api/v1/companies/resolve`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyName,
      sourceUrl: payload.sourceUrl,
      city: payload.city,
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`AVis resolve error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AVisResolveResult;
}

export async function getCompanyById(companyId: string): Promise<AVisCompanyDetailResult> {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiUrl) {
    throw new Error("AVIS_API_URL is not configured");
  }

  const resolvedCompanyId = companyId.trim();
  if (!resolvedCompanyId) {
    return {
      company: null,
      error: "Invalid company id",
    };
  }

  const res = await fetch(`${apiUrl}/api/v1/companies/${encodeURIComponent(resolvedCompanyId)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return (await res.json()) as AVisCompanyDetailResult;
  }

  if (!res.ok) {
    throw new Error(`AVis company detail error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AVisCompanyDetailResult;
}

export async function getCompanyContextCard(companyId: string): Promise<AVisCompanyContextCardResult> {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiUrl) {
    throw new Error("AVIS_API_URL is not configured");
  }

  const resolvedCompanyId = companyId.trim();
  if (!resolvedCompanyId) {
    return {
      companyId: null,
      contextCard: null,
      error: "Invalid company id",
    };
  }

  const res = await fetch(`${apiUrl}/api/v1/companies/${encodeURIComponent(resolvedCompanyId)}/context-card`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return (await res.json()) as AVisCompanyContextCardResult;
  }

  if (!res.ok) {
    throw new Error(`AVis company context-card error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AVisCompanyContextCardResult;
}

export async function getCompanyRiskSummary(companyId: string): Promise<AVisCompanyRiskSummaryResult> {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiUrl) {
    throw new Error("AVIS_API_URL is not configured");
  }

  const resolvedCompanyId = companyId.trim();
  if (!resolvedCompanyId) {
    return {
      companyId: null,
      riskSummary: null,
      error: "Invalid company id",
    };
  }

  const res = await fetch(`${apiUrl}/api/v1/companies/${encodeURIComponent(resolvedCompanyId)}/risk-summary`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return (await res.json()) as AVisCompanyRiskSummaryResult;
  }

  if (!res.ok) {
    throw new Error(`AVis company risk-summary error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AVisCompanyRiskSummaryResult;
}

export async function getCompanySalaryBenchmarks(companyId: string): Promise<AVisCompanySalaryBenchmarksResult> {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiUrl) {
    throw new Error("AVIS_API_URL is not configured");
  }

  const resolvedCompanyId = companyId.trim();
  if (!resolvedCompanyId) {
    return {
      companyId: null,
      salaryBenchmarks: null,
      error: "Invalid company id",
    };
  }

  const res = await fetch(`${apiUrl}/api/v1/companies/${encodeURIComponent(resolvedCompanyId)}/salary-benchmarks`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return (await res.json()) as AVisCompanySalaryBenchmarksResult;
  }

  if (!res.ok) {
    throw new Error(`AVis company salary-benchmarks error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AVisCompanySalaryBenchmarksResult;
}

export async function getCompanyTrust(companyId: string): Promise<AVisCompanyTrustResult> {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiUrl) {
    throw new Error("AVIS_API_URL is not configured");
  }

  const resolvedCompanyId = companyId.trim();
  if (!resolvedCompanyId) {
    return {
      companyId: null,
      trust: null,
      sources: [],
      assumptions: [],
      missingInformation: ["Invalid company id"],
      signalsSummary: null,
      error: "Invalid company id",
    };
  }

  const res = await fetch(`${apiUrl}/api/v1/companies/${encodeURIComponent(resolvedCompanyId)}/trust`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (res.status === 404) {
    return (await res.json()) as AVisCompanyTrustResult;
  }

  if (!res.ok) {
    throw new Error(`AVis company trust error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as AVisCompanyTrustResult;
}

export function getAvisSiteUrl(): string {
  const apiUrl = process.env.AVIS_API_URL?.replace(/\/$/, "") ?? "";
  return process.env.NEXT_PUBLIC_AVIS_SITE_URL?.replace(/\/$/, "") || apiUrl || "https://avisine.com";
}
