# CLAUDE.md

Guidance for Claude Code in this repository. Project rules, collaboration style and handover duties live in `AGENTS.md` (Vietnamese) and apply in full:

@AGENTS.md

Key points from it: reply to the user in Vietnamese, UI copy in Vietnamese with diacritics, read `docs/PROGRESS.md` at session start, and update it after any task that changes code, config or project decisions.

## What this is

WardMate web frontend (`wardmate-web`): a portal that helps citizens prepare and pre-check administrative dossiers at ward level, plus internal workspaces for officers, managers, procedure managers and IT admins. Pre-check (tiền kiểm) is not official intake; do not present it as such in UI or logic.

Related repos on this machine: backend at `D:/wardmate-backend` (.NET microservices: IAM, ProcedureCatalog, ApplicationWorkflow, DocumentForm, AnalyticsSystem, gateway), mobile app at `D:/wardmate-mobile`. Check backend source before assuming an API contract.

## Commands

```bash
npm run dev            # Vite on http://localhost:5173 (strictPort), uses .env.development.local
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run build          # typecheck + vite build
npm run test:e2e       # all Playwright tests

npx playwright test tests/officer.spec.ts            # one file
npx playwright test tests/officer.spec.ts -g "text"  # one test by title
npx playwright test --workers=2 ...                  # use fewer workers; many workers right after a build cause flaky timeouts
node tests/api-proxy-check.mjs                       # verifies Vite proxy routing against a local HTTP target (no Azure calls)
```

Playwright runs Microsoft Edge (`channel: 'msedge'`) against its own Vite server on `127.0.0.1:4317`, with every service URL forced to `http://localhost:5000` and `VITE_USE_API_PROXY=false`. All backend traffic in tests is mocked with `page.route` / `routeWebSocket` using helpers in `tests/fixtures/` (`auth.ts`, `procedures.ts`, `documentWorkflow.ts`, `analytics.ts`, ...). A passing Playwright run is "tested with mocks", not verified against real services.

## Architecture

Stack: React 19, TypeScript (strict, `noUnusedLocals/Parameters`), Vite 6, Tailwind CSS v4, React Router 7, TanStack Query 5, Zustand 5, React Hook Form + Zod 4, Radix Dialog, Sonner, Recharts, motion. Alias `@/` → `src/`.

### Routing and access (`src/app/App.tsx`)

- Public pages under `MainLayout`: home, `/dang-nhap`, `/dang-ky`, password reset, `/hoi-dap`, `/thu-tuc[/:procedureId]`.
- Role workspaces are lazy-loaded and wrapped in `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) with IAM roles and permission prefixes:
  - `citizen/*`, `cong-dan/*` → `REGISTERED_CITIZEN` (`src/pages/citizen`)
  - `officer/*`, `can-bo/*` → `FRONT_DESK_OFFICER` (`src/pages/officer`)
  - `manager/*`, `quan-ly/*` → `MANAGER` (`src/pages/manager`)
  - `procedure-manager/*`, `quan-ly-thu-tuc/*` → `PROCEDURE_MANAGER`/`IT_ADMIN` (`src/pages/procedure-manager`)
  - `admin` → `IT_ADMIN` (`src/pages/admin`)
- Sidebar/menu visibility uses `src/lib/navigationAccess.ts`; post-login landing and safe `returnTo` handling are in `src/lib/authRedirect.ts`. Backend still enforces permissions; FE checks are UX only.

### Auth and HTTP

- `src/lib/api/index.ts` builds the shared axios client (`api`) via `createJwtClient.ts`. Access token lives only in memory; refresh token is an HttpOnly cookie refreshed through `/api/v1/auth/refresh-token` (with `X-CSRF-Protection` header, Web Locks + BroadcastChannel for multi-tab coordination). Never persist tokens to storage.
- Session expiry clears state, sets `expired` in `src/stores/authStore.ts` and redirects to `/dang-nhap` keeping `returnTo`.
- Current user (`/api/v1/users/me`: roles, permissions, `assignedCategories`) is held in `authStore`.

### Services and proxy

There are several backend services; `src/lib/api/serviceUrls.ts` resolves their base URLs from `VITE_*` env vars (see `.env.example`):

| Env var | Service | FE client |
|---|---|---|
| `VITE_API_BASE_URL` | IAM (auth, users, RBAC) | `index.ts`, `rbac.ts` |
| `VITE_CATALOG_API_URL` | Procedure catalog | `procedures.ts` |
| `VITE_WORKFLOW_API_URL` | Application workflow / assignment | `workflow.ts`, `workflowAdapters.ts` |
| `VITE_DOCUMENT_FORM_API_URL` | Gateway → DocumentForm (submissions, templates, PDF/QR), SignalR hub | `documentForms.ts`, `formTemplates.ts`, `notifications.ts` |
| `VITE_ANALYTICS_API_URL` | Analytics + citizen feedback | `analytics.ts` |
| `VITE_AI_OCR_API_URL` | AI OCR / chat (falls back to DocumentForm) | `aiOcr.ts` |

With `VITE_USE_API_PROXY=true` the browser calls same-origin paths and `vite.config.ts` routes them by prefix. **Order matters**: specific DocumentForm/Analytics/Workflow prefixes (e.g. `/api/v1/applications/{id}/contents`, `/api/v1/manager/applications`, `/api/analytics-system` with `ws: true`) must be registered before the catch-all `/api` → IAM. When adding a route, update `vite.config.ts`, add a case to `tests/api-proxy-check.mjs`, and note that production hosting needs an equivalent reverse proxy (`vercel.json` currently only has the SPA rewrite).

API clients validate responses with Zod and map backend error codes to Vietnamese messages (e.g. `procedureError`, `officerCategoryError`). Do not invent endpoints or response shapes; specs and gap lists are in `docs/` (`*_BACKEND_SPEC.md`, `*_API_AUDIT_*.md`, `*_BACKEND_GAPS.md`).

### Data fetching and state

- `src/app/QueryProvider.tsx` + `src/lib/queryClient.ts`: staleTime 30s, gcTime 5m, one retry only for network/5xx, mutations never retry. Cache is cleared when identity changes.
- Query hooks live in `src/hooks/` (`useWorkflow.ts`, `useDocumentForms.ts`, `useAnalytics.ts`, `useProcedureCategories.ts`, ...). Private query keys include the user ID; mutations invalidate related queries on both success and error (the server may have persisted before failing). Some procedure-manager screens still use the older `useProcedureQuery`; migrate only when touching that screen.
- Realtime officer notifications: `@microsoft/signalr` via `src/hooks/useNotificationHub.ts`.
- DOCX editing: `src/components/documents/DocxOnlineEditor.tsx` lazy-loads `@docx-editor.dev/*`; it needs the ES2022 build target set in `vite.config.ts`.

### UI

- Shared components in `src/components/ui` (`Button`, `Input`, `Modal` on Radix, `Toast` on Sonner, `Badge`, `Skeleton`, `ConfirmDeleteModal`). Reuse them; shadcn is configured (`components.json`, Tailwind tokens in `src/styles/globals.css`) but never overwrite existing files—Windows is case-insensitive, so `button.tsx` would clobber `Button.tsx`.
- Feature components are grouped by domain under `src/components/` (`workflow`, `documents`, `citizen`, `analytics`, `notifications`, `layout`, ...). Workspace pages own their views under `src/pages/<role>/`.
- Before UI work read `UI_UX_DESIGN_STANDARD.md`; before forms/API/cache/UI component work read `docs/FRONTEND_SETUP.md`; for officer or procedure-manager workspaces read `Officer.md` / `Procedure Management.md`.

## Gotchas

- `.env*` files other than `.env.example` are gitignored and may hold the developer's real Azure origins; never print or commit them.
- `graphify-out/`, `dist/`, `test-results/`, `tmp/` are generated; ignore them when searching.
- `docs/PROGRESS.md` lists known pre-existing Playwright failures and flaky specs; check it before attributing a failure to your change.
