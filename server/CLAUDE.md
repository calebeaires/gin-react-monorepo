# Server — Go Guidelines

## Project Structure

```
server/
├── cmd/server/main.go          # Entry point — only wiring, no logic
├── internal/
│   ├── config/config.go        # Postgres connection + Authula configuration
│   ├── handler/                # HTTP handlers (one file per domain)
│   │   ├── health.go           # GET /api/health, /api/message
│   │   ├── user.go             # GET /api/me (protected, returns user + orgs)
│   │   ├── org.go              # Organization CRUD + member management
│   │   ├── tenant.go           # Tenant-scoped handlers (GET /api/t/status)
│   │   └── static.go           # SPA fallback for embedded frontend
│   ├── middleware/
│   │   ├── cors.go             # CORS (allows X-Org-Slug header)
│   │   ├── auth.go             # Session validation via /auth/me forwarding
│   │   └── tenant.go           # Tenant resolution + search_path isolation
│   ├── model/                  # Bun ORM models
│   │   ├── organization.go     # Organization (id, name, slug)
│   │   └── organization_member.go # OrganizationMember (user_id, role)
│   ├── migrate/                # Database migrations
│   │   ├── public.go           # Creates org/member tables in public schema
│   │   └── tenant.go           # Creates/drops tenant schemas
│   └── router/router.go       # Gin engine setup, route mounting
├── go.mod
└── .env.example
```

- `cmd/` — entry points. Keep `main.go` thin: create DB, config, build router, run server
- `internal/` — all application code. Cannot be imported by external projects
- `handler/` — one file per domain (health, user, org, tenant). Each handler is a `gin.HandlerFunc` factory
- `middleware/` — reusable Gin middleware (CORS, auth, tenant)
- `model/` — Bun ORM model structs for application tables
- `migrate/` — database migration functions (public schema + tenant schemas)
- `config/` — app and Authula configuration. Reads from env vars
- `router/` — wires everything together: middleware, auth, handlers

## Architecture

- Use dependency injection via constructors (`func New(dep Dep) *Thing`)
- Implement interfaces before concrete types
- Keep packages small — one responsibility per package
- Prefer composition over inheritance (embedding)
- Handlers return `gin.HandlerFunc` — this allows injecting dependencies via closure
- Do NOT create `service/` or `repository/` layers unless business logic grows beyond auth

## Multi-Tenancy

The app uses **schema-per-tenant** isolation on Neon Postgres:

- **Public schema**: Authula tables (users, sessions) + organizations + organization_members
- **Tenant schemas** (`tenant_<slug>`): Per-org business data, isolated via `SET LOCAL search_path`
- **Shared DB connection**: `config.NewDB()` creates a `*bun.DB` shared between Authula and app code

### Route Groups
1. **Public** (`/api/health`, `/api/message`): No auth, no tenant
2. **Authenticated** (`/api/me`, `/api/orgs/*`): Auth middleware, no tenant
3. **Tenant-scoped** (`/api/t/*`): Auth + Tenant middleware

### Tenant Middleware Flow
1. Reads `X-Org-Slug` header
2. Validates user membership in the organization
3. Begins a Postgres transaction
4. Executes `SET LOCAL search_path TO tenant_<slug>, public`
5. Stores `bun.Tx` in Gin context as `"tenant_tx"`
6. After handler: commits on success, rolls back on error

### Adding Tenant-Scoped Endpoints
1. Create handler in `internal/handler/` that reads `tenant_tx` from context:
   ```go
   func MyHandler() gin.HandlerFunc {
       return func(c *gin.Context) {
           tx := c.MustGet("tenant_tx").(bun.Tx)
           // Use tx for all queries — they're scoped to the tenant schema
       }
   }
   ```
2. Register in the tenant group in `router.go`:
   ```go
   tenant.GET("/my-endpoint", handler.MyHandler())
   ```

### Adding Tenant Tables
1. Define Bun model in `internal/model/`
2. Add `CREATE TABLE` to `migrate/tenant.go` `CreateTenantSchema()` function
3. Tables are created in the tenant schema automatically when an org is created

## Adding New Endpoints

1. Create a handler function in `internal/handler/` (new file if new domain)
2. Register the route in `internal/router/router.go` in the appropriate group:
   - Public group: no middleware
   - `authed` group: auth middleware (session required)
   - `tenant` group: auth + tenant middleware (session + X-Org-Slug required)
3. For auth: user_id is available via `c.GetString("user_id")` (set by auth middleware)
4. For tenant: org context via `c.GetString("org_id")`, `c.GetString("org_slug")`, `c.GetString("org_role")`

Example handler pattern:
```go
func MyHandler(db *bun.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("user_id")
        // use db and userID here
        c.JSON(http.StatusOK, gin.H{"key": "value"})
    }
}
```

## Auth (Authula + Bearer Token)

- Authula is mounted at `/auth/*` via `gin.WrapH(auth.Handler())`
- Plugins: email-password (sign-up/sign-in) + session
- Database: Neon Postgres (shared `bun.DB` connection via `AuthConfig.DB`)
- Email plugin required by email-password plugin (uses dummy SMTP config since email verification is disabled)
- Sign-in returns `{ user, session: { token } }` — token is the SHA-256 hash stored in DB
- Frontend sends token as `Authorization: Bearer <token>` header
- Auth middleware (`middleware/auth.go`) queries Authula's `sessions` table directly — no HTTP calls, no re-hashing
- All API responses use `{ data, error, message }` envelope via helpers in `handler/response.go`
- Config lives in `internal/config/config.go`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTHULA_SECRET` | Yes | Session signing secret |
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `AUTHULA_BASE_URL` | No | Server URL (default: `http://localhost:8081`) |
| `PORT` | No | Server port (default: `8081`) |

## Code Style

- Follow `gofmt` and `goimports`
- Error handling: always check and wrap with context (`fmt.Errorf("doing X: %w", err)`)
- Avoid naked returns in functions longer than a few lines
- Use `golangci-lint` with `gosec` for security checks
- No unused variables or imports (enforced by compiler)

## Design Principles

- Performance matters — prefer efficient data structures
- Network messages must be authenticated and validated
- State consistency — use proper synchronization (`sync.Mutex`, channels)
- Cryptographic operations require careful handling

## Testing

- Table-driven tests preferred
- Use `testify` for assertions when available
- Test files live alongside the code (`*_test.go`)

## Embedded Frontend

The production build embeds the React frontend into the Go binary using `go:embed`.

- `cmd/server/static/` — populated by `make build` (copies `web/dist/` output)
- `cmd/server/main.go` — embeds `static/*` via `//go:embed static/*`
- `handler/static.go` — serves files with SPA fallback (any unknown route → `index.html`)
- `router/router.go` — mounts static handler on `NoRoute` (only when `staticFiles != nil`)

In development (`make dev`), `static/` is empty so the frontend is served by Vite on `:5173`.
In production (`make build`), `static/` contains the built frontend and everything runs on one port.

## Running

```bash
# Development (two servers)
make dev-server          # or: cd server && go run ./cmd/server
make dev                 # server + web in parallel

# Production (single binary)
make build
./dist/server            # API + frontend on :8081
```

Server runs on `http://localhost:8081`. In dev, web proxy forwards `/api` and `/auth` from `:5173`.
