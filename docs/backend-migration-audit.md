# Nexarch backend migration audit

Audit date: 2026-08-20. This document is based on the checked-out `nexarch` Next.js frontend, the sibling Laravel backend, and the supplied production table/RLS inventory. The backend repository does not contain the production schema migrations, so foreign keys, indexes, defaults, check constraints, and whether RLS is enabled cannot be proven from source alone. They must be verified against Supabase before retirement.

## 1. Current architecture

Nexarch is a Next.js 16/React 19 TypeScript application. Supabase Auth runs directly in the browser through `@supabase/ssr`; the Next.js proxy verifies sessions for routing. Application data currently travels browser -> `/api/nexarch` Next.js proxy -> Render Laravel 12/PHP 8.3 -> Supabase PostgreSQL over Supavisor port 6543. Laravel validates the bearer token by calling Supabase Auth `/auth/v1/user` on every protected request, then scopes Eloquent queries with `user_id`.

The application store owns most client state and performs optimistic, serialized CRUD. On startup it first calls Laravel health, loads eight collections in parallel, then fetches every business again for details. The browser also has a separate Next route for ad-hoc website checks. Development keys shown by the current UI do **not** call Laravel: they are AES-GCM encrypted with a user-entered password and stored in browser `localStorage`. Laravel's pgVault endpoints exist but have no frontend callers.

## 2–3. Laravel API inventory and frontend dependency map

All paths below are under `/api/v1`. “Store” means `components/app-store.tsx`; “auth UI” means the login/signup/reset/auth-session code.

| Endpoint | Purpose / validation summary | Tables | Frontend caller | Auth | Target |
|---|---|---|---|---|---|
| GET `/health` | DB/model/cache readiness | `my_links` | Store startup; login warm-up | No | Remove after migration |
| POST `/auth/login` | Email/password relay | Supabase Auth | None (browser SDK used) | No | Remove unused |
| POST `/auth/register` | Signup; password >=8 | Supabase Auth | None | No | Remove unused |
| POST `/auth/refresh` | Refresh-token relay | Supabase Auth | None | No | Remove unused |
| POST `/auth/forgot-password` | Recovery relay | Supabase Auth | None | No | Remove unused |
| GET `/auth/me` | Return validated Auth user | None | None | Bearer | Remove unused |
| POST `/auth/logout` | Supabase logout relay | Supabase Auth | None | Bearer | Remove unused |
| PUT `/auth/password` | Password update; >=8 + confirmation | Supabase Auth | None | Bearer | Remove unused |
| GET `/profile` | Own profile plus Auth email | `profiles` | `AuthSessionProvider` | Bearer | Direct Supabase + Auth user |
| PUT `/profile` | Upsert name/country/contact/timezone | `profiles` | Settings | Bearer | Direct Supabase |
| GET `/dashboard` | Aggregate active dashboard records | Six owned tables plus business children | None | Bearer | Supabase RPC if needed; otherwise parallel direct reads |
| GET `/search?q=` | Six-table title/name search, 2–100 chars | businesses, links, learning, goals, tasks, jobs | None | Bearer | Remove unused |
| GET `/links` | Sorted own links | `my_links` | Store load | Bearer | **Direct Supabase (Phase 1 done)** |
| POST `/links` | Create; required type/category/name/http(s) URL | `my_links` | Store persistence | Bearer | **Direct Supabase (Phase 1 done)** |
| GET `/links/{id}` | Own link | `my_links` | None | Bearer | Remove unused |
| PATCH `/links/{id}` | Partial validated update | `my_links` | Store persistence | Bearer | **Direct Supabase (Phase 1 done)** |
| DELETE `/links/{id}` | Delete own link | `my_links` | Store persistence | Bearer | **Direct Supabase (Phase 1 done)** |
| GET `/businesses` | Active/archived list, filters, children | businesses, links, socials | Store load (twice) | Bearer | Direct Supabase |
| POST `/businesses` | Create validated business | `businesses` | Store | Bearer | Direct Supabase |
| GET `/businesses/{id}` | Detailed business with keys metadata, note, last 10 checks | business and five child tables | Store N+1 and refreshes | Bearer | Direct nested Supabase query; exclude keys |
| PATCH `/businesses/{id}` | Partial business update | `businesses` | Store | Bearer | Direct Supabase |
| DELETE `/businesses/{id}` | Transactional cascade and pgVault deletion | business and children, `vault.secrets` | Store | Bearer | Edge Function/RPC because secret cleanup is privileged |
| GET `/learning` | Sorted/filterable list | `learning` | Store load | Bearer | Direct Supabase |
| POST `/learning` | Create; status allow-list, URL limits | `learning` | Store persistence | Bearer | Direct Supabase |
| GET `/learning/{id}` | Own item | `learning` | None | Bearer | Remove unused |
| PATCH `/learning/{id}` | Partial validated update | `learning` | Store persistence | Bearer | Direct Supabase |
| DELETE `/learning/{id}` | Delete own item | `learning` | Store persistence | Bearer | Direct Supabase |
| GET `/goals` | Sorted/filterable list | `goals` | Store load | Bearer | Direct Supabase |
| POST `/goals` | Create; numeric target >0, date/string limits | `goals` | Store persistence | Bearer | Direct Supabase |
| GET `/goals/{id}` | Own goal | `goals` | None | Bearer | Remove unused |
| PATCH `/goals/{id}` | Partial validated update | `goals` | Store persistence | Bearer | Direct Supabase |
| DELETE `/goals/{id}` | Delete own goal | `goals` | Store persistence | Bearer | Direct Supabase |
| GET `/daily-tasks` | Sorted/filterable, optional date | `daily_tasks` | Store load | Bearer | Direct Supabase |
| POST `/daily-tasks` | Create; task <=500 and date | `daily_tasks` | Store persistence | Bearer | Direct Supabase |
| GET `/daily-tasks/{id}` | Own daily task | `daily_tasks` | None | Bearer | Remove unused |
| PATCH `/daily-tasks/{id}` | Partial validated update | `daily_tasks` | Store persistence | Bearer | Direct Supabase |
| DELETE `/daily-tasks/{id}` | Delete own daily task | `daily_tasks` | Store persistence | Bearer | Direct Supabase |
| GET `/tasks` | Sorted/filterable list | `tasks` | Store load | Bearer | Direct Supabase |
| POST `/tasks` | Create; task <=500 | `tasks` | Store persistence | Bearer | Direct Supabase |
| GET `/tasks/{id}` | Own task | `tasks` | None | Bearer | Remove unused |
| PATCH `/tasks/{id}` | Partial validated update | `tasks` | Store persistence | Bearer | Direct Supabase |
| DELETE `/tasks/{id}` | Delete own task | `tasks` | Store persistence | Bearer | Direct Supabase |
| GET `/job-applications` | Sorted/filterable list | `job_applications` | Store load | Bearer | Direct Supabase |
| POST `/job-applications` | Create; URL and status allow-list | `job_applications` | Store persistence | Bearer | Direct Supabase |
| GET `/job-applications/{id}` | Own application | `job_applications` | None | Bearer | Remove unused |
| PATCH `/job-applications/{id}` | Partial validated update | `job_applications` | Store persistence | Bearer | Direct Supabase |
| DELETE `/job-applications/{id}` | Delete own application | `job_applications` | Store persistence | Bearer | Direct Supabase |
| POST/PUT/DELETE `/businesses/{id}/links[/{link}]` | Child CRUD; owned parent, typed http(s) link | `business_links`, `businesses` | Store | Bearer | Direct Supabase; retain parent-existence RLS |
| POST/PUT/DELETE `/businesses/{id}/social-links[/{social}]` | Child CRUD; owned parent, URL limits | `business_social_links`, `businesses` | Store | Bearer | Direct Supabase; retain parent-existence RLS |
| PUT `/businesses/{id}/note` | Upsert one note, <=50k chars | `business_notes`, `businesses` | Store debounce/update | Bearer | Direct upsert; unique `business_id` |
| POST `/businesses/{id}/website-checks` | SSRF-guarded HTTP check, 12s, no redirects | website/business/link tables | `components/businesses.tsx` | Bearer | Authenticated Edge Function now; scheduled Edge Function + Cron later |
| POST/PUT/DELETE `/businesses/{id}/development-keys[/{key}]` | pgVault secret and metadata lifecycle | `business_development_keys`, `vault.secrets` | None | Bearer | Remove unused unless cloud vault is intentionally adopted; if adopted, Edge Functions only |

Every protected Laravel request adds a Supabase Auth network lookup. Resource index responses are JSON rows; creates return a row with HTTP 201, updates return the fresh row, and deletes return 204. Validation errors use Laravel's 422 format.

## 4. Database architecture

`profiles.id` is the Auth-user identity. All other supplied public tables carry `user_id`. `business_links`, `business_notes`, `website_checks`, `business_development_keys`, and `business_social_links` belong to a `business_id`; supplied insert/update RLS also verifies that parent ownership. `business_notes.business_id` and `business_development_keys.vault_secret_id` are unique. Development-key metadata contains no plaintext secret; `vault_secret_id` points to pgVault. `website_checks` is append-only history conceptually, although its current RLS permits browser insert/update/delete.

The supplied schema has UUID primary keys, timestamptz audit fields (except checks only expose `checked_at`), integer ordering, boolean active/completed flags, goal numeric values, date deadlines/task dates, and text status/enum-like fields. No soft-delete column exists; business archival uses `is_archived`. Laravel migrations only create cache/jobs infrastructure; application tables pre-exist in Supabase.

Before later phases, verify/add indexes on every `user_id`, each `(user_id, display_order)`, `business_id`, `(business_id, checked_at desc)`, `(user_id, task_date, display_order)`, and the existing unique note constraint. Verify foreign keys cascade for non-secret children. Add database checks matching status allow-lists and numeric/order rules before bypassing Laravel validation.

## 5. Authentication flow

Login, signup, password reset, OAuth callback, session refresh, and route protection already use Supabase directly. The browser session JWT is attached to Laravel calls. Laravel then calls Supabase Auth for each request and manually scopes SQL by the returned UUID. Direct Supabase queries use the same browser session and RLS, eliminating the duplicate hop and duplicate Auth lookup. Only the public anon/publishable key belongs in the frontend.

## 6. Performance and reliability findings

- **Render:** the free web service can cold-start and needs a full PHP container/application boot. App startup explicitly waits for `/health`, so a sleeping/unavailable service blocks all data.
- **Laravel:** every request performs a remote `/auth/v1/user` call; there is no application data caching; the synchronous PHP server is a single extra hop to the same Supabase database.
- **Database:** production indexes and constraints are not represented in source, so their adequacy is unknown. Supavisor plus Render adds connection latency. RLS protects direct PostgREST calls but Laravel's database connection relies on manual ownership scopes instead of the user's DB role/JWT.
- **Frontend:** startup is health -> eight parallel list calls -> N business detail calls. Active and archived businesses are fetched separately. Retries add 1.5 seconds to failing reads, and `cache: no-store` prevents reuse. The store persistence loop serializes mutations and can issue one request per reordered row.

## 7. Migration decisions

Straight user-owned CRUD (profile, links, learning, goals, daily/general tasks, jobs, businesses, business links/socials/notes) should use direct Supabase with RLS and DB constraints. A dashboard RPC is optional only if parallel direct queries remain too chatty. Website checking requires an Edge Function because it performs external network access and needs SSRF controls; Cron should invoke a batch function independently of browsers. Business deletion and any pgVault lifecycle need an Edge Function or security-definer RPC with strict authorization. No persistent worker is justified by the current volume or 12-second check behavior.

## 8. Security risks

- RLS policy listings do not prove RLS is enabled or forced; verify it on all public tables and test with two real users.
- Policies target `public`; prefer `authenticated` and explicitly deny anonymous access.
- `website_checks` currently permits user insert/update/delete, so monitoring history is forgeable. After the Edge Function migration, browser access should be SELECT-only and server writes controlled.
- Laravel website checks resolve DNS before fetch but remain vulnerable to DNS rebinding and do not cap response bodies. Preserve/strengthen SSRF controls in the Edge Function.
- The active UI vault is browser-local. Its AES-GCM/PBKDF2 design avoids sending plaintext to the server, but localStorage ciphertext can be deleted and is not synchronized. The password is misleadingly called a dashboard password and is retained in component state while unlocked.
- Laravel pgVault routes are dead from the current UI. Do not expose `vault.secrets`, service-role credentials, or secret-returning functions to the browser.
- Laravel has direct database credentials and performs authorization in application code; one missed `ownedBy` would bypass RLS depending on the DB role.

## 9. Recommended target architecture

Keep Next.js and Supabase Auth. Use focused typed services under `lib/supabase` for normal CRUD through the authenticated client and RLS. Use one authenticated website-monitor Edge Function for manual and cron-driven checks, with a small bounded batch and durable history. Use a privileged Edge Function only for atomic business/secret deletion. Do not add a Node monolith or persistent worker unless measured monitoring volume exceeds Edge Function execution limits.

## 10. Safest implementation order

1. My Links direct CRUD (implemented in Phase 1), preserving Laravel as fallback infrastructure for all other features.
2. Learning, goals, daily tasks, tasks, and job applications, after adding/verifying DB constraints.
3. Profile settings direct upsert.
4. Businesses, links, socials, and notes with one nested read to remove the N+1 path.
5. Replace startup health gating and load all migrated collections in parallel; optionally add a dashboard RPC only if measurements justify it.
6. Implement authenticated manual website-check Edge Function, then cron batching and SELECT-only browser RLS for history.
7. Decide whether the local-only key vault is the intended product. Keep it local or deliberately migrate to server-side pgVault Edge Functions; never blend the models implicitly.
8. Add privileged atomic business deletion if server-managed secrets remain.
9. Remove unused Laravel auth/search/dashboard/show routes, then delete the frontend proxy/API URL after repository-wide and production verification.
10. Retire Render only after cross-user RLS tests, CRUD/empty/error tests, monitoring cron verification, data parity checks, and a rollback window.

## Phase 1 implementation note

`my_links` list/create/update/delete now use the authenticated Supabase browser client. The service reproduces Laravel's required fields, length limits, lowercase `link_type`, HTTP(S)-only URL rule, integer ordering, and readable auth/permission errors. Inserts derive `user_id` from the current Supabase session; RLS remains the authority. No production schema change was made because the supplied policies already cover all four commands and the repository does not contain enough metadata to safely alter live constraints.

Current frontend public variables remain `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, and temporarily `NEXT_PUBLIC_API_URL`. No service-role key, DB password, pgVault secret, or encryption key belongs in frontend variables.

## Phase 2 implementation note

Learning, goals, daily tasks, general tasks, and job applications now use the authenticated Supabase client for list/create/update/delete. Their Zod schemas reproduce the Laravel validation rules. The accompanying `202608200001_direct_crud_constraints.sql` migration adds database checks (initially `NOT VALID` for historical-data safety) and user/order indexes. Existing rows should be audited and each constraint explicitly validated after deployment.

Direct data and Laravel business data now load independently. The global application loader is released when direct Supabase data finishes; a slow or unavailable Render service no longer prevents My Links, Learning, Goals, Tasks, or Job Applications from hydrating. Business loading remains temporarily asynchronous through Laravel and reports its own failure toast.

## Phase 3 implementation note

Profile loading and profile upsert now use the authenticated Supabase client and the existing `profiles.id = auth.uid()` RLS policies. Email and password changes remain correctly handled by Supabase Auth. The profile constraint migration preserves Laravel's field-length and timezone rules at the database boundary. No Laravel files or routes were changed; they remain available for rollback until an explicitly authorized backend-cleanup phase.

## Phase 4 implementation note

Businesses, business links, social links, and notes now use direct authenticated Supabase access. One nested PostgREST query replaces the prior health check, two business lists, and one Laravel detail request per business. Existing parent-ownership RLS remains authoritative for child writes. Business deletion intentionally remains on Laravel because it transactionally removes pgVault secrets; the UI refuses deletion if that secure API is unavailable and restores optimistic state when deletion fails. Manual website checking also remains on Laravel pending the Edge Function phase.
