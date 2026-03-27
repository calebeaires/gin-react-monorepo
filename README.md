# gin-react-monorepo

Full-stack starter monorepo with **Go/Gin** backend and **React 19** frontend. Includes email/password authentication out of the box.

Built for developers who want a clean, production-ready starting point without over-engineering.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | [Go](https://go.dev) + [Gin](https://gin-gonic.com) |
| Auth | [Authula](https://github.com/Authula/authula) (email/password + sessions) |
| Database | SQLite (swappable to PostgreSQL/MySQL) |
| Frontend | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build | [Vite 8](https://vite.dev) |
| CSS | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) |

## Project Structure

```
.
├── Makefile
├── server/
│   ├── cmd/server/main.go        # Entry point
│   ├── internal/
│   │   ├── config/config.go      # Authula + app config
│   │   ├── handler/
│   │   │   ├── health.go         # GET /api/health, /api/message
│   │   │   └── user.go           # GET /api/me (protected)
│   │   ├── middleware/cors.go    # CORS middleware
│   │   └── router/router.go     # Gin + Authula wiring
│   ├── go.mod
│   └── .env.example
└── web/
    ├── package.json
    ├── vite.config.ts            # Vite + Tailwind + API proxy
    └── src/
        ├── App.tsx               # Router setup
        ├── contexts/
        │   └── AuthContext.tsx    # Auth state management
        ├── components/
        │   ├── ProtectedRoute.tsx
        │   └── ui/               # shadcn/ui components
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── SignupPage.tsx
        │   └── HomePage.tsx
        └── lib/
            ├── api.ts            # Typed fetch wrapper
            └── utils.ts          # cn() utility
```

## Prerequisites

- **Go** 1.22+ ([install](https://go.dev/dl/))
- **Node.js** 20+ ([install](https://nodejs.org))
- **Make** (pre-installed on macOS/Linux)

## Quick Start

```bash
# Clone
git clone https://github.com/calebeaires/gin-react-monorepo.git
cd gin-react-monorepo

# Install dependencies
make install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env and set a random secret

# Run both servers
make dev
```

Server runs on `http://localhost:8081`, web on `http://localhost:5173`.

Open `http://localhost:5173` — you'll be redirected to the login page. Create an account and you're in.

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
| `GET` | `/auth/me` | Current user |

### Protected

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/me` | Current user (via session) |

## Auth Flow

```
Sign Up → Auto Sign In → Session Cookie Set → Authenticated
                                                    │
Login Page ← Redirect ← ProtectedRoute ← No Cookie ┘
```

1. User signs up or signs in via Authula endpoints
2. Authula creates a session and sets an HTTP-only cookie
3. `AuthContext` checks `/auth/me` on page load
4. `ProtectedRoute` redirects to `/login` if no session
5. Sign out clears the cookie and redirects to login

## Architecture Decisions

**Why Gin?** Minimal, fast, and the most popular Go web framework. No magic — just handlers and middleware.

**Why `internal/`?** Go convention — code inside `internal/` can't be imported by external projects. Keeps the API surface clean.

**Why Authula?** Pluggable auth that lives in your codebase. No SaaS dependency, no vendor lock-in. Swap email/password for OAuth or TOTP by adding a plugin.

**Why SQLite?** Zero config for development. Authula creates the database and runs migrations automatically. Switch to PostgreSQL by changing one line in the config.

**Why Vite proxy?** The web app proxies `/api` and `/auth` to the server. This eliminates CORS issues in development because everything is same-origin. Cookies just work.

**Why shadcn/ui?** Components are copied into your project, not installed as a dependency. You own the code. Customize anything without fighting a library.

**Why session cookies over JWT?** For web apps, HTTP-only cookies are simpler and more secure. No token refresh logic, no localStorage vulnerabilities. The server is the source of truth.

## Available Commands

```bash
make dev            # Run server + web in parallel
make dev-server     # Server only (port 8081)
make dev-web        # Web only (port 5173)
make install        # Install all dependencies
make build          # Build single binary with embedded frontend
make clean          # Remove build artifacts
```

## Production Build

`make build` produces a single binary at `dist/server` with the React frontend embedded inside using Go's `embed` package.

```bash
make build
./dist/server    # Serves API + frontend on :8081
```

No Nginx, no separate static file server. One binary, one process, one port.

## Adding shadcn/ui Components

```bash
cd web
npx shadcn@latest add dialog       # or any component
```

Components are added to `web/src/components/ui/`.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR

## License

[MIT](LICENSE)
