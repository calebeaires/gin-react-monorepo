# Database Architecture

## Overview

The app uses **Neon Postgres** with **schema-per-tenant** isolation. A single database connection is shared between Authula (auth) and the application.

## Schema Layout

```
database
├── public                          # Shared schema
│   ├── users                       # Authula: user accounts
│   ├── sessions                    # Authula: active sessions
│   ├── accounts                    # Authula: auth providers (email/password)
│   ├── organizations               # App: organization records
│   └── organization_members        # App: user-org membership + roles
├── tenant_acme                     # Tenant schema for "acme" org
│   └── (your business tables)
├── tenant_widgets_inc              # Tenant schema for "widgets-inc" org
│   └── (your business tables)
└── ...
```

## Public Schema Tables

### organizations

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key (auto-generated) |
| `name` | `text` | Display name |
| `slug` | `text` | URL-safe identifier (unique) |
| `created_at` | `timestamp` | Creation time |
| `updated_at` | `timestamp` | Last update |

### organization_members

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key (auto-generated) |
| `organization_id` | `uuid` | FK → organizations.id (CASCADE delete) |
| `user_id` | `text` | Authula user ID |
| `role` | `text` | `owner`, `admin`, or `member` |
| `created_at` | `timestamp` | Join time |
| `updated_at` | `timestamp` | Last update |

**Unique constraint**: `(organization_id, user_id)` — a user can only be a member once per org.

### Authula Tables (users, sessions, accounts)

Managed by Authula. Do not modify these tables directly — use the Authula API or query read-only.

The auth middleware queries `sessions` directly to validate Bearer tokens (no HTTP roundtrip).

## Tenant Schemas

Each organization gets its own Postgres schema named `tenant_<slug>`.

- **Created** when `POST /api/orgs` is called
- **Dropped** (with CASCADE) when `DELETE /api/orgs/:slug` is called
- **Accessed** via `SET LOCAL search_path TO tenant_<slug>, public` within a transaction

### How Tenant Isolation Works

```
1. Request arrives with X-Org-Slug: acme
2. Tenant middleware begins a transaction
3. Executes: SET LOCAL search_path TO tenant_acme, public
4. All queries in this transaction see tenant_acme tables first
5. Public tables (users, orgs) are still accessible via ", public"
6. Transaction commits or rolls back when handler finishes
```

`SET LOCAL` scopes the search_path to the current transaction only — no cross-request leakage.

## Adding a New Tenant Table

1. **Define the model** in `server/internal/model/`:
   ```go
   type Project struct {
       bun.BaseModel `bun:"table:projects"`

       ID        uuid.UUID `json:"id" bun:"id,pk,type:uuid,default:gen_random_uuid()"`
       Name      string    `json:"name" bun:"name,notnull"`
       CreatedAt time.Time `json:"created_at" bun:"created_at,nullzero,notnull,default:current_timestamp"`
   }
   ```

2. **Add CREATE TABLE** to `server/internal/migrate/tenant.go` inside `CreateTenantSchema()`:
   ```go
   _, err = db.NewCreateTable().
       ModelTableExpr(fmt.Sprintf("%s.projects", pq.QuoteIdentifier(schemaName))).
       Model((*model.Project)(nil)).
       IfNotExists().
       Exec(ctx)
   ```

3. **Use it in handlers** via `tenant_tx`:
   ```go
   tx := c.MustGet("tenant_tx").(bun.Tx)
   var projects []model.Project
   err := tx.NewSelect().Model(&projects).Scan(ctx)
   ```

## Migrations

Migrations run automatically on server startup (`main.go` calls `migrate.RunPublicMigrations`). Tenant schemas are created on-demand when organizations are created.

There is no versioned migration system yet — tables use `IF NOT EXISTS`. For schema changes on existing tables, you'll need to add `ALTER TABLE` statements or integrate a migration tool like [goose](https://github.com/pressly/goose) or [atlas](https://atlasgo.io).

## Connecting to the Database

### Local Development

Use the Neon connection string from your project dashboard:

```
DATABASE_URL=postgresql://user:password@ep-cool-name-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Inspecting the Database

```bash
# Connect via psql
psql "$DATABASE_URL"

# List all schemas
\dn

# List tables in public schema
\dt public.*

# List tables in a tenant schema
\dt tenant_acme.*

# See org members
SELECT * FROM organization_members;
```
