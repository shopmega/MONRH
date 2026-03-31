# Salarie.ma - Product Requirements Document (Mobile-First)

Version: 1.0  
Date: 2026-02-12  
Status: Draft for execution

## 1. Product Vision
Salarie.ma is a legal-financial platform for Moroccan employees (`salaries`) to understand labor rights, run transparent simulations, generate compliant documents, and track their employment status over time.

Positioning:
- Not legal advice
- Not a content blog
- A computation engine + legal document factory + structured legal knowledge base

## 2. Product Goals
- Make labor law understandable in plain French and Arabic
- Provide reliable, versioned calculations tied to legal effective dates
- Reduce friction to produce legally compliant documents
- Build user trust through traceable formulas and cited legal references

## 3. Primary Users
- Employees in Morocco (main audience)
- Job changers and workers in dispute situations
- HR/admin users (future B2B tier)

## 4. Mobile-First Product Principles
- Design for small screens first (360px width baseline)
- One calculator/document task per screen
- Progressive disclosure for legal detail
- Inputs minimized and grouped into short steps
- Sticky action CTA (`Simulate`, `Generate PDF`)
- Fast perceived performance (<2s initial content on 4G target)

## 5. Core Modules

### Module 1 - Calculators & Simulators (Core Engine)

#### 1. Salary & Contributions
- Net <-> Gross Salary Calculator
  - IR
  - CNSS employee/employer
  - AMO
  - CIMR (optional)
  - Family allowances
  - Professional expense deduction
- Employer Total Cost Calculator
- Annual Income Tax Simulator (monthly vs annualized, bonus, 13th salary)

#### 2. Employment Termination
- Licenciement indemnity (legal indemnity, notice, unused paid leave, abusive termination estimate)
- Demission financial outcome
- Fin de CDD (precarity premium when applicable, leave payout, notice)
- Rupture conventionnelle (future)
- Probation period termination

#### 3. Leave & Time
- Paid leave accrual
- Overtime (day/night/weekend/public holiday)
- Public holiday compensation
- Maternity leave
- Sick leave impact

#### 4. Social Protection
- CNSS pension estimator (basic)
- Work accident compensation estimator
- SMIG/SMAG compliance checker
- Seniority growth simulator

#### 5. Legal Scenarios
- Workplace harassment process guidance simulator
- Unpaid salary recovery estimator
- Unpaid overtime recovery calculator

### Module 2 - Document Generators
All generators must be:
- Auto-filled from user inputs
- Legally referenced
- PDF downloadable
- Versioned by law year

Core generators:
- Resignation letter
- Notice letter
- Employer complaint
- Overtime claim
- Salary recovery letter
- Contract renewal request
- Employment certificate request
- CNSS complaint
- Labor inspector complaint
- Work accident declaration
- Maternity leave request
- Unpaid leave request
- Harassment report letter
- Mutual termination proposal

Advanced:
- Legal dossier pack (timeline, legal references, required attachments checklist)

### Module 3 - Legal Library
- Structured by topic (hiring, contract type, hours, overtime, leave, maternity, termination, safety, disputes, CNSS, retirement)
- Each article includes:
  - Plain-language summary
  - Legal reference (article number)
  - Example
  - FAQ
  - Last update date
- Law Update Center with old vs new comparison
- Legal Timeline View by selected year

### Module 4 - Law Versioning System (Critical)
System must support historical accuracy:
- Rules are versioned with `effective_from` / `effective_to`
- Simulations use user-selected date or current date
- Past calculations remain reproducible after reforms

Core tables:
- `law_versions`
- `tax_brackets`
- `cnss_rates`
- `indemnity_rules`
- `leave_rules`
- `smig_history`
- `overtime_rules`

### Module 5 - Personal Dashboard (Authenticated)
- Current salary breakdown
- Estimated indemnity today
- Accrued leave estimate
- Seniority tracking
- SMIG compliance status
- Contribution history estimate

## 6. Monetization

### Free
- Basic calculators
- Limited simulations/month
- Legal articles access

### Premium (20-40 MAD / month)
- Unlimited simulations
- Full document generators
- Historical legal comparison
- Legal update alerts
- Dossier export
- Multi-scenario comparison

### B2B / HR (future)
- Bulk simulation
- Team dashboard
- Compliance audits
- Payroll projection

## 7. Compliance Guardrails
- Persistent disclaimer: informational only, not legal advice
- Cite legal source and update date on every calculator + article
- No court-outcome prediction
- Export includes legal version and timestamp

## 8. Functional Requirements (MVP)

### MVP In Scope (Phase 1)
- FR language first (AR UI labels prepared)
- 4 calculators:
  - Net <-> Gross
  - Licenciement indemnity
  - Paid leave accrual
  - SMIG compliance check
- 3 document generators:
  - Resignation letter
  - Salary recovery letter
  - Labor inspector complaint
- Legal library v1 (10 core articles)
- Law versioning foundation (current + one historical version)
- User dashboard v1 (saved simulations)

### Out of Scope (Phase 1)
- React Native app
- Advanced scenario tools
- B2B bulk features
- Full pension/work accident engines

## 9. Non-Functional Requirements
- Mobile performance: LCP < 2.5s on mid-tier device target
- Auditability: each result stores formula inputs + rule version id
- Security: Supabase RLS for user data isolation
- Availability target: 99.5%
- Localization: architecture supports FR/AR content and RTL

## 10. Information Architecture (Mobile)
- Home
- Calculators
- Documents
- Legal Library
- Dashboard
- Settings

Bottom navigation (mobile):
- Home | Simulate | Documents | Library | Account

## 11. Key User Flows

### Flow A: Quick Salary Simulation
1. User opens `Simulate`
2. Selects `Net <-> Gross`
3. Enters salary + assumptions
4. Gets breakdown with formula transparency
5. Saves result (optional account)

### Flow B: Termination Preparation
1. User opens `Simulate > Licenciement`
2. Inputs tenure, salary, unused leave, termination type/date
3. Reviews payout estimate + legal references
4. Generates selected document (e.g., complaint letter)

### Flow C: Law Change Awareness
1. User opens `Library > Law Updates`
2. Compares old/new rule
3. Re-runs prior simulation with new rule version

## 12. Calculation Engine Requirements
- Deterministic functions (same input + rule version = same output)
- Rule fetch by effective date
- Explanation payload with:
  - Input summary
  - Rule ids + version
  - Formula steps
  - Final outputs

Recommended implementation:
- Edge Functions (Supabase) for computation
- Shared typed calculation schemas (Zod/TypeScript)
- Test vectors per rule version

## 13. Data Model (Initial)

### Core Entities
- `users`
- `profiles`
- `simulations`
- `simulation_results`
- `documents`
- `legal_articles`
- `law_versions`
- Rule tables listed in module 4

### Simulation audit fields
- `executed_at`
- `calculator_type`
- `input_payload` (JSONB)
- `rule_snapshot` (JSONB)
- `version_id`
- `result_payload` (JSONB)

## 14. API Boundaries
- `POST /simulate/:type`
- `POST /documents/:type/generate`
- `GET /laws/versions`
- `GET /articles`
- `GET /articles/:slug`
- `GET /updates`

## 15. Analytics & KPIs
- Calculator completion rate
- Save/export conversion rate
- Free -> Premium conversion
- 30-day retention
- Most used calculators/documents
- Error rate per calculator type

## 16. Delivery Plan

### Phase 0 (2 weeks)
- Product architecture
- DB schema v1 with versioning
- Design system (mobile-first FR)

### Phase 1 (4-6 weeks)
- MVP calculators + documents + library v1
- Auth + dashboard basic save history
- PDF generation pipeline

### Phase 2 (4 weeks)
- AR localization + RTL UI
- Additional simulators
- Legal updates center

### Phase 3
- Premium paywall
- Alerts and multi-scenario comparison
- B2B beta

## 17. Risks & Mitigations
- Legal rule ambiguity -> legal review workflow + explicit assumptions in UI
- User trust risk -> show formula details and sources on every result
- Frequent law changes -> admin tooling for rule version management
- Over-scope -> strict phase gates and MVP boundaries

## 18. Immediate Build Backlog (Execution-Ready)
1. Initialize Next.js app router project with Supabase integration
2. Create schema + migrations for `law_versions` and first 4 rule tables
3. Build calculator engine interface and one implemented calculator end-to-end
4. Build reusable simulation form shell (mobile stepper)
5. Implement PDF service for resignation letter
6. Build legal article template + seed initial 10 FR articles
7. Add simulation logging/audit trail
8. Add unit tests for formulas and version selection
