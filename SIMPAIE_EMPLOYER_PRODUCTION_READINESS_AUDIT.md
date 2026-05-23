# Simpaie Employer Module Production Readiness Audit

Audit date: 2026-05-22  
Scope reviewed: `src/app/employer/**`, `src/app/api/employer/**`, employer client components, employee self-service client, employer local/cloud stores, employer Supabase server stores, route proxy, payslip payroll rules, contract generator bridge, CNSS export builder, and PDF payslip endpoint.

## Executive Summary

- Total findings: **12 critical, 24 high, 20 medium, 6 low**
- Overall production readiness: **26%**
- Top 3 blockers to ship:
  1. Employer pages and self-service are not protected by an employer/employee auth and role boundary. The proxy matcher omits `/employer/:path*` and the self-service screen lets a browser user switch employee identity from `localStorage`.
  2. Browser storage and sample fallbacks remain the operational source for most screens. Cloud APIs exist, but the UI hydrates from `localStorage`, falls back to demo companies/employees/leaves/time entries, and pushes those browser lists back to Supabase.
  3. Moroccan payroll deliverables are legally incomplete or wrong for the audit rules: CNSS CT/LT are aggregated/capped incorrectly, 2026 IR rules are not the audited rules, the payslip PDF omits mandatory split CNSS and annual cumuls/net-in-letters, and the CNSS CSV is not a Damancom-complete export.

### Cross-Cutting Evidence

- `DATA [src/lib/employer/company-store.ts:9] PROTOTYPE` - company reads use `monrh_employer_companies_v1` in `window.localStorage` and return `sampleEmployerCompanies` when missing or unparsable.
- `DATA [src/lib/employer/company-store.ts:43] BAD CONTEXT` - active employer context uses `monrh_employer_active_company_v1` from `localStorage`, not a JWT/session company claim.
- `DATA [src/components/employer/employer-data-bootstrap-client.tsx:50] PARTIAL HYDRATION` - the layout hydrator fetches cloud lists for the browser-selected active company, but uploads local lists when cloud lists are empty.
- `DATA [src/lib/employer/workspace-snapshot.ts:51] PROTOTYPE` - cloud workspace snapshotting serializes employer `localStorage` keys, including active company and active employee identity.
- `DATA [src/lib/server/employer-core-store.ts:111] REAL BUT USER-OWNED` - API persistence uses Supabase and rejects company ids not owned by the current user, then filters tables by `user_id` and `company_id`.
- `AUTH [src/proxy.ts:111] UNPROTECTED` - the proxy matcher protects admin/account/API areas but does not match `/employer/:path*`, `/employee`, or `/api/employer/:path*`.
- `AUTH [src/app/api/employer/companies/route.ts:40] BYPASSABLE` - authenticated users can POST any `plan` value accepted by the client schema; there is no Stripe/subscription validation or RBAC in the employer API.
- `AUTH [src/app/api/employer/payslip-pdf/route.ts:378] UNPROTECTED` - PDF generation accepts a caller-supplied company, employee, and payroll result without session or role checks.
- `COMPLIANCE [src/lib/calculators/payroll-core.ts:130] WRONG` - one capped `cnssEmployeeRate` and one capped `cnssEmployerRate` are applied to `min(cnssGross, cnssCeiling)`.
  Expected: CT on full brut, LT on `min(brut, 6000)`, and distinct employee/employer lines.
  Found: aggregate CNSS employee/employer amounts both use the ceiling.
- `COMPLIANCE [src/lib/rules/default-rules.ts:229] WRONG` - current salary rules use aggregate CNSS rates `0.0448` and `0.0898`, AMO employer `0.0411`, reform professional expense tiers, family annual reduction `600`, and 37% top IR bracket.
  Expected: audit 2026 rules: CT/LT split, AMO employer `0.0203`, professional deduction `min(brut * 20%, 2500)`, child deduction `360/year`, and audited 38% top bracket.
  Found: a different salary rule set is selected for 2026.

## Findings by Module

### Vue - Dashboard - `/employer` - Readiness: 35%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Dashboard reads scoped browser keys and demo employee fallback instead of server data. |
| Auth | 🔴 NONE | Page is rendered under unguarded `/employer`. |
| Compliance | 🟡 PARTIAL | It surfaces CNSS/validation signals but they inherit prototype and wrong payroll rule data. |
| UX coverage | 🟡 PARTIAL | Quick actions and onboarding exist; payroll cycle lacks declared status. |

- `DATA [src/components/employer/employer-dashboard-client.tsx:77] PROTOTYPE` - dashboard reads `monrh_employer_employees_v1`, `monrh_employer_payroll_runs_v1`, `monrh_employer_leave_requests_v1`, and `monrh_employer_time_entries_v1` through browser-scoped storage; employees fall back to sample data.
- `AUTH [src/app/employer/page.tsx:11] UNPROTECTED` - route page delegates to the client under a layout with no server auth or role check.
- `UX [/employer] PARTIAL` - quick links to add employees and open payroll/CNSS exist at `src/components/employer/employer-dashboard-client.tsx:209`, and onboarding checklist exists at `:109` and `:388`.
- `UX [/employer] MISSING` - cycle states at `src/components/employer/employer-dashboard-client.tsx:118` cover preparation, calculation, validation, and distribution only; there is no persisted state machine with `not started / running / generated / declared`.

### Salariés - `/employer/employees` - Readiness: 30%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | CRUD writes browser storage first and mirrors whole lists to cloud. |
| Auth | 🔴 NONE | Page/API have no role model; UI plan limit is client-derived. |
| Compliance | 🟡 PARTIAL | Dates/CNSS are captured, but CIN and children needed by PDF/IR are absent from employee records. |
| UX coverage | 🟡 PARTIAL | Create/update, per-employee docs, contract handoff, and CSV exist; employee deletion and required fields are incomplete. |

- `DATA [src/components/employer/employee-register-client.tsx:180] FAKE DATA` - register initial state uses `sampleEmployerEmployees` and `sampleEmployerCompanies`.
- `DATA [src/components/employer/employee-register-client.tsx:222] PROTOTYPE` - employee changes write the list to browser storage before best-effort cloud mirroring.
- `DATA [src/app/api/employer/employees/route.ts:61] REAL API` - authenticated list replacement persists through `replaceEmployerEmployees`, which writes Supabase rows after user/company access checks.
- `AUTH [src/app/api/employer/employees/route.ts:27] AUTHENTICATED BUT NO RBAC` - caller supplies `companyId`; store checks ownership, but no `owner`, `rh_admin`, `rh_viewer`, `accountant`, `cabinet`, or `employee` permission is enforced.
- `COMPLIANCE [src/app/api/employer/employees/route.ts:13] PARTIAL` - employee schema has name, contract, start/end dates, gross, CNSS, email, documents, status.
  Expected: at minimum CIN and children count for payslip identity and audited IR family deduction.
  Found: no CIN, internal matricule, children/dependents count, or agricultural sector attribute.
- `UX [/employer/employees] PARTIAL` - document checklist is per employee at `src/components/employer/employee-register-client.tsx:655`, draft handoff writes a scoped `contract_draft` at `:338`, and CSV exports current rows at `:307`.
- `UX [/employer/employees] MISSING` - add form fields at `src/components/employer/employee-register-client.tsx:41` omit CIN and children; the UI shows update controls but no delete action was found.

### Contrats - `/employer/contracts` - Readiness: 34%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🟡 PARTIAL | Templates/generation use APIs, but draft/archive state is local-first and cloud mirrored. |
| Auth | 🔴 NONE | Employer contract page is unguarded and generation is not tied to employer RBAC. |
| Compliance | 🟡 PARTIAL | CDI/CDD generation exists; ANAPEC template was not found. |
| UX coverage | 🟡 PARTIAL | Wizard, employee draft handoff, archive, and download exist; archive links by name fallback. |

- `DATA [src/components/contract-wizard.tsx:55] PROTOTYPE` - contract draft loads from scoped browser storage.
- `DATA [src/components/contracts/contract-page-client.tsx:119] PROTOTYPE` - embedded employer archive writes local records and best-effort saves records to cloud.
- `DATA [src/app/api/contracts/generate/route.ts:103] PARTIAL` - template lookup uses Supabase, but failures fall back to local fallback catalog at `:110`.
- `AUTH [src/app/employer/contracts/page.tsx:12] UNPROTECTED` - employer route mounts the contract tool without a server employer-role gate.
- `UX [/employer/contracts] PARTIAL` - archive panel is present at `src/components/contracts/contract-page-client.tsx:544`; record lookup links generated contract to employee by matching employee name at `:135`, not by an explicit employee selection key.
- `UX [/employer/contracts] MISSING` - UI/template search shows CDI and CDD options at `src/components/contract-wizard.tsx:96`; no ANAPEC template path was found in the employer contract UI.

### Paie - `/employer/payroll` - Readiness: 22%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Payroll run history is local-first, uploaded as whole JSON lines. |
| Auth | 🔴 NONE | UI and PDF plan gating are browser controlled. |
| Compliance | 🔴 WRONG | Audited CNSS and IR rules do not match selected payroll rule code. |
| UX coverage | 🟡 PARTIAL | Multi-select, run history, results, time-entry overtime and PDFs exist; per-employee variables are not complete. |

- `DATA [src/components/employer/employer-payroll-client.tsx:98] FAKE DATA` - employees and active company start from samples; stored employees replace them only after client hydration.
- `DATA [src/components/employer/employer-payroll-client.tsx:305] PROTOTYPE` - newly calculated runs are written to browser payroll store and only then best-effort saved to cloud.
- `AUTH [src/components/employer/employer-payroll-client.tsx:235] BYPASSABLE` - PDF enablement is derived from `activeCompany.plan` in browser state/local storage.
- `COMPLIANCE [src/lib/calculators/payroll-core.ts:130] WRONG` - CNSS employee and employer amounts use a capped aggregate base.
  Expected: employee CT `brut * 0.0052`, employee LT `min(brut, 6000) * 0.0396`, employer CT `brut * 0.0105`, employer LT `min(brut, 6000) * 0.0793`.
  Found: `contributableBase * rules.cnssEmployeeRate` and `contributableBase * rules.cnssEmployerRate`.
- `COMPLIANCE [src/lib/rules/default-rules.ts:235] WRONG` - 2026 payroll professional deduction is tiered 35%/25% with 2,916.67 cap in the rules chosen for 2026.
  Expected: `min(brut * 20%, 2500 MAD/month)`.
  Found: `professionalExpenseTiers` with `0.35` and `0.25`.
- `COMPLIANCE [src/lib/rules/default-rules.ts:242] WRONG` - family reduction is `600/year`, and `computeFamilyTaxReductionMonthly` also adds a spouse charge at `src/lib/calculators/payroll-core.ts:89`.
  Expected: child deduction `360 MAD/year` per child, max 6 children.
  Found: annual amount `600`, cap `3600`, plus married spouse charge.
- `UX [/employer/payroll] PARTIAL` - employee multi-select exists at `src/components/employer/employer-payroll-client.tsx:596`, run table includes employer cost at `:687`, and approved time entries feed overtime at `:177` and `:280`.
- `UX [/employer/payroll] MISSING` - variables such as overtime, bonus and allowances are screen-level fields at `src/components/employer/employer-payroll-client.tsx:106`, not per-employee variable inputs.

### CNSS - `/employer/cnss` - Readiness: 15%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Export history is browser-first with cloud mirror. |
| Auth | 🔴 NONE | Client-only export gate; no server Damancom export policy. |
| Compliance | 🔴 WRONG | CSV is not Damancom-complete and reconstructs capped base from wrong aggregate rate. |
| UX coverage | 🟡 PARTIAL | Run selector, totals, per-employee table, and history exist. |

- `DATA [src/components/employer/employer-cnss-client.tsx:131] PROTOTYPE` - CNSS reads employees, payroll runs, and exports from local stores; no-run mode builds rows directly from employee register at `:41`.
- `AUTH [src/components/employer/employer-cnss-client.tsx:205] BYPASSABLE` - CSV permission comes from browser plan capabilities.
- `COMPLIANCE [src/components/employer/employer-cnss-client.tsx:66] WRONG` - CNSS base is reconstructed as `cnssEmployee / 0.0448`.
  Expected: export separate declared brut and salary plafonne for LT under audited CT/LT rates.
  Found: one aggregate employee amount reverses one aggregate capped base.
- `COMPLIANCE [src/components/employer/employer-cnss-client.tsx:74] EXPORT INCOMPLETE` - CSV headers omit employer matricule, employee CIN, declared days, and a dedicated salary plafonne Damancom column.
  Expected: matricule employeur, employee CNSS, employee CIN, full name, declared days, brut declared, salary plafonne, total employee cotisation, total employer cotisation.
  Found: period, employee name, CNSS number, contract type, gross, `cnss_base`, employee/employer/total CNSS.
- `COMPLIANCE [src/components/employer/employer-cnss-client.tsx:74] EXPORT INCOMPLETE` - employer matricule is not sourced from `EmployerCompany` into CSV generation.
  Expected: `EmployerCompany.cnssAffiliateNumber`.
  Found: `downloadCsv` accepts only filename, rows, and period.
- `UX [/employer/cnss] PARTIAL` - run selector exists at `src/components/employer/employer-cnss-client.tsx:277`, per-employee table at `:459`, totals at `:193`, and export history at `:353`.

### Congés - `/employer/leave` - Readiness: 24%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Requests are local-first with samples and best-effort list replacement. |
| Auth | 🔴 NONE | Approve/reject has no role check. |
| Compliance | 🔴 WRONG | Employer leave balance misses audited seniority bonus. |
| UX coverage | 🟡 PARTIAL | Request and approval table exist; calendar and reject reason are missing. |

- `DATA [src/components/employer/employer-leave-client.tsx:73] FAKE DATA` - page state starts from sample company, employees, and leave requests.
- `DATA [src/components/employer/employer-leave-client.tsx:122] PROTOTYPE` - leave request writes local state/store and best-effort mirrors to API.
- `COMPLIANCE [src/components/employer/employer-leave-client.tsx:52] WRONG` - screen balance uses `months * 1.5` only.
  Expected: `(months * 1.5) + floor(years_seniority / 5) * 1.5 - approved_days`.
  Found: no seniority bonus in `accruedPaidLeave`; remaining balance subtracts approved paid days at `:138`.
- `UX [/employer/leave] PARTIAL` - employee/date request creation is present at `src/components/employer/employer-leave-client.tsx:26`; approval/rejection controls are present later in the list.
- `UX [/employer/leave] MISSING` - no absence calendar view was found, and the schema/status transition has one free-text request reason but no decision reason for rejection.

### Pointage - `/employer/time` - Readiness: 38%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Time entries are local-first with cloud mirror. |
| Auth | 🔴 NONE | Approval/rejection has no role boundary. |
| Compliance | 🟡 PARTIAL | Four overtime amount tiers are coded with expected multipliers. |
| UX coverage | 🟡 PARTIAL | Tiered weekly entries and payroll propagation exist; weekly grid is a list/table, not a per-day grid. |

- `DATA [src/components/employer/employer-time-client.tsx:102] FAKE DATA` - employees, company, and time entries initialize from samples.
- `DATA [src/components/employer/employer-time-client.tsx:151] PROTOTYPE` - updates write browser storage and best-effort cloud time-entry list replacement.
- `COMPLIANCE [src/components/employer/employer-time-client.tsx:48] PARTIAL` - overtime multipliers are day `1.25`, night `1.5`, rest/holiday day `1.5`, rest/holiday night `2`.
  Expected: audited four tiers.
  Found: four-tier amount calculation at `:90`.
- `UX [/employer/time] PARTIAL` - screen captures week start and four overtime fields at `src/components/employer/employer-time-client.tsx:277`, approval is per entry at `:429`, payroll reads approved amounts at `src/components/employer/employer-payroll-client.tsx:177`.
- `UX [/employer/time] MISSING` - rows are weekly summary entries in a table at `src/components/employer/employer-time-client.tsx:393`; there is no weekly grid with day-level punches/shifts.

### Alertes - `/employer/compliance` - Readiness: 18%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Alerts are derived client-side from browser data; dismissals stay browser-only. |
| Auth | 🔴 NONE | Compliance data and dismiss actions are unguarded. |
| Compliance | 🔴 WRONG | SMIG threshold is obsolete for the audited 2026 rule. |
| UX coverage | 🟡 PARTIAL | CDD, missing docs, low salary, payroll/CNSS, dismiss, and module links exist; CNSS due date and missing-payslip semantics are weak. |

- `DATA [src/components/employer/employer-compliance-client.tsx:202] PROTOTYPE` - alerts read employee, payroll, leave, and dismiss state from scoped browser keys.
- `DATA [src/components/employer/employer-compliance-client.tsx:234] PROTOTYPE` - dismiss persists alert ids to `monrh_employer_compliance_dismissed_v1` only; no reason is captured or persisted server-side.
- `COMPLIANCE [src/components/employer/employer-compliance-client.tsx:32] WRONG` - `SMIG_MONTHLY_REFERENCE` is `3111`.
  Expected: commercial/industrial SMIG `3500 MAD/month` for audit 2026.
  Found: `3111`.
- `UX [/employer/compliance] PARTIAL` - CDD expiry/missing date, documents, salary floor, payroll absence, CNSS recap and leave validation alerts are data-derived at `src/components/employer/employer-compliance-client.tsx:73`.
- `UX [/employer/compliance] MISSING` - no persisted dismissal reason and no explicit CNSS due-date alert were found.

### Assistant - `/employer/assistant` - Readiness: 12%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Context reads scoped browser storage with sample fallback. |
| Auth | 🔴 NONE | Assistant page is unguarded. |
| Compliance | 🟡 PARTIAL | It routes users to HR modules but does not independently validate law. |
| UX coverage | 🔴 MISSING | Free-form box exists, but answers are keyword branches; no model API call was found. |

- `DATA [src/components/employer/employer-assistant-client.tsx:220] FAKE DATA` - assistant initializes employees/leaves/time from samples and reads scoped browser keys at `:228`.
- `AUTH [src/app/employer/assistant/page.tsx:11] UNPROTECTED` - page is a public employer route under the unguarded matcher.
- `UX [/employer/assistant] MISSING` - `buildAnswer` uses keyword checks for conge, heures, CNSS/paie, and CDD at `src/components/employer/employer-assistant-client.tsx:95`; no Claude or other LLM API call was found.
- `UX [/employer/assistant] PARTIAL` - generated answers include action links back to modules through `actionHref` in each branch.

### Self-service - `/employer/self-service` - Readiness: 5%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Payslips/leaves/documents are read from employer browser storage. |
| Auth | 🔴 NONE | No separate employee auth flow; employee identity is selectable in the browser. |
| Compliance | 🔴 WRONG | Leave balance repeats no-seniority accrual and PDF payload cannot guarantee mandatory employee fields. |
| UX coverage | 🟡 PARTIAL | Payslip list, leave request form, leave balance, document list, PDF action exist. |

- `AUTH [src/components/employee/employee-portal-client.tsx:134] SECURITY FLAW` - active employee is restored from `monrh_employee_active_profile_v1` in local storage.
- `AUTH [src/components/employee/employee-portal-client.tsx:311] SECURITY FLAW` - employee selector exposes all employees and calls `selectEmployee`, allowing client-side identity switching.
- `DATA [src/components/employee/employee-portal-client.tsx:135] PROTOTYPE` - employees, leave requests and payroll runs come from employer-scoped browser storage with sample fallbacks.
- `DATA [src/components/employee/employee-portal-client.tsx:238] PROTOTYPE` - self-service leave request writes local browser data and only best-effort mirrors to employer leave API.
- `COMPLIANCE [src/components/employee/employee-portal-client.tsx:65] WRONG` - leave balance uses flat monthly accrual without seniority bonus.
  Expected: audited seniority bonus.
  Found: `months * 1.5`.
- `UX [/employer/self-service] PARTIAL` - payslip rows and PDF download are wired; the data boundary is not suitable for employee self-service production.

### Cabinet - `/employer/cabinet` - Readiness: 14%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Portfolio is assembled from browser-scoped lists and sample company fallback. |
| Auth | 🔴 NONE | Cabinet capability is a local plan flag, not a cabinet role/subscription. |
| Compliance | 🟡 PARTIAL | CNSS status checks presence, not export compliance. |
| UX coverage | 🟡 PARTIAL | Portfolio table, metrics and context switch exist. |

- `DATA [src/components/employer/employer-cabinet-client.tsx:85] PROTOTYPE` - each company portfolio reads scoped browser keys; sample company gets sample employees/leaves/time at `:87`.
- `AUTH [src/components/employer/employer-cabinet-client.tsx:149] BYPASSABLE` - cabinet unlock is `activeCompany.plan === "cabinet"` from browser/company state.
- `UX [/employer/cabinet] PARTIAL` - portfolio rows, per-client payroll/CNSS status and consolidated totals exist at `src/components/employer/employer-cabinet-client.tsx:102`.
- `UX [/employer/cabinet] SECURITY RISK` - one-click context switch writes `monrh_employer_active_company_v1` at `src/components/employer/employer-cabinet-client.tsx:165`; rescoping is browser-driven, not session entitlement-driven.

### Analytics - `/employer/analytics` - Readiness: 20%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Analytics consumes browser stores and samples. |
| Auth | 🔴 NONE | Route is not role gated. |
| Compliance | 🟡 PARTIAL | Cost metrics inherit payroll calculation defects. |
| UX coverage | 🟡 PARTIAL | Trend, average cost, contract distribution and projection exist; no 12-month real trend. |

- `DATA [src/components/employer/employer-analytics-client.tsx:169] PROTOTYPE` - employees, runs, leave, and time are read from scoped local storage with sample fallbacks.
- `UX [/employer/analytics] PARTIAL` - payroll-run trend and contract distribution are aggregated from available records at `src/components/employer/employer-analytics-client.tsx:93` and `:149`.
- `UX [/employer/analytics] MISSING` - trend uses only last six runs; no-run mode fabricates six projected months with `1.18` employer-cost and `0.78` net multipliers at `src/components/employer/employer-analytics-client.tsx:99`.

### Paramètres - `/employer/settings` - Readiness: 20%

| Check | Status | Finding |
|---|---|---|
| Data layer | 🔴 PROTOTYPE | Company settings are local-first; cloud API accepts full client replacement. |
| Auth | 🔴 NONE | No owner-only settings enforcement. |
| Compliance | 🟡 PARTIAL | ICE and CNSS affiliation fields exist; address is missing for payslip employer identity. |
| UX coverage | 🟡 PARTIAL | Add form, switcher and plan display exist; company edit and real upgrade flow are missing. |

- `DATA [src/components/employer/employer-settings-client.tsx:85] PROTOTYPE` - company list is written to local storage then mirrored to cloud.
- `AUTH [src/components/employer/employer-settings-client.tsx:98] BYPASSABLE` - plan switches locally in settings and persists through the companies endpoint.
- `COMPLIANCE [src/components/employer/employer-settings-client.tsx:23] PARTIAL` - company form includes name, ICE, CNSS affiliate number and city.
  Expected: employer address must be captured for mandatory payslip mention.
  Found: no address form field in the employer company type or settings form.
- `UX [/employer/settings] PARTIAL` - active company switcher and plan display exist.
- `UX [/employer/settings] MISSING` - no Stripe integration or subscription state was found; no existing-company edit form beyond plan switching was found.

## API And Shared Store Findings

- `AUTH [src/app/api/employer/companies/route.ts:19] AUTHENTICATED` - API handlers call `getCurrentUserId` and return 401 without a Supabase user.
- `AUTH [src/app/api/employer/payroll-runs/route.ts:52] AUTHENTICATED BUT NO RBAC` - POST accepts browser-computed payroll runs and replaces all stored runs for the owned company.
- `AUTH [src/app/api/employer/leave-requests/route.ts:23] AUTHENTICATED BUT NO RBAC` - POST accepts client-supplied leave status and decisions; employee self-service and employer approval share the same bulk replacement route.
- `AUTH [src/app/api/employer/time-entries/route.ts:23] AUTHENTICATED BUT NO RBAC` - time-entry statuses and overtime amounts are caller-supplied.
- `AUTH [src/app/api/employer/cnss-exports/route.ts:39] AUTHENTICATED BUT NO SERVER VALIDATION` - export rows/totals are stored from browser payload instead of recomputed from authoritative payroll records.
- `DATA [src/lib/server/employer-core-store.ts:289] HIGH` - writes delete the company list and reinsert caller-supplied whole arrays. This is not conflict-safe CRUD and will lose concurrent changes.
- `DATA [src/lib/server/employer-workspace-store.ts:21] PROTOTYPE SHADOW STORE` - saved workspace snapshots persist local-storage payloads by user/workspace key; this duplicates core tables and can rehydrate stale client data.

## Critical Findings (must fix before any user can pay)

1. `/employer/*` and `/employee` are not protected by route middleware/server layouts; `src/proxy.ts:111` does not match these routes.
2. There is no employer role or permission enforcement for owner, RH admin/viewer, accountant, cabinet, or employee in any employer API.
3. Self-service employee identity is switchable from browser state and an on-screen employee selector.
4. Plan/subscription gating is controlled by mutable company plan in browser state and the companies API, not Stripe/server entitlement.
5. Employer source of truth remains `localStorage` plus sample fallback in all operational screens.
6. Payroll CNSS audited 2026 CT/LT split is wrong because all CNSS aggregate contributions use capped base and aggregate rates.
7. Current 2026 payroll rules do not match the audit IR and AMO rule set.
8. CNSS export is not a Damancom-complete CSV and employer matricule is not emitted from `EmployerCompany`.
9. Payslip PDF endpoint is unauthenticated and accepts arbitrary result payloads.
10. Payslip PDF does not line-item CNSS CT and CNSS LT separately.
11. Payslip PDF does not print net-to-pay in letters or annual IR/CNSS cumuls.
12. Employee records omit CIN/internal matricule/dependents needed to reliably generate mandatory payslip mentions and audited IR deduction.

## Compliance Errors (legal risk)

- `COMPLIANCE [src/lib/calculators/payroll-core.ts:130] WRONG` - audited CNSS CT/LT split and CT uncapped base are not implemented.
- `COMPLIANCE [src/lib/rules/default-rules.ts:229] WRONG` - current 2026 AMO employer rate is not audited `0.0203`.
- `COMPLIANCE [src/lib/rules/default-rules.ts:235] WRONG` - current 2026 professional deduction is not audited `20% capped at 2,500 MAD/month`.
- `COMPLIANCE [src/lib/rules/default-rules.ts:242] WRONG` - audited child deduction values are not used.
- `COMPLIANCE [src/components/employer/employer-compliance-client.tsx:32] WRONG` - SMIG alert uses `3111`, not audited 2026 `3500`.
- `COMPLIANCE [src/components/employer/employer-leave-client.tsx:52] WRONG` - employer leave balance misses seniority bonus.
- `COMPLIANCE [src/components/employee/employee-portal-client.tsx:65] WRONG` - self-service leave balance misses seniority bonus.
- `COMPLIANCE [src/app/api/employer/payslip-pdf/route.ts:254] LEGAL NON-COMPLIANCE` - salary deductions show one `CNSS salarie` line, not separate CNSS CT and CNSS LT.
- `COMPLIANCE [src/app/api/employer/payslip-pdf/route.ts:289] LEGAL NON-COMPLIANCE` - PDF shows net amount digits only; no amount in letters is generated.
- `COMPLIANCE [src/app/api/employer/payslip-pdf/route.ts:233] LEGAL NON-COMPLIANCE` - PDF has no annual IR cumulated and CNSS cumulated fields.
- `COMPLIANCE [src/components/employer/employer-cnss-client.tsx:74] EXPORT INCOMPLETE` - Damancom-required employer matricule, employee CIN, declared days, and salary plafonne column are missing.

## Recommended Fix Order

1. **Lock the boundary** - add `/employer/:path*`, `/employee`, and `/api/employer/:path*` auth protection plus server-side role policies. Estimated effort: 4-7 days.
2. **Separate employee self-service tenancy and identity** - bind employee portal to employee session and employee/company assignment; remove client selector in production. Estimated effort: 4-6 days.
3. **Replace local-first core CRUD** - make server DB state authoritative for companies, employees, payroll runs, leave/time approvals, contracts, CNSS exports; remove sample fallback from authenticated production flows. Estimated effort: 7-12 days.
4. **Move entitlements server-side** - derive plan from Stripe/subscription tables and enforce PDF/export/company/employee limits on API routes. Estimated effort: 3-5 days.
5. **Implement audited payroll rules** - create explicit CNSS CT/LT/AMO lines, audited IR annualization and child deduction path, and regression fixtures for 2026. Estimated effort: 5-8 days.
6. **Harden payslip PDF** - compute from stored payroll lines, require session/role access, capture employee/company mandatory fields, add split deductions, net in letters, annual cumuls. Estimated effort: 4-7 days.
7. **Rebuild CNSS export** - generate Damancom-oriented export from authoritative payroll run + company + employee data, validate required columns and totals, persist immutable export history. Estimated effort: 4-6 days.
8. **Finish HR workflows** - add leave seniority balance, calendar and reject reasons; time weekly grid; per-employee payroll variables; employee CRUD completeness; analytics 12-month run aggregation. Estimated effort: 8-14 days.

## Audit Notes

- The employer Supabase store is better than the prompt's known current-state baseline: authenticated API persistence and explicit owned-company checks now exist.
- That improvement does not yet make the module production-ready because the rendered employer UI continues to operate local-first with demo fallbacks and mutable browser company context.
- This report uses the audit prompt's 2026 payroll/compliance rules as the expected baseline. Any deliberate legal-rule divergence should be documented with source law/versioning and regression fixtures before release.
