# AVis (Reviewly) API – Integration Plan for SIMULIO

This document plans how to use the **AVis-prod** (Reviewly) API from the SIMULIO app, based on the API exposed in `C:\Users\Zouhair\Downloads\AVis-prod` and the existing roadmap in `LEVERAGE_REVIEWLY.md`.

---

## 1. What the AVis API provides

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | None | Health check (app + DB). |
| `/api/businesses/search` | GET | None | Company search: `q` (2–100 chars), `page`, `limit` (1–50), `category`, `city`. |
| `/api/v1/businesses/search` | GET | Same | Versioned alias for business search. |
| `/api/businesses/[id]/claimed` | GET | None | Whether a business is claimed. |

**Response (search):** `results[]` with `id`, `name`, `location`, `category`, `logo_url`, `city`, `overall_rating`, `description`, `is_claimed`, plus `pagination` and `filters`.

**Constraints:**

- Base URL: AVis production = `https://reviewly-ma.vercel.app` (or your deployed URL).
- Rate limit: 100 requests/minute per IP for public endpoints.
- No auth required for search/health; no partner API key today (optional later).

---

## 2. How SIMULIO can leverage it

### 2.1 Phase 2 (roadmap): Company search / autocomplete

**Goal:** In document forms (e.g. resignation letter, formal complaint) and anywhere we ask for “employer” or “company name”, replace a plain text input with a **searchable company dropdown** backed by AVis.

**Benefits:**

- Users pick a real company from Reviewly → consistent names, optional link to Reviewly profile.
- Stored `business_id` enables “Employer rating widget” and deep links later.

**Implementation outline:**

| Step | Where | What |
|------|--------|------|
| 1 | Env | Add `AVIS_API_URL` (e.g. `https://reviewly-ma.vercel.app`). No key needed for now. |
| 2 | Server | New **proxy route** e.g. `GET /api/reviewly/companies?q=...&limit=5` that calls `AVIS_API_URL/api/businesses/search` server-side (avoids CORS, hides URL, single place for rate-limit handling). |
| 3 | Client | Reusable **CompanySearchInput** (or **CompanyAutocomplete**) component: debounced fetch to `/api/reviewly/companies`, dropdown with `name`, `city`, `overall_rating`; on select, store `id` + `name` (and optionally `city`) in form state. |
| 4 | Forms | In document templates / forms that have “company” or “employer name”, use **CompanySearchInput** and save both display name and `reviewly_business_id` in `values` if the schema supports it. |
| 5 | Deep link | When showing a “Voir les avis” CTA, use `{AVIS_SITE_URL}/businesses/{id}` (same base as API or from env). |

**Config:**

- Prefer **server-only** `AVIS_API_URL`; if the frontend needs a “view on Reviewly” base URL, use `NEXT_PUBLIC_AVIS_SITE_URL` or keep deriving from the same base (e.g. same as API URL).

---

### 2.2 Phase 3 (roadmap): Employer rating widget

**Goal:** Show a small Reviewly score (e.g. 4.2/5) next to company names in the user’s simulation history or result page.

**Options:**

- **A – Search then show:** When we have a company name (or `reviewly_business_id` from Phase 2), call search with `q=name` or use `id` if AVis adds `GET /api/businesses/[id]`. Use first match or exact id to get `overall_rating` and display a compact “Reviewly ★ 4.2” widget linking to `{AVIS_SITE_URL}/businesses/{id}`.
- **B – Cached in SIMULIO:** When user selects a company from autocomplete, we already have `id` and `overall_rating` from the search response; store them with the simulation or document and show the widget from cache (no extra API call).

**Recommendation:** Prefer **B** where possible (store `reviewly_business_id` + `overall_rating` at form submit); add a small “refresh rating” or periodic sync only if needed. If AVis later adds `GET /api/businesses/[id]`, we can add a route `GET /api/reviewly/company/[id]` to fetch rating on demand for bookmarked companies.

---

### 2.3 Enhance existing ReviewlyPromoCard

**Current:** `ReviewlyPromoCard` links to `https://reviewly-ma.vercel.app/` (generic).

**Enhancement:**

- When the context has a **company** (e.g. simulation result for a given employer, or document for a company):
  - If we have `reviewly_business_id`: link to `{AVIS_SITE_URL}/businesses/{id}` and optionally show “Voir les avis pour **{name}**”.
  - If we only have company name: call `/api/reviewly/companies?q=...` once (or use existing autocomplete selection) to get `id` and then same as above.
- Keep current behaviour when no company is known (generic CTA to Reviewly homepage).

---

## 3. Technical implementation checklist

### 3.1 Environment

- [ ] Add `AVIS_API_URL` (e.g. `https://reviewly-ma.vercel.app`) to `.env.example` and deployment.
- [ ] Optionally `NEXT_PUBLIC_AVIS_SITE_URL` for “View on Reviewly” links in the client (or derive from `AVIS_API_URL` in server and pass as prop).

### 3.2 Backend (SIMULIO)

- [ ] Create **server-side client** (e.g. `src/lib/avis-api.ts` or `src/lib/reviewly-client.ts`):
  - `searchCompanies(q: string, options?: { limit?, page?, city?, category? })` → calls `AVIS_API_URL/api/businesses/search` and returns typed result.
  - Use `AVIS_API_URL` from `process.env`; no key for now.
- [ ] Add **proxy route** `src/app/api/reviewly/companies/route.ts`:
  - `GET /api/reviewly/companies?q=...&limit=5`
  - Validates `q` (e.g. 2–100 chars to match AVis).
  - Calls the server-side client and returns the same shape (or a subset) to the client.
  - Consider simple in-memory rate limit (e.g. per IP) to avoid blowing AVis 100/min from many users.
- [ ] Optional: add `GET /api/reviewly/company/[id]/route.ts` when AVis supports `GET /api/businesses/[id]` (for on-demand rating fetch).

### 3.3 Frontend (SIMULIO)

- [ ] **CompanySearchInput** (or **CompanyAutocomplete**) component:
  - Debounced input (e.g. 300 ms), min 2 characters.
  - Fetches `GET /api/reviewly/companies?q=...&limit=5`.
  - Renders dropdown with `name`, `city`, optional `overall_rating`.
  - On select: `onSelect({ id, name, city, overall_rating })`; form stores these where needed.
- [ ] Document forms: replace plain “company name” (or “employer”) field with **CompanySearchInput** where applicable; persist `reviewly_business_id` (and optionally rating) in document `values` if schema allows.
- [ ] **ReviewlyPromoCard:** accept optional `company?: { id: string; name: string }` (and optionally `overall_rating`); if present, CTA links to `{AVIS_SITE_URL}/businesses/{id}` and text can say “Voir les avis pour {name}”.
- [ ] Simulation result / dashboard: when we have `reviewly_business_id` (and optionally cached rating), show small “Reviewly ★ X.X” widget and link to Reviewly company page.

### 3.4 AVis (AVis-prod) – optional improvements

- [ ] **CORS:** If SIMULIO ever calls AVis directly from the browser (e.g. before proxy exists), AVis must allow SIMULIO’s origin (e.g. `https://salarie.ma` or dev origin). Prefer proxy so CORS is not required.
- [ ] **GET /api/businesses/[id]:** Optional single-business endpoint (as in MONRH doc) for permalinks and on-demand rating without search.

### 3.5 Operations

- [ ] Optional: in SIMULIO `GET /api/health`, add a dependency check that calls `AVIS_API_URL/api/health` and reports “reviewly: ok” or “reviewly: unreachable” (with timeout) so you can monitor AVis availability.

---

## 4. Suggested order of work

1. **Env + server client + proxy route** – so SIMULIO has a single, server-side way to call company search.
2. **CompanySearchInput component** – reusable autocomplete that uses the proxy.
3. **Integrate into one document form** – e.g. resignation or complaint – and persist `reviewly_business_id` (and name/rating if useful).
4. **ReviewlyPromoCard** – accept optional company and deep-link to `businesses/{id}`.
5. **Employer rating widget** – use stored `reviewly_business_id` + cached rating on result/history pages; add optional refresh route when AVis supports `GET /api/businesses/[id]`.
6. **Health check** – optional “reviewly” check in SIMULIO health.
7. **Extend to other forms** – any other screens that ask for company/employer name.

---

## 5. Summary

| Leverage | How |
|----------|-----|
| **Company autocomplete** | Proxy `GET /api/reviewly/companies` → AVis `GET /api/businesses/search`; **CompanySearchInput** in document and other forms. |
| **Deep links** | Store `reviewly_business_id`; link to `{AVIS_SITE_URL}/businesses/{id}` from promo card and widgets. |
| **Employer rating** | Use search result (or future `GET /api/businesses/[id]`) to show ★ and link; cache in SIMULIO when user selects company. |
| **Health** | Optional: SIMULIO health route calls AVis `/api/health` and reports status. |

All client calls go to **SIMULIO’s own API**; the AVis base URL and any future keys stay server-side only.
