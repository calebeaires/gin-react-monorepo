# Troubleshooting

## Common Issues

### "AUTHULA_SECRET is required" on startup

You haven't set up the `.env` file:

```bash
cp server/.env.example server/.env
# Edit server/.env with your values
```

Generate a secret with: `openssl rand -hex 32`

### "DATABASE_URL is required" or connection refused

- Make sure `DATABASE_URL` is set in `server/.env`
- For Neon: copy the connection string from your project dashboard
- Ensure `?sslmode=require` is at the end of the URL
- Check that your IP is allowed in Neon's access settings

### Port 8081 already in use

Another process is using port 8081:

```bash
# Find what's using the port
lsof -i :8081

# Use a different port
PORT=9090 make dev-server
```

### Port 5173 already in use

Another Vite instance is running:

```bash
# Kill existing Vite processes
pkill -f vite

# Or use a different port
cd web && npx vite --port 5174
```

### CORS errors in the browser

In development, Vite proxies API calls to the Go server. If you see CORS errors:

- Make sure both servers are running (`make dev`, not just `make dev-web`)
- Check that `web/vite.config.ts` proxy targets `http://localhost:8081`
- Don't access the Go server directly at `:8081` for the frontend — use `:5173`

### "Unauthorized" on API calls

1. **Token missing**: Check that `localStorage` has a `session_token` key
2. **Token expired**: Sign out and sign in again
3. **Wrong header**: API calls need `Authorization: Bearer <token>`
4. **Database mismatch**: The sessions table must be in the same database as the app

### "Organization not found" or "not a member"

- Ensure the `X-Org-Slug` header is being sent on tenant-scoped requests
- Check that the user is a member of the organization
- Verify the org slug matches exactly (case-sensitive)

### Blank page after `make build`

- Ensure `web/dist/` was built: `cd web && npm run build`
- Check that files were copied: `ls server/cmd/server/static/`
- The `static/` directory needs at least `index.html`

### "Module not found" or import errors (Go)

```bash
cd server && go mod tidy
```

### "Cannot find module" (Node)

```bash
cd web && npm install
```

### Database migrations fail

- Check your `DATABASE_URL` connection string
- Ensure the Postgres user has `CREATE SCHEMA` and `CREATE TABLE` permissions
- For Neon: the default role has full permissions on your database

### Changes not showing in the browser

- **Go changes**: The Go server needs to restart (it auto-restarts with `make dev-server` if using air, otherwise restart manually)
- **React changes**: Vite hot-reloads automatically. If it doesn't, try a hard refresh (`Cmd+Shift+R`)
- **After `make build`**: Rebuild — the embedded frontend is baked into the binary at compile time

## Debugging Tips

### Check server logs

The Go server logs requests to stdout. Look for error messages there first.

### Check browser DevTools

- **Network tab**: See if API requests are going to the right URL and returning expected status codes
- **Console tab**: Look for JavaScript errors
- **Application tab → Local Storage**: Check that `session_token` is stored

### Inspect the database

```bash
# Connect to your database
psql "$DATABASE_URL"

# Check if tables exist
\dt public.*

# Check tenant schemas
\dn tenant_*

# Check sessions
SELECT id, user_id, created_at FROM sessions ORDER BY created_at DESC LIMIT 5;
```

### Test API manually

```bash
# Health check
curl http://localhost:8081/api/health

# Sign in
curl -X POST http://localhost:8081/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'

# Authenticated request (replace <token>)
curl http://localhost:8081/api/me \
  -H "Authorization: Bearer <token>"

# Tenant-scoped request
curl http://localhost:8081/api/t/status \
  -H "Authorization: Bearer <token>" \
  -H "X-Org-Slug: my-org"
```
