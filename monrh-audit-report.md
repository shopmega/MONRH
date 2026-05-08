# MONRH JURISCONSULT — Comprehensive Audit Report

**URL:** [monrh.vercel.app](https://monrh.vercel.app)  
**Date:** April 25, 2026  
**Scope:** Tool accuracy, missing inputs, output quality, missing tools, improvement opportunities

---

## Executive Summary

MONRH JURISCONSULT is a Moroccan HR and labor law web application offering 20+ simulators, 17 planning tools, 7 protection tools, and document templates. The app covers salary calculation, contract management, dispute resolution, and social security (CNSS) topics. While the breadth of tools is impressive, the audit reveals **critical functional issues** — most notably, the "Simuler" (Simulate) button fails to produce results on multiple tools, and key legal parameters required by Moroccan tax and labor law are missing from several calculators. Below is a detailed breakdown of findings.

---

## 1. Tool Accuracy

### 1.1 CRITICAL — Simulate Button Non-Functional

| Tool | Behavior |
|------|----------|
| **Net <-> Brut** | Button remains **disabled** at 67% completion even after filling the only visible required field (Montant MAD). A hidden third parameter appears to block calculation. |
| **Coût Total Employeur** | Button is **enabled** but clicking "Simuler" with valid data (10,000 MAD salary, 1,000 MAD benefits, 12 months) produces **no results, no loading indicator, and no error message**. |
| **IR Annuel** | Same behavior as above — button appears functional but yields no visible output upon click. |
| **Durée de Préavis** | Button is **permanently disabled** with no indication of what additional information is needed. |

**Impact:** Users cannot verify any calculation, making the core value proposition of the app unusable without authentication. The tools that do function likely require a login session that was not available during this audit.

### 1.2 CRITICAL — IR Calculation Missing Family Situation

Moroccan income tax (IR) is calculated using brackets that vary by **family situation** (situation familiale) and **number of dependents** (personnes à charge):

- Célibataire (single): base brackets
- Marié(e) (married): doubled deduction ceiling of 30,000 MAD
- Enfants à charge: additional 3,600 MAD per child (max 6 children)

The **IR Annuel** tool only asks for:
- Salaire mensuel (MAD)
- Mois rémunérés
- Bonus annuel (MAD)
- Checkbox (unclear purpose)

**Missing:**
- Situation familiale (célibataire / marié / divorcé)
- Nombre de personnes à charge
- Deductions (interest on mortgage, donations to approved organizations)

**Without these fields, any IR calculation will be inaccurate for most Moroccan taxpayers.**

### 1.3 HIGH — Heures Supplémentaires Missing Work Schedule

Moroccan overtime rates depend on whether the employee works a **5-day** or **6-day** week:

| Schedule | First 8 hours | Beyond 8 hours | Night (10pm–6am) | Weekend/Holiday |
|----------|:---:|:---:|:---:|:---:|
| 6 days/week | +25% | +50% | +25% additional | +50% |
| 5 days/week | +25% | +50% | +25% additional | +100% |

The tool asks only for salary and hours in 4 categories (day, night, weekend, holiday) but **does not ask for the number of working days per week**, making the rate selection ambiguous.

**Also missing:**
- Employee category (Cadre / Employé / Ouvrier) — affects the base hourly rate (divide monthly by 228h for Cadre vs 191h for others)

### 1.4 MEDIUM — Indemnité Licenciement Unclear Inputs

The tool has two dropdown fields labeled only "Select..." with no visible labels or hints. It also includes both manual dropdown selectors and a full date picker, creating redundancy. The purpose of these inputs (likely seniority years and months) should be clarified.

### 1.5 MEDIUM — All Form Inputs Have No Names or IDs

Every input field across all tools has empty `name=""`, `id=""` attributes. This is a code quality issue that affects form submission, accessibility, and debugging.

---

## 2. Missing Necessary Input Fields

### 2.1 Net <-> Brut Calculator

| Missing Field | Importance | Reason |
|---------------|:----------:|--------|
| Situation familiale | **CRITICAL** | Directly affects IR brackets and deductions |
| Nombre de personnes à charge | **CRITICAL** | 3,600 MAD per dependent deduction |
| Frais professionnels (20% standard) | **HIGH** | Standard deduction applied before IR |
| Allocations familiales indication | **MEDIUM** | Affects net salary comparison |
| Régime CNSS (AMO/Retraite) | **MEDIUM** | Different contribution rates may apply |

### 2.2 IR Annuel Calculator

| Missing Field | Importance | Reason |
|---------------|:----------:|--------|
| Situation familiale | **CRITICAL** | Changes deduction ceilings and effective rate |
| Nombre de personnes à charge | **CRITICAL** | Additional deductions per dependent |
| Déductions diverses | **HIGH** | Mortgage interest, life insurance, retirement savings |
| Revenu brut global | **MEDIUM** | Should include all income sources for total IR |

### 2.3 Heures Supplémentaires

| Missing Field | Importance | Reason |
|---------------|:----------:|--------|
| Jours de travail par semaine (5/6) | **CRITICAL** | Determines overtime rate tiers |
| Catégorie professionnelle | **HIGH** | Affects base hourly rate denominator |
| Taux horaire de base | **MEDIUM** | Should be computed or displayed for verification |

### 2.4 Projection Pension CNSS

| Missing Field | Importance | Reason |
|---------------|:----------:|--------|
| Sexe (Genre) | **CRITICAL** | Legal retirement age is 62 (men) vs 60 (women) |
| Date de naissance | **HIGH** | Required to compute actual retirement eligibility |
| Durée minimale de cotisation | **MEDIUM** | 3,240 days required for full pension |

### 2.5 Congé Maternité

| Missing Field | Importance | Reason |
|---------------|:----------:|--------|
| Checkbox labels are invisible | **HIGH** | 3 checkboxes with no visible text — likely for hospitalization, complications, and multiple births |
| Nombre d'enfants attendus | **MEDIUM** | Affects prenatal leave duration |

### 2.6 Indemnité Licenciement

| Missing Field | Importance | Reason |
|---------------|:----------:|--------|
| Motif de licenciement | **HIGH** | Fault (faute lourde) vs economic dismissal changes indemnity |
| Date de dernière augmentation | **MEDIUM** | Needed for computing average reference salary |

### 2.7 Durée de Préavis

| Missing Field | Importance | Reason |
|---------------|:----------:|--------|
| Ancienneté (seniority) | **CRITICAL** | Preavis duration is directly linked to years of service (per Article 51 CT) |
| Simuler button permanently disabled | **CRITICAL** | Tool is completely non-functional |

---

## 3. Output Quality

### 3.1 No Results Visible

As detailed in Section 1.1, the majority of tools tested did **not produce any output** when the Simulate button was clicked. This prevents verification of:

- Mathematical accuracy of CNSS contributions (6.29% salarie + 13.47% employeur)
- IR bracket application and deduction calculations
- Overtime rate multipliers
- Leave balance computations
- Pension projection formulas

### 3.2 No Loading State

There is no loading spinner, progress indicator, or placeholder text during calculation. Users receive no feedback that their request is being processed, leading to confusion about whether the tool is working.

### 3.3 No Error Messages

When simulation fails (due to auth, validation, or other issues), no error or guidance message is shown. The form simply remains unchanged with no explanation.

### 3.4 No Result History (Without Auth)

The sidebar shows "Aucune simulation enregistrée" (No simulation recorded) for all tools. While this is expected for unauthenticated users, it means there is no way to compare or verify results even temporarily.

### 3.5 No Export/Print Option

Even if results were displayed, there is no apparent option to export results as PDF, print them, or copy them. For a legal/HR tool, documentable output is essential.

---

## 4. Missing Tools

Based on Moroccan labor law (Code du Travail, Code Général des Impôts, CNSS regulations), the following tools would strengthen the platform:

### 4.1 HIGH Priority

| Missing Tool | Description |
|--------------|-------------|
| **Allocations Familiales Calculator** | CNSS family allowances (200 MAD per child, 36 MAD per child for 3rd to 6th child) |
| **Indemnité de Préavis Non Respecté** | Calculate compensation when employer or employee fails to respect notice period |
| **Générateur de Mise en Demeure** | Legal demand letter generator for unpaid wages, based on Article 13 Dahir des Obligations |
| **Calculateur Droit au Logement** | Housing deduction simulator for IR (deductible up to 10% of income) |
| **Indemnité de Chômage CNSS** | New unemployment benefit calculator (70% of reference salary, max 4 months) |

### 4.2 MEDIUM Priority

| Missing Tool | Description |
|--------------|-------------|
| **Comparateur Salaire Régional** | Compare salaries across Moroccan regions/cities |
| **Simulateur Épargne Retraite (CIMR)** | Dedicated CIMR retirement savings projection |
| **Calculateur Frais de Formation** | Training deduction simulator (employer obligation) |
| **Checklist Embauche** | New hire onboarding checklist (documents, CNSS registration, medical visit) |
| **Simulateur Télétravail** | Remote work rights and allowance simulator |
| **Calculateur Days Off / RTT** | Rest day and compensatory leave calculator |

### 4.3 LOW Priority

| Missing Tool | Description |
|--------------|-------------|
| **Outil Comparatif SMIG Régional** | Regional minimum wage variations |
| **Simulateur Indemnité de Transfert** | Relocation compensation calculator |
| **Calculateur Solde de Congé Annuel** | Annual leave balance tracker with carry-over |

---

## 5. Improvement Opportunities

### 5.1 CRITICAL Fixes

#### 5.1.1 Fix Simulate Button Functionality
The most impactful issue. Multiple tools have non-functional calculation buttons. This should be the top priority — either:
- (a) Allow calculations without authentication, or
- (b) Clearly display a "Connectez-vous pour utiliser cet outil" (Log in to use this tool) message before showing the form

#### 5.1.2 Add Missing IR Parameters
Add **Situation familiale** and **Nombre de personnes à charge** to the Net/Brut calculator and IR Annuel tool. These are legally required for accurate Moroccan IR computation.

#### 5.1.3 Fix Authentication Wall Transparency
Currently, some tools show "Cet outil est réservé aux utilisateurs connectés" while others silently fail. Standardize the behavior across all tools.

### 5.2 UX/UI Improvements

#### 5.2.1 Invisible Checkbox Labels
Multiple tools (Congé Maternité, Arrêt Maladie, Accident du Travail) have checkboxes with **no visible text labels**. Users cannot know what they're agreeing to. This appears to be a CSS/styling bug where label text is hidden or has zero opacity.

#### 5.2.2 Unclear Dropdown Fields
The Indemnité Licenciement tool has dropdown selectors showing only "Select..." as placeholder with no label or tooltip explaining what data they require.

#### 5.2.3 Sidebar Navigation
Clicking sidebar links in the simulator section does not always navigate to the correct tool. The navigation appears broken — clicking "Heures Supplémentaires" or "Congés Acquis" in the sidebar keeps showing the previous tool's page. Only direct URL navigation works reliably.

#### 5.2.4 Date Picker Defaults
Date pickers on tools like Indemnité Licenciement and Scénario Démission default to Month=0, Day=0, Year=0. These should either be blank with a placeholder or default to today's date.

#### 5.2.5 AdSense Integration Warnings
The console logs repeated warnings: "AdSense head tag doesn't support data-nscript attribute." This should be resolved to clean up the technical stack.

### 5.3 Content & Structural Improvements

#### 5.3.1 Input Validation and Help Text
No tool provides:
- Input range validation (e.g., "Enter salary between 0 and 999,999 MAD")
- Tooltips or help icons explaining each field
- Example values or placeholders (e.g., "e.g., 7,000")
- Real-time format feedback (thousand separators)

#### 5.3.2 Form Input Attributes
All inputs have empty `name` and `id` attributes. This should be fixed for:
- Accessibility (screen readers need associated labels)
- Form submission debugging
- Analytics tracking

#### 5.3.3 Result Presentation
When results do appear (for authenticated users), they should include:
- Detailed breakdown of each calculation step
- Legal references (article numbers from Code du Travail)
- Export to PDF/print capability
- "Share this result" functionality

#### 5.3.4 Breadcrumb Navigation
Tool pages only show a "Retour aux Simulateurs" link. A proper breadcrumb trail would help users understand their location within the hierarchy (Accueil > Simulateurs > Salaire > Net/Brut).

### 5.4 Technical Improvements

| Issue | Recommendation |
|-------|----------------|
| No loading state on simulate | Add skeleton/progress indicator during calculation |
| No error handling | Show inline error messages for validation failures |
| Silent auth requirement | Either gate all tools behind login or allow guest mode with limited features |
| Console warnings (AdSense) | Fix `data-nscript` attribute handling for AdSense tags |
| Empty form attributes | Add meaningful `name`, `id`, and `aria-label` to all inputs |
| No network error handling | Show user-friendly error if calculation API fails |

### 5.5 SEO and Discoverability

| Opportunity | Details |
|-------------|---------|
| Meta descriptions | Some pages have generic titles like "MON RH" — add descriptive meta tags |
| URL structure | Good — uses clean URLs like `/simulateurs/brut-net` |
| French/Arabic support | Consider adding Arabic language option for broader Moroccan audience |
| Structured data | Add Schema.org markup for calculators to improve search visibility |

---

## 6. Inventory of All Tools Discovered

### Simulateurs (20 tools)

| # | Tool | URL Path | Category |
|---|------|----------|----------|
| 1 | Net <-> Brut | `/simulateurs/brut-net` | Salary & Contributions |
| 2 | Coût Total Employeur | `/simulateurs/cout-employeur-total` | Salary & Contributions |
| 3 | IR Annuel | `/simulateurs/ir-annuel` | Salary & Contributions |
| 4 | Indemnité Licenciement | `/simulateurs/licenciement` | Contract Termination |
| 5 | Scénario Démission | `/simulateurs/demission` | Contract Termination |
| 6 | Durée de Préavis | `/simulateurs/duree-preavis` | Contract Termination |
| 7 | Fin de CDD | `/simulateurs/fin-cdd` | Contract Termination |
| 8 | Rupture en Période d'Essai | `/simulateurs/rupture-periode-essai` | Contract Termination |
| 9 | Croissance Ancienneté | `/simulateurs/progression-anciennete` | Contract Termination |
| 10 | Congés Acquis | `/simulateurs/acquisition-conges` | Time & Leave |
| 11 | Heures Supplémentaires | `/simulateurs/heures-supplementaires` | Time & Leave |
| 12 | Travail Jour Férié | `/simulateurs/compensation-jours-feries` | Time & Leave |
| 13 | Congé Maternité | `/simulateurs/conge-maternite` | Time & Leave |
| 14 | Arrêt Maladie | `/simulateurs/conge-maladie` | Time & Leave |
| 15 | Projection Pension CNSS | `/simulateurs/pension-cnss` | Time & Leave |
| 16 | Accident du Travail | `/simulateurs/accident-travail` | Time & Leave |
| 17 | Conformité SMIG / SMAG | `/simulateurs/conformite-smig` | Time & Leave |
| 18 | Scénario Harcèlement | `/simulateurs/scenario-harcelement` | Disputes |
| 19 | Recouvrement Salaire Impayé | `/simulateurs/recouvrement-salaire-impaye` | Disputes |
| 20 | Recouvrement Heures Sup | `/simulateurs/recouvrement-heures-supplementaires` | Disputes |

### Planification (17 tools)

| # | Tool | Category |
|---|------|----------|
| 1 | Comparaison de Scénarios | Career |
| 2 | Augmentation Salaire | Career |
| 3 | Simulation Prime / Bonus | Salary |
| 4 | IGR Détail (Mensuel + Annuel) | Tax |
| 5 | Avantages en Nature | Salary |
| 6 | Scénario Promotion | Career |
| 7 | Freelance vs Salarié | Status |
| 8 | Capacité Crédit (Prêt) | Finance |
| 9 | Indemnité Chômage CNSS | Social Security |
| 10 | Retraite Avancée CNSS | Social Security |
| 11 | Bulletin de Paie | Payroll |
| 12 | Masse Salariale (RH) | HR Management |
| 13 | Coût de Recrutement | HR Management |
| 14 | Optimisation Rémunération | Salary |
| 15 | Auto-Entrepreneur | Status |
| 16 | Tarification Freelance (TJM) | Status |
| 17 | Bénéfice Net (Charges vs Profit) | Finance |

### Outils Protection (7 tools)

| # | Tool |
|---|------|
| 1 | Détecteur Fiche de Paie |
| 2 | Alerte Retard Salaire |
| 3 | Score de Conformité |
| 4 | Audit Solde de Tout Compte |
| 5 | Feuille Route Pré-Contentieux |
| 6 | *2 additional tools (not fully inspected)* |

### Documents & Templates

- Générateur de Contrats (CDI/CDD)
- Modèles de Lettres (Départ, Réclamations, Congés, CNSS)
- 12 template categories

---

## 7. Priority Action Items

| Priority | Action Item | Effort |
|:--------:|-------------|:------:|
| **P0** | Fix Simulate button to produce results (auth or no-auth path) | High |
| **P0** | Add Situation familiale + Personnes à charge to IR/Brut-Net tools | Low |
| **P0** | Fix invisible checkbox labels across multiple tools | Low |
| **P1** | Add Jours de travail/semaine to Heures Sup tool | Low |
| **P1** | Add Sexe to Pension CNSS tool | Low |
| **P1** | Standardize auth gate behavior across all tools | Medium |
| **P1** | Fix sidebar navigation (broken link-click routing) | Medium |
| **P2** | Add loading states, error messages, and validation feedback | Medium |
| **P2** | Add Allocations Familiales calculator | Medium |
| **P2** | Add Indemnité de Chémage CNSS tool | Medium |
| **P2** | Add result export (PDF/print) functionality | Medium |
| **P3** | Add Arabic language support | High |
| **P3** | Add breadcrumbs, tooltips, and input examples | Low |
| **P3** | Fix AdSense `data-nscript` console warnings | Low |
| **P3** | Add meaningful `name`/`id`/`aria-label` to all form inputs | Low |
