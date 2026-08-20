# Nexarch

Nexarch is a private workspace for businesses, links, learning, goals, tasks, job applications, and related operational information.

## Architecture

```text
Browser
  ├─ Supabase Auth
  ├─ RLS-protected application CRUD ──> Supabase PostgreSQL
  └─ protected website checks ─────────> Next.js on Vercel ──> Supabase
```

The active application no longer depends on the Laravel/Render service. The Laravel backend remains a separate Git repository and may be archived as migration history; its files and Git history are not combined with this repository.

Commerce pages currently use demonstration data and are not connected to live commerce providers.

## Requirements

- Node.js 22.13 or newer
- npm
- A Supabase project with all files in `supabase/migrations` applied in filename order

## Environment

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PRIVACY_CONTROLLER_NAME=Your legal business name
NEXT_PUBLIC_PRIVACY_EMAIL=nexarchapp@outlook.com
NEXT_PUBLIC_PRIVACY_ADDRESS=Your registered business address
```

`NEXT_PUBLIC_*` values are visible to browser code. Never put database passwords, service-role keys, JWT secrets, OAuth secrets, or other private credentials in them.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run typecheck
npm test
npm run lint
npm run build -- --webpack
```

Webpack is a reliable build fallback when Turbopack persistence has problems on an external drive.

## Supabase

Apply migrations through the Supabase SQL Editor in filename order. The final Render-retirement migration creates an authenticated `delete_business` function that verifies ownership and atomically removes related records and legacy pgVault secrets.

Never weaken Row Level Security to solve a frontend error. Confirm every selected, inserted, updated, and deleted row belongs to the authenticated user.

## Authentication, privacy, and security

- Authentication, password recovery, OAuth, profiles, themes, and workspace data use Supabase directly.
- The Privacy Policy is available at `/privacy` and linked during signup.
- Users can export their data and permanently delete their account from Settings.
- Business deletion calls the ownership-protected Supabase function.
- Website checks run through an authenticated Next.js route with DNS/private-network protections and persist results under RLS.
- The development-key vault is encrypted and stored locally in the browser.
- Optional analytics and advertising trackers are not enabled.
- Review `docs/gdpr-production-checklist.md` before production releases.

## Deployment checklist

After applying new migrations and deploying to Vercel, test with a disposable account:

1. Signup, verification, login, logout, and password recovery.
2. Profile, country, phone, timezone, and theme persistence.
3. Create, edit, refresh, and delete for every workspace feature.
4. Persistent website checks.
5. Business deletion, data export, and permanent account deletion.

Once those checks pass, remove `NEXT_PUBLIC_API_URL` from Vercel and suspend the Render service. Keep the Laravel repository archived for rollback/history until the chosen retention window ends.

## Repository map

```text
app/                     Next.js pages and protected server routes
components/              UI and application state
lib/supabase/            Direct authenticated Supabase services
lib/api/                 Database mappers and shared persistence helpers
supabase/migrations/     Production database migrations
tests/                   Vitest unit and security tests
docs/                    Migration audit and privacy documentation
```
