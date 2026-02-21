# Leveraging Reviewly in Salarie.ma (Roadmap)

Reviewly (Business Reviews) and Salarie.ma (Employee Rights) have a natural synergy. This document outlines how to bridge the two apps to maximize user value and engagement.

## 1. Contextual Integration (Phase 1 - Started)
*   **Conflict/Litigation Context**: When a user calculates an "Indemnité de Licenciement" or "Salaires Impayés", we show a CTA to Reviewly: *"Share your experience to help others prevent this."*
*   **Career Transition Context**: When a user generates a "Lettre de Démission", we show a CTA to Reviewly: *"Check the reputation of your next employer."*

## 2. Shared Data / API (Phase 2)
*   **Company Search Autocomplete**: In document forms (Resignation, Complaint), replace the text input for `company_name` with a searchable dropdown fetching data from Reviewly's API.
*   **Employer Verification**: Use Salarie.ma's document generation (with user consent) as a way to "Verify" reviews on Reviewly (i.e., "Verified Employee").

## 3. Product Features (Phase 3)
*   **Salary Benchmarking**: If Reviewly collects salary data in reviews, display market salary ranges directly in the Salarie.ma "Net <-> Brut" simulator.
*   **Employer Rating Widget**: Display a small "Reviewly Score" (e.g., 4.2/5 stars) next to company names in the user's dashboard simulation history.

## 4. Business Synergy
*   **Joint Premium Tier**: Offer a bundle: "Premium Salarie.ma + Enhanced Reviewly Profile" for HR/B2B users.
*   **Cross-Authentication**: Enable Supabase "Single Sign-On" or shared sessions between both domains (`salarie.ma` and `reviewly-ma.vercel.app`).

## Immediate Next Steps
1.  [x] Create `ReviewlyPromoCard` component.
2.  [x] Integrate promo into Simulation Results.
3.  [x] Integrate promo into Documents Library.
4.  [ ] Setup a shared API endpoint for Company Autocomplete.
