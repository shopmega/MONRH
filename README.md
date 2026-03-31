# Salarie.ma MVP Bootstrap

Mobile-first foundation for the Moroccan employee rights and simulation platform.

## Stack

- Next.js (App Router + TypeScript)
- Supabase (schema + migration scaffolding)
- Tailwind CSS
- Vitest

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
copy .env.example .env.local
```

3. Optional AdSense env:

```env
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-your-client-id
```

4. Optional Google Analytics (GA4) env:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

5. Required secure env for production:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

6. Run the app:

```bash
npm run dev
```

## Included Modules

- Home page with:
  - features
  - categories
  - featured articles
  - ad slots
- Simulation module:
  - `/simulate`
  - `/simulate/net-gross`
  - `/simulate/licenciement`
  - `/simulate/leave-accrual`
  - `/simulate/smig-compliance`
  - `/simulate/overtime`
  - API: `POST /api/simulate/net-gross`
  - API: `POST /api/simulate/licenciement`
  - API: `POST /api/simulate/leave-accrual`
  - API: `POST /api/simulate/smig-compliance`
  - API: `POST /api/simulate/overtime`
  - Save API: `GET/POST /api/simulations`
- Documents module:
  - `/documents`
  - `/documents/[id]`
  - API templates: `GET /api/documents/templates`
  - Save API: `GET/POST /api/documents/generated`
- Legal library:
  - `/bibliotheque`
  - `/bibliotheque/[category]`
  - `/articles/[slug]`
  - APIs: `GET /api/categories`, `GET /api/articles`, `GET /api/articles/[slug]`
- Account dashboard:
  - `/compte` (shows recent saved simulations/documents)

## Auth (Supabase)

- Email/password sign in and sign up via `/login`
- LinkedIn OAuth via Supabase provider `linkedin_oidc` (Google not configured)
- Password reset flow:
  - `/forgot-password`
  - `/auth/callback`
  - `/reset-password`

Supabase dashboard requirements:

- `Authentication > Providers`: enable `Email` and `LinkedIn (OIDC)`.
- `Authentication > URL Configuration`:
  - add site URL (example `http://localhost:3000`)
  - add redirect URL: `http://localhost:3000/auth/callback`

Admin requirements:

- Add admin users in `public.admin_users` table (created by migrations):
  - `user_id` = Supabase auth user id
  - `role` = `admin`
  - `enabled` = `true`

## Data Persistence (Supabase)

App data is persisted in Supabase tables created by migrations, including:

- `public.user_simulations`
- `public.user_documents`
- `public.user_violation_logs`
- `public.user_overtime_logs`
- `public.articles`
- `public.document_templates`

## Commands

```bash
npm run dev
npm run lint
npm run test
npm run build
```
