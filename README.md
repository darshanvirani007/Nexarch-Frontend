# Nexarch

**Your Private Workspace**

Everything you are building, one clear view.

Nexarch brings your businesses, important links, learning, goals, tasks, job applications, and store updates into one private dashboard. It does not replace the services you already use. It gives you one place to find them and keep track of what matters.

- Live frontend: [www.nexarchapp.com](https://www.nexarchapp.com)
- Live Laravel API: [nexarch-api.onrender.com/api/v1](https://nexarch-api.onrender.com/api/v1)

> This repository contains the **frontend application**. The Laravel API is a separate project, and the main application data is stored in Supabase.

## Start here

There are three parts to the live application:

```text
Your browser
    |
    | 1. Sign in with Supabase Auth
    v
Nexarch frontend
    |
    | 2. Send the Supabase access token with API requests
    v
Laravel API on Render
    |
    | 3. Read or update only the signed-in user's records
    v
Supabase PostgreSQL database
```

In simple terms:

1. Supabase checks who the user is.
2. The frontend sends the user's login token to Laravel.
3. Laravel reads or writes that user's data in Supabase.
4. The frontend displays the result.

Changing only an environment variable does not create this flow automatically. The frontend code in `lib/api` and `components/app-store.tsx` performs the actual requests.

## What is working now

| Area | What it does | Where the data comes from |
| --- | --- | --- |
| Authentication | Email/password sign-up and sign-in, password reset, Google, and Apple | Supabase Auth |
| Profile and settings | Full name, email, country, contact number, and timezone | Laravel API + Supabase |
| My Links | Saves frequently used work, email, blog, YouTube, development, social, and other links | Laravel API + Supabase |
| Businesses | Creates, edits, archives, restores, reorders, and deletes businesses | Laravel API + Supabase |
| Business links | Website, inbox, admin, hosting, domain, analytics, and custom shortcuts | Laravel API + Supabase |
| Social accounts | Social profiles connected to a business | Laravel API + Supabase |
| Business notes | One private note for each business | Laravel API + Supabase |
| Website checks | Checks the configured website and stores its latest result | Laravel API + Supabase |
| Development key vault | Encrypts secret values in the browser before saving them | Encrypted browser-local storage |
| Learning | Courses, certifications, and books with simple completion status | Laravel API + Supabase |
| Goals | Measurable financial, professional, and business goals | Laravel API + Supabase |
| Tasks | Daily tasks, general tasks, and job applications | Laravel API + Supabase |
| Commerce | Demonstrates store summaries, alerts, and tracking UI | Demo data only |

Commerce is intentionally not connected to live store APIs or Supabase tables yet. Do not treat its sample values as real store data.

## Application pages

| Route | Purpose |
| --- | --- |
| `/login` | Sign in, open password recovery, or continue with Google/Apple |
| `/signup` | Create an account with email, full name, country, contact number, and password |
| `/reset-password` | Choose a new password after using the recovery email |
| `/dashboard` | Main personal overview |
| `/links` | Personal link directory |
| `/businesses` | Business directory |
| `/businesses/[businessId]` | One business workspace with links, socials, notes, checks, and keys |
| `/commerce` | Demo Commerce overview |
| `/commerce/alerts` | Demo Commerce alerts |
| `/commerce/stores` | Demo store list |
| `/learning` | Courses, certifications, and books |
| `/goals` | Measurable goals and completed goals |
| `/tasks` | Daily tasks, general tasks, and job applications |
| `/settings` | Account details, theme, density, and password settings |

## What you need before running the project

Install these tools:

1. **Git** — downloads the source code and tracks changes.
2. **Node.js 22.13 or newer** — runs the frontend.
3. **npm** — installed automatically with Node.js.

For real accounts and real saved data, you also need:

1. A Supabase project with the required tables and Row Level Security policies.
2. The Supabase project URL and publishable anonymous key.
3. A running Nexarch Laravel API connected to the same Supabase project.

You do **not** need Laravel just to preview the interface in demo mode.

## Run it locally

### 1. Open a terminal

On macOS, open **Terminal**. Then go to the project folder:

```bash
cd "/Users/darshanvirani/Desktop/nexarch"
```

If your project is stored somewhere else, replace the path with your own path.

### 2. Install the packages

```bash
npm install
```

You normally run this once after downloading the project, and again when `package.json` changes.

### 3. Create your private local environment file

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the example values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://nexarch-api.onrender.com/api/v1
```

What each line means:

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of the Supabase project used for authentication |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase's public/publishable browser key |
| `NEXT_PUBLIC_APP_URL` | The URL where this frontend is running |
| `NEXT_PUBLIC_API_URL` | The Laravel API that reads and writes application data |

`NEXT_PUBLIC_*` values are visible to browser code. Never put a database password, service-role key, JWT secret, Laravel `APP_KEY`, or private API token in one of these variables.

The real `.env.local` file is ignored by Git. Commit `.env.example` only, and keep it filled with placeholders rather than secrets.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

To stop the server, return to the terminal and press `Control + C`.

## Demo mode versus live mode

Nexarch chooses its data mode from the environment configuration.

### Demo mode

If the Supabase URL, Supabase publishable key, or API URL is missing:

- sign-in opens the interactive demo;
- businesses, learning, goals, and tasks use sample data;
- changes are useful for previewing the interface but should not be expected to survive like database records;
- Commerce continues to use demo data.

### Live mode

If Supabase and the API URL are configured:

- protected pages require a real Supabase session;
- the app loads the signed-in user's data from Laravel;
- create, edit, and delete actions are sent to Laravel;
- Laravel must validate the Supabase access token;
- every database row must belong to the authenticated user.

## Authentication setup in Supabase

In the Supabase dashboard, open **Authentication** and configure the following.

### Email and password

Enable the Email provider. Nexarch uses normal email/password authentication. Magic-link sign-in is not part of the current interface.

The sign-up page collects:

- email address;
- full name;
- country;
- contact number;
- password;
- password confirmation.

### Google

Enable Google, add the Google OAuth client ID and secret, and add Supabase's callback URL to the Google provider configuration.

### Apple

Enable Apple and configure its Services ID and secret. Add Supabase's callback URL to the Apple provider configuration.

### Redirect URLs

Add these URLs to Supabase's allowed redirect URLs:

```text
http://localhost:3000/**
https://www.nexarchapp.com/**
```

Password recovery and OAuth return through `/auth/callback`.

## How frontend API requests work

The browser does not call Render directly. It calls the local frontend proxy:

```text
/api/nexarch/...
```

The proxy then forwards the request to:

```text
NEXT_PUBLIC_API_URL
```

For example:

```text
Browser request:
/api/nexarch/businesses

Forwarded request:
https://nexarch-api.onrender.com/api/v1/businesses
```

This design keeps API routing consistent and avoids ordinary browser CORS problems. The Supabase access token is added as:

```http
Authorization: Bearer <current-user-access-token>
```

Do not log, copy into documentation, or commit a real access token.

The main frontend endpoints are:

```text
GET/POST/PATCH/DELETE  /businesses
GET                    /businesses/{businessId}
POST/PUT/DELETE        /businesses/{businessId}/links
POST/PUT/DELETE        /businesses/{businessId}/social-links
PUT                    /businesses/{businessId}/note
POST                   /businesses/{businessId}/website-checks
GET/POST/PATCH/DELETE  /links
GET/POST/PATCH/DELETE  /learning
GET/POST/PATCH/DELETE  /goals
GET/POST/PATCH/DELETE  /daily-tasks
GET/POST/PATCH/DELETE  /tasks
GET/POST/PATCH/DELETE  /job-applications
GET/PUT                /profile
```

## Supabase tables currently expected

The Laravel API expects the following application tables. Commerce tables are not required yet.

| Table | Purpose | Ownership rule |
| --- | --- | --- |
| `profiles` | Account name, country, contact number, and timezone | `id = auth.uid()` |
| `my_links` | Personal shortcuts | `user_id = auth.uid()` |
| `businesses` | Main business records | `user_id = auth.uid()` |
| `business_links` | Operational links for a business | User owns both the link and parent business |
| `business_social_links` | Social profiles for a business | User owns both the social link and parent business |
| `business_notes` | One note per business | User owns both the note and parent business |
| `website_checks` | Website status history | User owns both the check and parent business |
| `business_development_keys` | Existing Supabase metadata table; the current frontend key vault does not read from it | User owns both the record and parent business |
| `learning` | Courses, certifications, and books | `user_id = auth.uid()` |
| `goals` | Measurable goals | `user_id = auth.uid()` |
| `daily_tasks` | Tasks tied to a date | `user_id = auth.uid()` |
| `tasks` | General tasks | `user_id = auth.uid()` |
| `job_applications` | Job name, link, and application status | `user_id = auth.uid()` |

Row Level Security must stay enabled. A signed-in user must never be able to read or change another user's rows.

### Important ownership detail

If a record exists in Supabase but does not appear in Nexarch, compare its owner with the signed-in user:

```text
Most tables: row.user_id must equal auth.uid()
Profiles:     row.id must equal auth.uid()
```

Rows inserted manually with a missing or different user ID are intentionally hidden.

## Business creation and child records

A business and its links are stored separately. Creating a complete business therefore happens in this order:

1. Create the `businesses` row.
2. Read the new business ID returned by Laravel.
3. Create the populated business links using that ID.
4. Create the populated social links using that ID.
5. Save the note when it is not empty.
6. Fetch the complete business again.

This is why the first `POST /businesses` response contains only the main business fields. Website, email, hosting, domain, admin, custom, and social links appear in their own tables and nested endpoints.

## Development key vault

The key vault behaves differently from the rest of the application:

1. The user chooses a vault password.
2. The browser derives an encryption key using PBKDF2.
3. Secret values are encrypted in the browser with AES-GCM.
4. Only ciphertext, salt, and IV are written to browser storage.
5. The password is not saved or sent to the server.

The encrypted vault is stored only in the current browser. The application cannot recover a forgotten vault password because it never stores that password. Clearing browser storage removes the encrypted vault, and the vault does not automatically follow the user to another browser or device.

Do not put production secrets in demo data, source files, screenshots, logs, or `.env.example`.

## Important project folders

```text
app/                     Pages, layouts, auth callback, and frontend API routes
app/(app)/               Signed-in application pages
components/              Shared interface and feature components
components/app-store.tsx Frontend data loading and persistence coordinator
lib/api/                 API client, data mappers, and business persistence helpers
lib/supabase/            Supabase browser client
lib/demo-data.ts         Non-Commerce demo content
lib/commerce.ts          Demo Commerce data and types
lib/validations.ts       Zod form validation rules
tests/                   Vitest test suite
public/                  Nexarch mark and social-preview image
```

Files you will commonly edit:

- `app/(app)/**/page.tsx` for page-specific UI;
- `components/app-shell.tsx` for the shared navigation shell;
- `components/app-store.tsx` for frontend persistence behavior;
- `lib/api/client.ts` for shared API requests;
- `lib/api/mappers.ts` for frontend-to-database value mapping;
- `lib/validations.ts` for form rules;
- `app/globals.css` for shared styles and motion.

## Available commands

Run these from the project folder:

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the local development website |
| `npm run build` | Creates a production build |
| `npm run start` | Starts the built application locally |
| `npm run lint` | Checks code style and common React/Next.js problems |
| `npm run typecheck` | Checks TypeScript without creating files |
| `npm test` | Runs the Vitest test suite once |

## Check your work before publishing

Run all four checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not publish if any command fails. Fix the error, run the failed command again, and then repeat the complete set.

The current tests cover API URL safety, API data mapping, business child-record persistence, domain calculations, validation, task filtering, and related application logic.

## Publishing the frontend

This project is deployed on Vercel as a standard Next.js application. Import the GitHub repository, keep the Framework Preset set to **Next.js**, and leave the Output Directory empty so Vercel uses `.next` automatically.

Add these variables in **Vercel → Project Settings → Environment Variables** for Production and Preview:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
NEXT_PUBLIC_APP_URL=https://www.nexarchapp.com
NEXT_PUBLIC_API_URL=https://nexarch-api.onrender.com/api/v1
```

Redeploy after adding or changing environment variables. Also add the Vercel URL to the Supabase Authentication allowed redirect URLs. Updating local `.env.local` does not update the deployed website.

## Common problems

### The loader stays visible for a while

The Laravel API is hosted on Render's free service. A sleeping service may need about a minute to wake up. Nexarch first checks the API, waits for the Vercel proxy, and automatically retries failed read-only requests once. Write requests are never retried automatically, preventing duplicate records. If the problem continues after the automatic retry, check the Render service logs.

### “Failed to fetch”

Check all of these:

1. `NEXT_PUBLIC_API_URL` exists in the deployed frontend environment.
2. The Render API is awake and reachable.
3. The page is making requests to `/api/nexarch/...` in browser DevTools.
4. The frontend deployment includes the latest code.
5. The frontend and API are both using HTTPS in production.

### `401 Unauthenticated`

The user session is missing, expired, or the request did not include the Supabase access token.

Sign out and sign in again. In browser DevTools, confirm that the request goes through `/api/nexarch/...`. Never share the token shown in request headers.

### The API returns data, but the screen is empty

Check whether the database row belongs to the current Supabase user. Also confirm the API response uses the field names expected by `lib/api/mappers.ts`.

### Error code `23514`

PostgreSQL rejected a value because it violated a check constraint. This usually means a form value and database-allowed value use different spelling or casing.

Check the outgoing request payload in browser DevTools, then compare values with:

- the Supabase table constraint;
- Laravel validation;
- the mapper in `lib/api/mappers.ts`.

Fix the mapping rather than disabling the database constraint.

### A business was created, but its links are missing

The main business row and child links are separate requests. In browser DevTools, confirm that the business request is followed by requests to:

```text
/businesses/{businessId}/links
/businesses/{businessId}/social-links
/businesses/{businessId}/note
```

Empty URLs are intentionally not sent.

### Data disappears after refresh

The UI may be running in demo mode, a save request may have failed, or the row may belong to a different user. Check DevTools **Network**, look for a successful API request, and then inspect the matching Supabase row.

### The key vault is empty on another browser or device

The encrypted Development Key Vault is intentionally stored in the browser where it was created. It does not sync between browsers or devices. Clearing site data also removes that browser's encrypted vault.

### Google or Apple returns to the login page

Check the provider configuration, Supabase callback URL, and allowed redirect URLs. The production and local frontend URLs must both be allowed.

## Security rules

- Never commit `.env.local`.
- Never expose a Supabase service-role key to the browser.
- Never put database passwords, JWT secrets, OAuth client secrets, or Laravel keys in `NEXT_PUBLIC_*` variables.
- Never store email, social-media, or website-admin passwords in Nexarch.
- Keep Supabase Row Level Security enabled.
- Use `target="_blank"` with `rel="noopener noreferrer"` for external links.
- Validate all stored URLs and accept only `http://` or `https://` URLs.
- Do not weaken a database constraint just to hide a frontend mapping error.
- Rotate any secret immediately if it is pasted into source code, Git history, screenshots, or a public chat.

## Current technical stack

- Next.js App Router
- React and TypeScript in strict mode
- Tailwind CSS
- Radix/shadcn-style reusable components
- Lucide and React Icons
- React Hook Form and Zod
- Supabase Auth
- Laravel read/write API
- Supabase PostgreSQL
- Vitest
- Vercel hosting with the standard Next.js runtime

## Safe next steps

The current frontend is ready for normal work on My Links, Businesses, Learning, Goals, Tasks, Settings, and authentication.

Commerce should remain demo-only until its database design, official store authorisation flows, read-only permissions, token encryption, and synchronisation system are intentionally implemented and tested.

When changing the project, prefer small focused changes, preserve the existing visual system, run all checks, and verify the live database behavior after deployment.
