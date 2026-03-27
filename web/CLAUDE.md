# Web — React Frontend Guidelines

> Stack: React 19 + React Compiler + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Zustand + TanStack Query + i18next

---

## React Compiler

- NEVER add `useMemo`, `useCallback`, or `React.memo` manually — the compiler handles memoization automatically
- Props must be treated as immutable; never mutate props or objects received from parent
- Avoid side effects during render (no `Date.now()`, random values, or external mutations in render body)
- Keep components pure: same inputs must always produce the same output
- If you disable the compiler for a component with `"use no memo"`, always add a comment explaining why

---

## Avoid `useEffect`

- `useEffect` is for syncing with **external systems** (browser APIs, subscriptions, third-party widgets)
- If a value can be **computed from props/state during render**, do it there — not in an Effect
- If something happens **because of a user interaction**, put it in the **event handler**
- Before adding an Effect, ask: *"does anything break that involves the world outside React?"*

### Do NOT use `useEffect` for:
- Deriving values from state/props (compute in render)
- Filtering, sorting, or transforming lists (compute in render)
- Resetting state when a prop changes (use `key` to remount)
- POST requests tied to user actions (use event handlers)

### DO use `useEffect` for:
- Subscribing to browser APIs, event listeners
- Data fetching on mount (like checking auth session)
- Timers, intervals with proper cleanup
- Analytics/logging when component is on screen

---

## Components

- One component per file; filename matches the component name (PascalCase)
- Prefer small, single-responsibility components
- Children composition over prop drilling beyond 2 levels
- Use named exports — avoid anonymous default exports
- Custom hooks: prefix `useXxx`, extract when logic is >10 lines or reused
- Props types defined as `interface`, named `ComponentNameProps`

---

## UI — shadcn/ui + Tailwind

- Never modify files inside `components/ui/` directly — extend by wrapping
- Use CVA (`class-variance-authority`) for component variants
- Use Tailwind tokens for spacing, colors, typography — avoid arbitrary values like `w-[347px]`
- Arbitrary values (`[...]`) only for values that truly cannot be tokenized
- No `style={{ }}` except for dynamic values that can't be expressed in Tailwind
- Responsive: mobile-first — base class is mobile, `md:`/`lg:` for larger screens
- Semantic HTML: `button` for actions, `a` for navigation, never `div` with `onClick`
- Interactive elements must have accessible labels (`aria-label` or visible text)

### Adding components:
```bash
cd web
npx shadcn@latest add <component>
```

---

## Visual Design

- Generous whitespace, consistent spacing rhythm (4/8/16/24/32px scale)
- Prefer subtle over loud: muted backgrounds, low-contrast borders, restrained color
- Typography hierarchy must be clear: distinct weight between headings, body, and secondary text
- Interactive states are always designed: hover, focus, active, disabled
- Avoid visual noise: use space to separate, not borders or shadows
- Animations: 150–200ms for micro-interactions, ease-out curves, never decorative
- Every screen must work at mobile, tablet, and desktop

---

## State — Zustand

- Auth state lives in `store/auth.ts` — provides `user`, `loading`, `signIn`, `signUp`, `signOut`, `fetchUser`
- Selectors must be granular — subscribe only to the specific value needed
  - BAD: `const store = useAuthStore()`
  - GOOD: `const user = useAuthStore((s) => s.user)`
- Never store derived state in the store — compute it during render
- Actions are colocated inside the store, not defined outside
- For new domains, create new store files in `store/` (e.g., `store/settings.ts`)
- Store types must be fully typed (no `any`)

---

## i18n — react-i18next

- All user-facing strings must come from translation files — **no hardcoded text in components**
- Default language: English (`locales/en.json`)
- Use `const { t } = useTranslation()` in components
- Keys are structured by domain: `auth.signIn`, `form.email`, `home.welcome`
- Interpolation: `t('home.welcome', { name: user.name })`
- i18n is initialized in `lib/i18n.ts`, imported in `main.tsx`

### Adding new strings:
1. Add the key to `locales/en.json`
2. Use `t('namespace.key')` in the component

### Key structure:
```json
{
  "app": { ... },     // Global app strings
  "auth": { ... },    // Auth flow (signIn, signUp, errors)
  "form": { ... },    // Form labels and placeholders
  "home": { ... }     // Home page strings
}
```

### Rules:
- Keys are always English: `auth.signIn`, not `auth.entrar`
- All code identifiers (routes, components, variables) must be in English
- Translations live only in `locales/*.json` files

---

## Data Fetching — TanStack Query

- Never fetch data inside `useEffect` — use `useQuery` or `useMutation`
- Use `useQuery` for data that loads when the component mounts (GET requests)
- Use `useMutation` for user-triggered actions (POST, PUT, DELETE)
- Query keys must be structured arrays: `['entity', id, filters]` — never plain strings
- Use the `api()` wrapper from `lib/api.ts` as `queryFn` — it handles credentials and JSON
- API calls use relative paths (`/api/health`, not `http://localhost:8081/api/health`)
- Vite proxy forwards `/api` and `/auth` to the Go server (configured in `vite.config.ts`)
- Loading, error, and empty states come from query/mutation — no manual `useState` for these
- `QueryClient` is configured in `lib/query.ts`

### Example patterns:
```tsx
// Query (auto-fetches on mount)
const health = useQuery({
  queryKey: ['health'],
  queryFn: () => api<{ status: string }>('/api/health'),
})

// Mutation (triggered by user action)
const message = useMutation({
  mutationFn: () => api<{ message: string }>('/api/message'),
})
// usage: message.mutate(), message.data, message.isPending, message.isError
```

---

## Auth Pattern

- `useAuthStore` (`store/auth.ts`) provides: `user`, `loading`, `signIn`, `signUp`, `signOut`, `fetchUser`
- `fetchUser()` is called once in `App.tsx` on mount to check existing session
- Wrap authenticated routes with `<ProtectedRoute>` in `App.tsx`
- `ProtectedRoute` shows loading state while checking session, redirects to `/login` if unauthenticated
- Auth API calls: `POST /auth/sign-in`, `POST /auth/sign-up`, `POST /auth/sign-out`, `GET /auth/me`

---

## TypeScript

- Strict mode always on
- No `any` — use `unknown` and narrow, or proper generics
- Prefer `interface` for object shapes, `type` for unions and intersections
- Never cast with `as` unless absolutely necessary — add a comment if you do

---

## File Structure

```
web/src/
├── App.tsx                  # React Router setup
├── main.tsx                 # Entry point (imports i18n)
├── index.css                # Tailwind + theme variables
├── store/
│   └── auth.ts              # Zustand auth store
├── locales/
│   └── en.json              # English translations
├── components/
│   ├── ProtectedRoute.tsx   # Auth guard wrapper
│   └── ui/                  # shadcn/ui primitives (do not edit)
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   └── HomePage.tsx
└── lib/
    ├── api.ts               # Typed fetch wrapper
    ├── i18n.ts              # i18next configuration
    └── utils.ts             # cn() class merge utility
```

- Pages are thin — mostly composition of components
- Shared logic goes in `lib/` or `store/`
- New pages: create in `pages/`, add route in `App.tsx`
- New strings: add to `locales/en.json`, use `t()` in component

---

## Linting — OXC (oxlint)

- Linter: `oxlint` (replaces ESLint) — config in `oxlintrc.json`
- Plugins enabled: `react`, `react-perf`, `typescript`, `import`, `unicorn`
- `components/ui/` is excluded from linting (shadcn/ui managed files)
- Run lint: `npm run lint`
- Run lint with auto-fix: `npm run lint:fix`
- All code must pass `npm run lint` with 0 warnings and 0 errors before committing

---

## Code Quality

- Functions and variables: `camelCase`. Components and types: `PascalCase`
- No comments explaining WHAT — only WHY
- Magic numbers and strings must be named constants
- `console.log` is banned in committed code
- Prefer early returns to reduce nesting (max 3 levels)
- All code identifiers in English
