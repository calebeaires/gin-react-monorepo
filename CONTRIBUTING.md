# Contributing

Thanks for your interest in contributing to **gin-react-monorepo**!

## Getting Started

1. Fork this repo and clone your fork
2. Install dependencies: `make install`
3. Copy the env file: `cp server/.env.example server/.env` and fill in your values
4. Start development: `make dev`

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
2. Make your changes
3. Test locally with `make dev`
4. Commit with a clear message (see below)
5. Push and open a PR against `main`

## Commit Messages

Use clear, concise commit messages that describe **what** and **why**:

```
Add user avatar upload endpoint

Supports PNG/JPG up to 2MB. Stored in tenant schema
so each org has isolated file references.
```

Prefix with the area when helpful: `server:`, `web:`, `docs:`.

## Project Structure

- **Backend changes**: `server/internal/` — see `server/CLAUDE.md` for Go patterns
- **Frontend changes**: `web/src/` — see `web/CLAUDE.md` for React patterns
- **New API endpoints**: handler in `server/internal/handler/`, register in `router.go`
- **New pages**: component in `web/src/pages/`, route in `App.tsx`
- **New UI components**: `cd web && npx shadcn@latest add <component>`

## Code Style

### Go (server)
- Follow `gofmt` and `goimports`
- Wrap errors with context: `fmt.Errorf("doing X: %w", err)`
- Handlers return `gin.HandlerFunc` (dependency injection via closure)

### TypeScript (web)
- Strict mode — no `any` types
- Use Zustand for client state, React Query for server state
- Use shadcn/ui + Tailwind for styling (no inline styles)

## Adding a New Feature (End-to-End)

Here's the typical flow for adding a tenant-scoped feature:

1. **Model**: Define a Bun model in `server/internal/model/`
2. **Migration**: Add `CREATE TABLE` in `server/internal/migrate/tenant.go`
3. **Handler**: Create handler in `server/internal/handler/` using `tenant_tx` from context
4. **Route**: Register in the tenant group in `server/internal/router/router.go`
5. **API types**: Add TypeScript types in `web/src/lib/types.ts`
6. **Frontend**: Create page/component, add route in `App.tsx`
7. **i18n**: Add translations in `web/src/locales/en.json`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a description of what changed and why
- Make sure `make build` succeeds (compiles both server and web)
- Update documentation if you change behavior

## Questions?

Open an issue if something is unclear or you need help getting started.
