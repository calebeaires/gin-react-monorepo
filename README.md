# gin-react-monorepo

Full-stack **Go/Gin + React 19** monorepo with email/password auth ([Authula](https://github.com/Authula/authula)), multi-tenant schema-per-tenant isolation on **Neon Postgres**, and single-binary deploy.

Built for developers who want a clean, production-ready starting point with multi-tenancy out of the box.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | [Go](https://go.dev) + [Gin](https://gin-gonic.com) |
| Auth | [Authula](https://github.com/Authula/authula) (email/password + Bearer tokens) |
| Database | [Neon Postgres](https://neon.tech) (schema-per-tenant) |
| ORM | [Bun](https://bun.uptrace.dev) |
| Frontend | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) (React Compiler) |
| Build | [Vite 8](https://vite.dev) |
| CSS | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) |
| State | [Zustand](https://zustand-demo.pmnd.rs) |

## Project Structure

```
.
├── Makefile                             # dev, build, install, clean commands
├── CLAUDE.md                            # AI assistant project instructions
├── server/                              # Go/Gin backend (API + auth + embedded frontend)
│   ├── CLAUDE.md                        # Go-specific guidelines
│   ├── cmd/server/
│   │   ├── main.go                      # Entry point — wires DB, config, migrations, router
│   │   └── static/                      # Embedded frontend (populated by make build)
│   ├── internal/
│   │   ├── config/config.go             # Postgres connection + Authula config
│   │   ├── handler/
│   │   │   ├── health.go                # GET /api/health, /api/message
│   │   │   ├── user.go                  # GET /api/me (protected)
│   │   │   ├── org.go                   # Organization CRUD + member management
│   │   │   ├── tenant.go                # Tenant-scoped endpoints
│   │   │   ├── response.go              # JSON response envelope helpers
│   │   │   └── static.go               # SPA routing for embedded frontend
│   │   ├── middleware/
│   │   │   ├── cors.go                  # CORS middleware
│   │   │   ├── auth.go                  # Bearer token auth middleware
│   │   │   └── tenant.go               # Tenant context + search_path isolation
│   │   ├── model/
│   │   │   ├── organization.go          # Organization model
│   │   │   └── organization_member.go   # Membership + roles
│   │   ├── migrate/
│   │   │   ├── public.go               # Public schema migrations (users, orgs)
│   │   │   └── tenant.go               # Per-tenant schema migrations
│   │   └── router/router.go            # Mounts middleware, auth, API, org, tenant routes
│   ├── go.mod / go.sum
│   └── .env.example
└── web/                                 # React 19 + TypeScript frontend
    ├── CLAUDE.md                        # Frontend-specific guidelines
    ├── package.json
    ├── vite.config.ts                   # Vite + Tailwind + API proxy to :8081
    ├── components.json                  # shadcn/ui configuration
    └── src/
        ├── App.tsx                      # React Router + AuthLoader
        ├── main.tsx                     # App entry point
        ├── index.css                    # Tailwind CSS v4 styles
        ├── store/
        │   ├── auth.ts                  # Auth state: signIn, signUp, signOut, user
        │   └── org.ts                   # Org state: organizations, currentOrg, createOrg
        ├── components/
        │   ├── ProtectedRoute.tsx       # Redirects to /login if unauthenticated
        │   ├── OrgGuard.tsx             # Redirects to /orgs if no org selected
        │   ├── OrgSwitcher.tsx          # Org selection dropdown
        │   ├── CreateOrgDialog.tsx      # Dialog for creating new organizations
        │   └── ui/                      # shadcn/ui components (button, card, dialog, etc.)
        ├── pages/
        │   ├── LoginPage.tsx            # Email/password login
        │   ├── SignupPage.tsx           # Account registration
        │   ├── HomePage.tsx             # Main dashboard (org-scoped)
        │   ├── OrgsPage.tsx             # Organization list + creation
        │   └── OrgSettingsPage.tsx      # Organization settings (owner/admin)
        ├── lib/
        │   ├── api.ts                   # Typed fetch wrapper + tenantApi with X-Org-Slug
        │   ├── types.ts                 # Shared TypeScript types
        │   ├── query.ts                 # React Query configuration
        │   ├── i18n.ts                  # Internationalization setup
        │   └── utils.ts                 # cn() utility
        └── locales/
            └── en.json                  # English translations
```

## Prerequisites

- **Go** 1.22+ ([install](https://go.dev/dl/))
- **Node.js** 20+ ([install](https://nodejs.org))
- **Make** (pre-installed on macOS/Linux)
- **Neon Postgres** database ([sign up](https://neon.tech))

## Quick Start

```bash
# Clone
git clone https://github.com/calebeaires/gin-react-monorepo.git
cd gin-react-monorepo

# Install dependencies
make install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env — set AUTHULA_SECRET and DATABASE_URL

# Run both servers
make dev
```

Server runs on `http://localhost:8081`, web on `http://localhost:5173`.

Open `http://localhost:5173` — create an account at `/signup`, then create an organization to get started.

## How Server and Web Communicate

In **development**, two processes run independently:
- Go server on `:8081` — serves `/api/*` and `/auth/*`
- Vite dev server on `:5173` — serves the React app with hot reload
- Vite proxies `/api` and `/auth` requests to `:8081` (configured in `web/vite.config.ts`)
- Everything is same-origin, so Bearer tokens work without CORS issues

In **production** (`make build`):
- Vite builds the React app to static files
- Static files are copied into `server/cmd/server/static/`
- Go embeds them via `//go:embed static/*`
- The single binary serves API + frontend on one port
- `handler/static.go` handles SPA routing (unknown paths -> `index.html`)

No Nginx, no separate static file server. One binary, one process, one port.

## Multi-Tenancy Architecture

The app uses **schema-per-tenant** isolation on Neon Postgres:

- **Public schema** holds shared data: Authula tables (users, sessions), `organizations`, `organization_members`
- **Tenant schemas** (`tenant_<slug>`) hold per-org business data, isolated via `SET LOCAL search_path`
- Users are global — one account can belong to many organizations
- Each request to `/api/t/*` requires an `X-Org-Slug` header

### Request Flow (Tenant-Scoped)

```
Request → CORS → Auth Middleware → Tenant Middleware → Handler → Response
                  (Bearer token)    (X-Org-Slug)       (tenant_tx)
```

1. CORS middleware allows `Authorization` and `X-Org-Slug` headers
2. Auth middleware extracts Bearer token, queries Authula's `sessions` table directly, sets `user_id` in context
3. Tenant middleware reads `X-Org-Slug`, verifies membership, begins transaction with `SET LOCAL search_path TO tenant_<slug>, public`
4. Handler uses `tenant_tx` from context for all DB queries
5. Tenant middleware commits or rolls back the transaction

### Organization Lifecycle

- **Create**: `POST /api/orgs` creates the org record + `tenant_<slug>` schema in one transaction
- **Delete**: `DELETE /api/orgs/:slug` drops the schema + deletes the org record (owner only)
- **Members**: Owners and admins can add/remove members and change roles

### Roles

| Role | Permissions |
|------|------------|
| `owner` | Full control — manage members, change roles, delete org |
| `admin` | Manage members, update org name |
| `member` | Access tenant-scoped data |

## Auth Flow (Authula + Bearer Token)

```
Sign Up/In → Authula returns token → Stored in Zustand + localStorage
                                          │
                    Authorization: Bearer <token> on every API call
                                          │
              Auth middleware → sessions table lookup → user_id in context
```

1. Web calls `POST /auth/sign-up` or `POST /auth/sign-in`
2. Authula validates credentials, creates a session, returns `{ user, session: { token } }`
3. Frontend stores `session.token` in Zustand + `localStorage` (`session_token` key)
4. All API calls include `Authorization: Bearer <token>` header (auto-injected by `api()` wrapper)
5. Auth middleware queries Authula's `sessions` table directly via shared DB — no HTTP calls
6. `AuthLoader` fetches `GET /api/me` on page load to restore user + orgs
7. `ProtectedRoute` redirects to `/login` if no token; `OrgGuard` redirects to `/orgs` if no org selected

**API response envelope**: All `/api/*` endpoints return `{ data, error, message }`. The `api()` wrapper auto-unwraps `data`. Auth endpoints (`/auth/*`) use Authula's own format — handled by `authFetch()` separately.

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/message` | Test message |

### Auth (Authula)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/sign-up` | Create account |
| `POST` | `/auth/sign-in` | Login |
| `POST` | `/auth/sign-out` | Logout |

### Authenticated (session required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/me` | Current user + organizations |
| `POST` | `/api/orgs` | Create organization |
| `GET` | `/api/orgs` | List user's organizations |
| `GET` | `/api/orgs/:slug` | Org details + members |
| `PATCH` | `/api/orgs/:slug` | Update org name (owner/admin) |
| `DELETE` | `/api/orgs/:slug` | Delete org + schema (owner) |
| `POST` | `/api/orgs/:slug/members` | Add member (owner/admin) |
| `DELETE` | `/api/orgs/:slug/members/:userId` | Remove member (owner/admin) |
| `PATCH` | `/api/orgs/:slug/members/:userId` | Change member role (owner) |

### Tenant-Scoped (session + X-Org-Slug header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/t/status` | Tenant context info |

## Environment Variables

Set in `server/.env` (copied from `.env.example`):

| Variable | Required | Default |
|----------|----------|---------|
| `AUTHULA_SECRET` | Yes | — |
| `DATABASE_URL` | Yes | — |
| `AUTHULA_BASE_URL` | No | `http://localhost:8081` |
| `PORT` | No | `8081` |

## Available Commands

```bash
make dev            # Run server + web in parallel
make dev-server     # Server only (port 8081)
make dev-web        # Web only (port 5173)
make install        # Install all dependencies (Go + Node)
make build          # Build single binary with embedded frontend → dist/server
make clean          # Remove build artifacts
```

## Architecture Decisions

**Why Gin?** Minimal, fast, and the most popular Go web framework. No magic — just handlers and middleware.

**Why `internal/`?** Go convention — code inside `internal/` can't be imported by external projects. Keeps the API surface clean.

**Why Authula?** Pluggable auth that lives in your codebase. No SaaS dependency, no vendor lock-in. Swap email/password for OAuth or TOTP by adding a plugin.

**Why Neon Postgres?** Serverless Postgres with branching for dev/staging. Schema-per-tenant isolation gives each organization its own namespace without managing separate databases.

**Why schema-per-tenant?** Strongest isolation without the operational overhead of database-per-tenant. Each org's data lives in `tenant_<slug>` and is accessed via `SET LOCAL search_path` within a transaction — no cross-tenant data leakage.

**Why Bearer tokens over cookies?** Simpler for multi-tenant APIs where the frontend needs to send both auth and org context headers. Works consistently across same-origin and cross-origin setups.

**Why Vite proxy?** The web app proxies `/api` and `/auth` to the server in development. This eliminates CORS issues because everything is same-origin.

**Why shadcn/ui?** Components are copied into your project, not installed as a dependency. You own the code. Customize anything without fighting a library.

**Why single binary?** Go embeds the built React app. Deploy one file, run one process. No reverse proxy, no static file server, no container orchestration needed for simple deployments.

## Adding New Features

- **New API endpoint**: Create handler in `server/internal/handler/`, register in `router.go`
- **New tenant-scoped endpoint**: Add to `/api/t/` group in `router.go` (gets auth + tenant middleware automatically)
- **New tenant table**: Add `CREATE TABLE` to `migrate/tenant.go`, use `tenant_tx` from Gin context in handlers
- **New page**: Create in `web/src/pages/`, add route in `App.tsx`
- **New UI component**: `cd web && npx shadcn@latest add <component>`
- **Protected route**: Wrap with `<ProtectedRoute>` in `App.tsx`
- **Org-required route**: Wrap with `<OrgGuard>` inside `<ProtectedRoute>`

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR

## License

[MIT](LICENSE)
