# AVISINE API Integration Plan for SIMULIO

This document tracks how `SIMULIO` consumes the `AVISINE` employer-intelligence API through a shared company contract.

---

## 1. What the AVISINE API provides

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | None | Health check (app + DB). |
| `/api/v1/companies/search` | GET | None | Canonical company search: `q` (2-100 chars), `page`, `limit` (1-50), `category`, `city`. |
| `/api/v1/companies/resolve` | POST | None | Canonical company resolver: match submitted employer names to a canonical company id with confidence and candidate reasons. |
| `/api/v1/companies/:id/trust` | GET | None | Durable trust contract with trust score, source breakdown, assumptions, missing information, and persistence status. |
| `/api/businesses/search` | GET | None | Legacy search endpoint still backing the v1 adapter. |

**Response (search):** `results[]` with `id`, `name`, `slug`, `city`, `category`, `overall_rating`, `description`, `logo_url`, `is_claimed`, `entity_type`, `match_confidence`, plus `pagination`, `filters`, and `meta`.

**Response (resolve):** `companyId`, `confidence`, `method`, `normalizedCompanySlug`, `candidates[]`, and `meta`.

**Response (trust):** `companyId`, `trust`, `sources[]`, `assumptions[]`, `missingInformation[]`, `signalsSummary`, and `meta`.

**Response (detail):** the canonical company detail route now also carries a compact `trust_summary` for cross-app context cards.

**Constraints:**

- Base URL: use deployed `AVISINE` URL from `AVIS_API_URL`.
- Rate limit: public endpoint limits still apply.
- No auth required for search, resolve, or health in the current adapter layer.

---

## 2. How SIMULIO can leverage it

### 2.1 Company search / autocomplete

**Goal:** In document forms and any workflow that asks for employer or company name, replace plain text inputs with a searchable company dropdown backed by `AVISINE`.

**Benefits:**

- Users pick a real company from `AVISINE`, which keeps names consistent across documents, simulations, and employer context widgets.
- Stored company ids unlock trust panels, company context cards, and later verification flows.

**Implementation outline:**

| Step | Where | What |
|------|--------|------|
| 1 | Env | Add `AVIS_API_URL` and optionally `NEXT_PUBLIC_AVIS_SITE_URL`. |
| 2 | Server | Proxy `GET /api/reviewly/companies?q=...&limit=5` to `AVIS_API_URL/api/v1/companies/search`. |
| 3 | Client | Reusable `CompanySearchInput`: debounced fetch to `/api/reviewly/companies`, dropdown with `name`, `city`, `overall_rating`. |
| 4 | Forms | Store both display name and canonical company id in form state where schema allows it. |
| 5 | Deep link | Link employer-intelligence CTAs to `{AVIS_SITE_URL}/companies/{id}` through the public company alias layer. |

---

### 2.2 Company resolver

**Goal:** When `SIMULIO` only has free-text employer data, resolve it to a canonical company record before building company-linked workflows.

**Implementation outline:**

| Step | Where | What |
|------|--------|------|
| 1 | Server | Add a small server helper for `POST /api/v1/companies/resolve`. |
| 2 | Documents | Resolve company names from generated documents or imported employer names before saving case context. |
| 3 | Simulations | Attach resolved company ids to case timelines and employer context panels where confidence is `high`. |
| 4 | Review | If confidence is `medium` or `low`, show candidate suggestions and keep the user in control. |

---

## 3. Technical implementation checklist

### 3.1 Environment

- [ ] Add `AVIS_API_URL` to `.env.example` and deployment.
- [ ] Optionally add `NEXT_PUBLIC_AVIS_SITE_URL` for employer-intelligence links.

### 3.2 Backend (SIMULIO)

- [x] Create `src/lib/avis-api.ts` and point it to `AVIS_API_URL/api/v1/companies/search`.
- [x] Keep proxy route `src/app/api/reviewly/companies/route.ts` as the client-facing autocomplete entrypoint.
- [x] Add a server helper for `POST /api/v1/companies/resolve`.
- [x] Add a `SIMULIO` route for resolver-backed company linking when a workflow needs canonical matching outside autocomplete.
- [x] Add a company detail helper and proxy route for `GET /api/v1/companies/:id`.

### 3.3 Frontend (SIMULIO)

- [x] `CompanySearchInput` consumes the proxy route and accepts canonical company result fields.
- [ ] Replace remaining plain company-name fields with `CompanySearchInput` where appropriate.
- [x] Store canonical company ids under shared naming rather than `reviewly_*` field names for document generator flows, while keeping legacy reads.
- [x] Upgrade employer-intelligence widgets and promo surfaces to use shared `AVISINE` positioning in the document and simulation-result flows.
- [x] Add a dispute-case workflow panel on simulation result pages using the pre-contentieux timeline engine for dismissal, unpaid salary, overtime, and harassment flows.
- [x] Persist saved dispute cases in `Mon dossier` through `/api/cases` and a dedicated `user_cases` table.
- [x] Add per-case retrieval via `/api/cases/:id` and a dedicated `/compte/dossiers/[id]` page so timelines, attached documents, and employer context live on a durable case surface.
- [x] Persist dossier progress inside `timeline_payload` through `/api/cases/:id` so evidence checklist state and step completion survive across sessions.
- [x] Normalize case timelines through a shared dossier-intelligence layer so each case exposes deadline severity, escalation readiness, and evidence artifacts derived from documents plus checklist state.
- [x] Let users register external evidence metadata directly inside the dossier so non-generated proofs feed the same evidence and escalation model.
- [x] Add `/api/cases/:id/evidence-upload` and a `case-evidence` storage bucket dependency so dossiers can attach uploaded proof files, not just metadata.
- [x] Add signed evidence access and delete lifecycle routes under `/api/cases/:id/evidence/:evidenceId` so uploaded files do not depend on permanent public URLs and can be revoked cleanly.
- [x] Convert evidence removal into soft-delete with restore plus dossier-level audit trail, so proof lifecycle is reversible and visible without another table.
- [x] Move evidence governance into admin config so signed URL TTL, retention window, max upload size, and archived-download policy are runtime-controlled and visible on the admin dashboard.
- [x] Expose evidence governance controls in the existing admin tools/config UI so policy changes no longer require direct API calls.
- [x] Add an admin evidence review surface plus `/api/admin/evidence/access` so backoffice can inspect dossier proofs, review governance flags, and open stored files without user-scoped session context.
- [x] Add admin purge and case export actions so the evidence review surface can permanently clean archived proofs after retention and export dossier state as JSON.
- [x] Add admin moderation state on the evidence queue so each dossier review can carry reviewer notes plus open/resolved filtering without a separate moderation table.
- [x] Extend admin evidence moderation with assignee, resolution reason, and follow-up state so the queue is triageable across reviewers instead of only manually inspectable.
- [x] Add a first `CORE-004` schema slice in `MONRH` for `evidence_artifacts`, `evidence_links`, `employment_verifications`, and `verification_decisions`, then wire document generation so generated letters create evidence metadata plus pending verification candidates when the employer is canonically linked.
- [x] Add user read APIs for structured evidence and employment verification candidates, then surface both on `Mon dossier` so generated document proof does not stay hidden in backend tables.
- [x] Add admin verification review routes plus a lightweight user inbox so verification candidates can move from `pending` to a reviewed state instead of stopping at raw storage.
- [x] Add a public per-company verification-signal bridge from `MONRH` and consume it in `AVISINE` company detail/trust surfaces so approved employment checks start feeding employer intelligence.
- [x] Surface compact `AVISINE` trust summary in `MONRH` company context cards, simulation result sidebars, and dossier detail pages so worker-side workflows can react to employer trust, not only raw company identity.
- [x] Persist employer trust snapshot into saved dossiers and use it to strengthen workflow guidance on simulation result pages when employer trust is weak or confidence is low.
- [x] Make `Mon dossier` trust-aware after save by adapting escalation/evidence guidance inside the case workflow panel when the persisted employer trust snapshot is weak.
- [x] Extend saved dossier employer snapshots with richer shared-company context so persisted cases now keep risk level, risk reasons, salary-signal volume, median salary, verification totals, and critical queue counts instead of only a thin trust score.
- [x] Start `CORE-005` on the `MONRH` side with additive `moderation_queues` / `audit_events` schema, first shared-queue ingestion for admin evidence moderation plus employment-verification decisions, initial admin visibility for shared queue / audit events on the evidence and audit surfaces, first queue controls (`take`, `release`, `critical` / `normal`) on both the evidence and verification admin pages, and a dedicated `/admin/moderation` page for the shared MONRH queue.
- [x] Register uploaded dossier files into the shared evidence model too, so user case uploads now create `evidence_artifacts` / `evidence_links`, reopen the shared `case_evidence` moderation queue, and feed downstream employer verification / trust signals instead of living only in `timeline_payload`.

### 3.4 Backend (AVISINE)

- [x] Add canonical `GET /api/v1/companies/search`.
- [x] Add canonical `POST /api/v1/companies/resolve`.
- [x] Add canonical `GET /api/v1/companies/:id` with a shared detail contract that now includes compact trust summary plus verification signals.
- [x] Add durable trust storage in `AVISINE` (`trust_scores`, `confidence_snapshots`) plus `GET /api/v1/companies/:id/trust`.
- [x] Land the first canonical company schema layer in `AVISINE` with additive `companies`, alias/domain/location/industry tables plus `businesses.company_id` backfill and sync trigger.
- [x] Carry `companyId` through mapped `AVISINE` business objects so the public company page requests trust and verification using canonical company ids instead of legacy business ids.
- [x] Persist canonical `company_id` alongside legacy `business_id` for new `AVISINE` salary submissions, job-offer submissions, and claim records.
- [x] Extend `AVISINE` admin/moderation and analytics paths so job-offer moderation and salary admin reads understand canonical `company_id`, even while older aggregate views still remain business-keyed.
- [x] Make the main `AVISINE` salary and job-offer aggregate views company-aware (`company_id` plus fallback `business_id`) so employer analytics can resolve through the canonical company layer without breaking legacy consumers.
- [x] Update the remaining high-traffic `AVISINE` read paths (`/dashboard`, business export, pro insights digest cron) so salary analytics resolve through company-aware aggregate views instead of `business_id`-only lookups.
- [x] Update the `AVISINE` business analytics dashboard and job-offer benchmark readers so hiring/salary signals can load through canonical `company_id` with legacy `business_id` fallback.
- [x] Update the `AVISINE` job-offer employer-context helper so public offer intelligence reads salary benchmarks through canonical `company_id` instead of legacy `business_id` only.
- [x] Update the `AVISINE` salary digest cron so company-scoped salary alerts match on canonical employer linkage instead of only exact `business_id` hits.
- [x] Add canonical `company_id` persistence to `AVISINE` salary alert subscriptions and update alert actions / moderation notifications so company salary alerts dedupe and match by employer, not only by legacy business row.
- [x] Align the dependent admin/client/test layer with the new company-aware salary alert and employer-metrics contract so canonical employer ids are represented above the raw data helpers too.
- [x] Thread canonical `companyId` from the public `AVISINE` business page into the salary-alert UI so company-scoped salary follows no longer depend on server-side company resolution fallback alone.
- [x] Update `AVISINE` admin analytics and job-offer mapping summaries so unresolved employer mappings are counted from missing canonical `company_id`, not only missing legacy `business_id`.
- [x] Update the `AVISINE` admin job-offer moderation UI so reviewers can see canonical company ids alongside legacy business ids and candidate mappings.
- [x] Align the `AVISINE` admin analytics UI copy and top-employer typing with canonical employer resolution so queue health and unresolved-company panels no longer imply a business-id-only model.
- [x] Update the `AVISINE` admin business-assignment search routes, assignment reads, and UI badges so canonical company ids are visible alongside legacy business ids during user/business linking workflows.
- [x] Update the `AVISINE` admin salary and claim moderation surfaces so employer rows and claim detail dialogs expose canonical `company_id` alongside legacy `business_id`.
- [x] Update the remaining main `AVISINE` moderation/reporting views for reviews, review reports, media reports, business reports, and admin messages so joined employer metadata carries and displays canonical `company_id`.
- [x] Start `CORE-005` in `AVISINE` with additive `moderation_queues` and `audit_events`, dual-write admin audit logging into the new event stream, initial queue ingestion for job-offer, media-report, business-report, admin-message, claim-review, review-appeal, and bulk moderation flows, plus live queue creation for salary submissions, review submissions / edits, salary moderation decisions, business-claim submissions, business suggestions, and centralized review/media report submissions.
- [x] Move more of the `AVISINE` compatibility adapter layer onto canonical company reads by routing legacy `/api/businesses/search` through `companies.v1`, resolving business detail fallback through `companies.source_business_id`, and letting older dashboard/search helpers accept canonical company ids with business-row fallback.
- [x] Carry canonical company scope through the main `AVISINE` pro dashboard layer so the business profile hook, updates, messages, analytics, reviews, and profile-edit actions no longer depend on exact `business_id` identity only.
- [x] Extend the remaining public/business-owned UI helpers so business selector routing, widget embeds, and owner action bars prefer canonical company identity where available instead of assuming exact `businesses.id`.
- [x] Keep the `AVISINE` dashboard homepage and business export flow on canonical company scope too, so dashboard switching, public links, and exported review / analytics aggregates do not degrade back to one raw `business_id`.
- [x] Expand the shared `MONRH` verification bridge and `AVISINE` trust pipeline so company trust now uses company-scoped reviews plus evidence-artifact counts and shared moderation-queue backlog, not only thin verification totals from the bridge, and surface snapshot freshness / persistence plus bridge-source context in the public trust panel.
- [x] Add an `AVISINE` admin trust-intel surface on top of `trust_scores` and `confidence_snapshots` so backoffice can inspect stored trust scores, latest confidence snapshots, and the exact evidence / moderation inputs behind public trust results.
- [x] Add an admin-triggered trust refresh path in `AVISINE` and align trust storage FKs with canonical `companies(id)` so trust recomputation and persistence no longer depend conceptually on legacy `businesses(id)` ownership.
- [x] Turn the `AVISINE` trust-intel page into a real diagnostics surface by rendering snapshot breakdown, missing-information flags, assumptions, and verification / moderation queue metrics directly from persisted trust snapshots instead of forcing backoffice to inspect raw JSON only.
- [x] Make the shared `MONRH` moderation page source-aware by resolving queue items back to targeted evidence and verification admin scopes, with case / company context and exact deep links instead of only opaque queue ids.
- [x] Add direct shared-queue status actions in both `MONRH` and `AVISINE` so moderation queue items can now be resolved, dismissed, and reopened from the shared queue surfaces instead of only being assigned and reprioritized.
- [x] Start `CORE-007` with canonical `GET /api/v1/companies/:id/context-card`, `GET /api/v1/companies/:id/risk-summary`, and `GET /api/v1/companies/:id/salary-benchmarks` endpoints in `AVISINE` plus matching `MONRH` server client and proxy routes, so cross-app company context no longer depends only on the detail payload and can consume trust, verification, salary, and risk summary through reusable contracts.
- [x] Switch the main `MONRH` employer context UI consumers onto the new shared company-context contracts, so company cards, trust summaries, and simulation workflow adjustments now use `context-card` / `risk-summary` instead of depending only on the older company detail payload.
- [ ] Move the adapter fully off `businesses` naming now that canonical reads (`search`, `detail`, `resolve`, trust lookup) are `companies`-first, cross-app deep links and public canonical/share URLs now target the `/companies/...` surface, the main salary/follow/review/share user loops also return through `/companies/...`, and the remaining work is wider write-path and analytics migration.

---

## 4. Suggested order of work

1. Shared company search contract.
2. Shared company resolver contract.
3. `SIMULIO` document and simulation flows storing canonical company ids.
4. Company context cards and trust surfaces.
5. Migration from legacy `reviewly_*` field names to shared ecosystem naming.

---

## 5. Summary

| Leverage | How |
|----------|-----|
| **Company autocomplete** | Proxy `GET /api/reviewly/companies` -> `AVISINE` `GET /api/v1/companies/search`; `CompanySearchInput` in document and other forms. |
| **Company resolution** | `POST /api/v1/companies/resolve` turns free-text employer names into canonical company ids with confidence. |
| **Deep links** | Store canonical company ids; link to employer-intelligence pages from promo cards and widgets. |
| **Future trust layer** | Company ids are the join key for trust score, offer signals, salary benchmarks, and verification. |

All browser traffic still goes through `SIMULIO` routes. `AVIS_API_URL` stays server-side.
