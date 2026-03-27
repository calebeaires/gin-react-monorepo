# Deployment Guide

## Build

The project compiles into a **single binary** with the React frontend embedded:

```bash
make build
```

This produces `dist/server` — one file that serves both API and frontend.

## What Happens During Build

1. `npm run build` compiles the React app to `web/dist/`
2. Built files are copied to `server/cmd/server/static/`
3. `go build` compiles the Go server, embedding `static/` via `//go:embed`
4. Output: `dist/server` — a self-contained binary

## Environment Variables (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTHULA_SECRET` | Yes | Session signing secret (`openssl rand -hex 32`) |
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTHULA_BASE_URL` | Yes | Public URL of your server (e.g., `https://app.example.com`) |
| `PORT` | No | Server port (default: `8081`) |

## Running in Production

```bash
# Set environment variables
export AUTHULA_SECRET="your-secret-here"
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
export AUTHULA_BASE_URL="https://app.example.com"
export PORT=8080

# Run
./dist/server
```

The server will:
- Run database migrations automatically on startup
- Serve the API on `/api/*` and `/auth/*`
- Serve the React frontend on all other paths
- Handle SPA routing (unknown paths return `index.html`)

## Deploy to a VPS (e.g., DigitalOcean, Hetzner)

1. Build locally: `make build`
2. Copy the binary to your server:
   ```bash
   scp dist/server user@server:/opt/myapp/server
   ```
3. Create a systemd service:
   ```ini
   # /etc/systemd/system/myapp.service
   [Unit]
   Description=My App
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDir=/opt/myapp
   ExecStart=/opt/myapp/server
   EnvironmentFile=/opt/myapp/.env
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```
4. Enable and start:
   ```bash
   sudo systemctl enable myapp
   sudo systemctl start myapp
   ```
5. Put Nginx or Caddy in front for HTTPS:
   ```
   # Caddyfile
   app.example.com {
       reverse_proxy localhost:8080
   }
   ```

## Deploy with Docker

Create a `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:20-alpine AS web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM golang:1.22-alpine AS server
WORKDIR /app/server
COPY server/go.* ./
RUN go mod download
COPY server/ ./
COPY --from=web /app/web/dist ./cmd/server/static/
RUN CGO_ENABLED=0 go build -o /server ./cmd/server

# Runtime stage
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=server /server /server
EXPOSE 8080
CMD ["/server"]
```

Build and run:

```bash
docker build -t myapp .
docker run -p 8080:8080 \
  -e AUTHULA_SECRET="your-secret" \
  -e DATABASE_URL="postgresql://..." \
  -e AUTHULA_BASE_URL="https://app.example.com" \
  myapp
```

## Deploy to Fly.io

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Create the Dockerfile above
3. Launch:
   ```bash
   fly launch
   fly secrets set AUTHULA_SECRET="your-secret"
   fly secrets set DATABASE_URL="postgresql://..."
   fly secrets set AUTHULA_BASE_URL="https://your-app.fly.dev"
   fly deploy
   ```

## Database Considerations

- **Migrations run automatically** on server startup — no manual step needed
- **Schema-per-tenant**: Each new organization creates a `tenant_<slug>` Postgres schema
- **Neon Postgres**: Supports connection pooling and branching for staging environments
- **Backups**: Use Neon's built-in point-in-time recovery or `pg_dump` for self-hosted Postgres

## Production Checklist

- [ ] Generate a strong `AUTHULA_SECRET` (`openssl rand -hex 32`)
- [ ] Set `AUTHULA_BASE_URL` to your public URL (not `localhost`)
- [ ] Use SSL for Postgres (`?sslmode=require` in connection string)
- [ ] Set up HTTPS (Caddy, Nginx, or platform-provided)
- [ ] Configure firewall — only expose ports 80/443
- [ ] Set up log aggregation (stdout is sufficient for most platforms)
- [ ] Test the full flow: sign up, create org, access tenant data
