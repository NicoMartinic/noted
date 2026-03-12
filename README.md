# Noted.

A full-stack note-taking application with categories, archiving, pinning, Markdown, and user profiles.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.2 · Django REST Framework · SimpleJWT · PostgreSQL 18 |
| Frontend | Next.js 14 (App Router) · TypeScript · Redux Toolkit · Redux-Saga |
| Forms | Formik · Zod |
| Markdown | react-markdown · remark-gfm |
| Styling | Tailwind CSS · Playfair Display + DM Sans |
| Testing | pytest · Jest · Playwright |
| Infra | Docker Compose · ASGI (uvicorn/gunicorn) · nginx |
| Observability | Sentry (optional) |
| CI | GitHub Actions |

---

## Features

- **Notes** — Create, edit, delete, archive, pin, and search notes
- **Markdown** — Write/Preview tabs with full GFM support (bold, italic, code blocks, tables, links)
- **Pinned notes** — Pin important notes to the top of every view
- **Note sorting** — Sort by last updated, created date, title A–Z/Z–A, or pinned-first
- **Categories** — Colour-coded categories; note-count badge shown in sidebar
- **Search** — Full-text search across title and content, debounced at 350ms
- **Pagination** — Server-side, configurable page size
- **Archive** — Separate archived view; restore at any time
- **Profile** — Change username and/or password with current-password verification
- **Dark mode** — System-aware, toggle in sidebar
- **Health check** — `GET /api/health/` returns DB status; used by Docker and nginx

---

## Quick Start

**Prerequisites:** Docker and Docker Compose.

```bash
git clone https://github.com/YOUR_USERNAME/noted.git
cd noted
cp .env.development.example .env
docker compose up --build
# App → http://localhost:3000
# API → http://localhost:8000/api/
```

Migrations run automatically on backend startup via `entrypoint.sh`.

---

## Project Structure

```
noted/
├── backend/
│   ├── apps/
│   │   ├── authentication/   # register, login, logout, refresh, CSRF
│   │   ├── categories/       # CRUD, per-user unique titles
│   │   ├── notes/            # CRUD, search, archive, pin, ordering
│   │   ├── users/            # profile & password update
│   │   └── core/             # shared helpers, health check endpoint
│   ├── config/               # Django settings, URLs, ASGI
│   └── tests/                # pytest suite
├── frontend/
│   ├── public/               # Static assets (required for Next.js build)
│   ├── src/
│   │   ├── app/              # Next.js App Router pages + api-proxy route handler
│   │   ├── components/       # UI primitives and feature components
│   │   │   └── notes/        # NoteCard · NoteForm · MarkdownContent
│   │   ├── sagas/            # Redux-Saga async logic
│   │   ├── store/            # Redux slices, actions, root store
│   │   └── services/api.ts   # Axios instance (baseURL = /api-proxy)
│   └── e2e/                  # Playwright end-to-end tests
├── nginx/nginx.conf          # Reverse proxy for production
├── docker-compose.yml
├── docker-compose.production.yml
├── Makefile
├── .pre-commit-config.yaml
└── .github/workflows/
    ├── backend-ci.yml
    └── frontend-ci.yml
```

---

## Makefile shortcuts

```bash
make up          # Start dev stack
make down        # Stop all services
make test        # Run all unit tests (backend + frontend)
make test-e2e    # Run Playwright e2e suite
make lint        # flake8 + ESLint
make format      # black + isort (auto-fix backend)
make typecheck   # TypeScript tsc --noEmit
make migrate     # Apply Django migrations
make shell-backend  # Shell into backend container
make prod-up     # Start production stack
```

---

## Architecture Notes

### API Proxy

All browser requests go to `/api-proxy/*` on the Next.js origin. A Route Handler at
`src/app/api-proxy/[...path]/route.ts` forwards them server-side to `BACKEND_URL/api/*`.

Benefits:
- **No CORS** — the browser never talks directly to Django.
- **HttpOnly cookies** — the Route Handler copies all `Set-Cookie` headers explicitly,
  stripping `Domain=` and rewriting `Path=/` so the refresh token cookie works for all routes.
- **`BACKEND_URL` is runtime env** — set via `environment:` in docker-compose, not baked
  into the Next.js build, so the production container can reach `http://backend:8000`.

### Auth Flow

```
Register/Login  →  access token (Redux in-memory)
                →  refresh token (httpOnly cookie, Path=/)

Cold page load  →  POST /auth/refresh/ → GET /users/me/ → hydrate Redux
401 on request  →  queue request, refresh once, replay queue
```

### State Management

Redux Toolkit slices (`auth`, `notes`, `categories`, `ui`) with Redux-Saga handling all
async side effects. No `useEffect` API calls in components.

---

## Environment Variables

Copy `.env.development.example` → `.env` for local dev.

| Variable | Description | Dev default |
|----------|-------------|-------------|
| `SECRET_KEY` | Django secret key (≥32 bytes) | `dev-secret-key-…` |
| `DEBUG` | `1` = enabled | `1` |
| `DB_*` | PostgreSQL credentials | `notes_db / notes_user / notes_password` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `COOKIE_SECURE` | Secure flag on refresh cookie | `False` |
| `BACKEND_URL` | Internal URL used by Next.js proxy | `http://backend:8000` |
| `HTTPS_ENABLED` | Set to `1` once TLS is terminated by nginx/LB | `0` |
| `SENTRY_DSN` | Backend Sentry DSN (optional) | _(empty)_ |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend Sentry DSN (optional) | _(empty)_ |

For production: set `DEBUG=0`, generate a new `SECRET_KEY`, set `COOKIE_SECURE=True`,
`COOKIE_SAMESITE=Strict`, and `HTTPS_ENABLED=1` only after SSL is configured.

---

## Testing

### Backend — pytest

```bash
docker compose run --rm backend pytest -v
# or: make test-backend
```

Covers authentication, notes CRUD, notes ordering, pin/archive toggle, categories CRUD,
user profile updates, pagination, search, and health check endpoint.

Throttling is disabled in tests via a `disable_throttling` autouse fixture (swaps in `DummyCache`).

### Frontend — Jest (unit tests)

```bash
docker compose exec frontend npm test
# or: make test-frontend
```

Covers Redux slice reducers (including `togglePinSuccess`, ordering filter), Zod validation
schemas, and utility helpers.

Config: `jest.config.ts` + `jest.setup.ts` (using `@testing-library/jest-dom`).

### Frontend — Playwright (end-to-end)

```bash
docker compose up -d
docker compose --profile e2e run --rm playwright
# or: make test-e2e
```

The Playwright service uses the official `mcr.microsoft.com/playwright` image with all
browsers pre-installed. The `e2e/` directory is mounted as a volume so test changes are
picked up without rebuilding the image.

Tests run with `workers: 1` and `timeout: 60_000` (cold Next.js compile can take ~30s on
first run; subsequent tests resolve in <3s).

#### How the e2e tests work

**`e2e/helpers.ts`** — shared utilities:

- `uniqueUser()` — timestamp-based credentials; each test gets a fresh isolated user.
- `registerUser(page, username, password)` — waits for the Username input to be visible
  (confirms React has hydrated), fills the form, and waits for redirect to `/notes`.
- `loginUser(page, username, password)` — same pattern for `/login`.

| File | Scenarios |
|------|-----------|
| `auth.spec.ts` | Register → redirect; duplicate username; wrong password; logout; unauthenticated redirect |
| `categories.spec.ts` | Create; duplicate error; modal closes on success; delete with confirmation |
| `notes.spec.ts` | Create + appears in list; search; archive → archived section; delete from card |
| `profile.spec.ts` | Password change success; wrong current password error |

**Key details:**
- Note creation uses `Promise.all([waitForResponse(201), click()])` for backend confirmation.
- `AuthRateThrottle.allow_request()` returns `True` when `settings.DEBUG`, so e2e tests never hit 429.
- `retries: 1` (non-CI) gives one automatic retry for flaky cold-start cases.

---

## API Reference

All endpoints are prefixed with `/api/`.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/csrf/` | Fetch CSRF token |
| `POST` | `/auth/register/` | Create account |
| `POST` | `/auth/login/` | Login → access token + refresh cookie |
| `POST` | `/auth/logout/` | Logout, clears cookie |
| `POST` | `/auth/refresh/` | Refresh access token via httpOnly cookie |

### Notes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/notes/` | List (paginated; `?search=`, `?is_archived=`, `?ordering=`) |
| `POST` | `/notes/create/` | Create |
| `GET` | `/notes/{id}/` | Get single note |
| `PUT` | `/notes/{id}/update/` | Update |
| `DELETE` | `/notes/{id}/delete/` | Delete |
| `PATCH` | `/notes/{id}/archive/` | Toggle archive |
| `PATCH` | `/notes/{id}/pin/` | Toggle pin |

**Ordering values:** `-updated_at` (default), `-created_at`, `created_at`, `title`, `-title`, `pinned`

### Categories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/categories/` | List (supports `?ordering=-notes_count`, `?search=`) |
| `POST` | `/categories/create/` | Create |
| `PUT` | `/categories/{id}/update/` | Update |
| `DELETE` | `/categories/{id}/delete/` | Delete |

### Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users/me/` | Get current user |
| `PUT` | `/users/me/update/` | Update username and/or password |
| `GET` | `/api/health/` | DB health check (200 ok / 503 degraded) |

---

## CI/CD — GitHub Actions

Two workflows trigger on every push and pull request.

### `.github/workflows/backend-ci.yml`
1. Spins up PostgreSQL 15 service container
2. Installs Python dependencies
3. **flake8** (lint) → **black** (format check) → **isort** (import order)
4. **pytest** full test suite

### `.github/workflows/frontend-ci.yml`
1. Installs Node dependencies
2. **ESLint** + **TypeScript** type-check
3. **Jest** unit tests with coverage
4. On push to `main`/`develop`: **Playwright** e2e suite via Docker Compose

---

## Production Deployment

```bash
cp .env.production.example .env.production
# Edit: SECRET_KEY, passwords, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, COOKIE_SECURE=True

docker compose -f docker-compose.production.yml up --build -d
```

The production stack adds an **nginx** reverse proxy on port 80/443 with:
- Security headers (X-Frame-Options, HSTS, CSP)
- Gzip compression
- Rate limiting on `/api/` routes
- Ready for SSL — uncomment the HTTPS server block and mount your certificates,
  then set `HTTPS_ENABLED=1` in `.env.production`

---

## Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

Runs on every `git commit`: trailing whitespace, black, isort, flake8 (Python) and
ESLint + tsc (TypeScript).

---

## Development Process

This project was built iteratively in a series of focused sessions, each with a clear goal:

**Session 1 — Core architecture.** Established the full-stack foundation: Django REST API with JWT authentication, Next.js frontend with Redux + Redux-Saga, and the API proxy pattern that makes HttpOnly cookies work across services without CORS issues.

**Session 2 — Feature completion.** Built out all CRUD surfaces (notes, categories, users), implemented pagination, search, archive, dark mode, and the complete UI. Integrated Formik + Zod for form validation with field-level error propagation from the backend.

**Session 3 — Test infrastructure.** Wrote the full pytest backend suite, Jest unit tests for Redux reducers and Zod schemas, and 15 Playwright end-to-end tests covering every critical user journey. This session involved significant debugging — cold Next.js compilation races, httpOnly cookie path mismatches, React hydration timing, and Django throttle overrides that bypassed global settings.

**Session 4 — Polish and hardening.** Added the 13 improvements: `is_pinned` field and pin endpoint, note ordering API, Markdown editor with preview, category note-count badges, health check endpoint, Sentry integration, nginx reverse proxy, `.env` example files, Makefile, pre-commit hooks, and security headers.

**Session 5 — Production fixes.** Resolved nginx startup failure (upstream directives must live inside `http {}` — solved by using `conf.d/` mounting instead of replacing the root config), and the `SECURE_SSL_REDIRECT` 301 loop on Docker health checks (decoupled SSL redirect from `DEBUG`, gated behind an explicit `HTTPS_ENABLED=1` env var).

---

## Key Design and Technical Decisions

**API proxy over Next.js rewrites.** Next.js `rewrites` in `next.config.js` silently drop `Set-Cookie` response headers, making httpOnly cookie auth impossible. The Route Handler proxy solves this by copying headers explicitly. It also rewrites cookie `Path=` from `/api/auth/` to `/` so the refresh token is sent on all proxy routes, not just auth ones.

**Redux-Saga over React Query or SWR.** This app has complex async flows — token refresh queuing, replaying failed requests after a 401, coordinated side effects between auth and data loading. Sagas express these as readable sequential generator functions. React Query would require custom retry logic and shared interceptors to achieve the same result.

**Timestamp-based e2e test isolation.** Each Playwright test calls `uniqueUser()` which generates credentials like `testuser_1741234567890`. Tests never share state, never need database cleanup between runs, and can run in any order. The trade-off is that test databases accumulate users — acceptable for a dev stack.

**`BACKEND_URL` as runtime env, not build arg.** Next.js `output: 'standalone'` bakes environment into the build. The API proxy reads `process.env.BACKEND_URL` at request time (server-side), so it must be set as a Docker `environment:` variable at runtime — not just a `build.args` entry. Both are needed: the ARG for the build stage, the ENV for the running container.

**`HTTPS_ENABLED` decoupled from `DEBUG`.** `SECURE_SSL_REDIRECT = not DEBUG` seems obvious but creates a redirect loop in production Docker: the health check probe, the internal proxy, and inter-service traffic all use plain HTTP even when the public site is HTTPS. The fix is an explicit opt-in: set `HTTPS_ENABLED=1` only after TLS termination is confirmed at the nginx layer.

**nginx conf.d over full nginx.conf replacement.** The official nginx Docker image's root `nginx.conf` already contains the `http {}` wrapper and includes `conf.d/*.conf` inside it. Mounting a replacement `nginx.conf` that contains `upstream {}` at the top level causes "directive not allowed here" errors. Mounting into `conf.d/` is the correct pattern and requires no changes to the base image behaviour.

**Soft black/isort enforcement via pre-commit, strict in CI.** Local commits are formatted automatically. CI runs `--check` mode and fails the build if formatting diverges. This means contributors are never blocked by style issues locally, but unformatted code cannot merge.

---

## AI Tools Used

This project was developed through an extended series of sessions using **Claude (Anthropic)** as a pair-programming assistant.

**How it was used:**

- **Architecture design.** I designed the overall architecture and discussed key decisions with Claude before implementing them. This included the API proxy pattern, the Redux-Saga approach for token refresh queuing, and the JWT + httpOnly cookie split. Claude helped evaluate trade-offs and refine the implementation details.

- **Code implementation.** I used Claude to help generate and iterate on code based on the requirements I defined. This included Django views and serializers, Redux slices and sagas, React components, Tailwind styling, Docker configuration, nginx configuration, and GitHub Actions workflows.

- **Debugging.** Claude was particularly useful for analyzing complex failures. By sharing Docker logs, pytest output, and Playwright traces, I was able to work through root-cause analysis with Claude. For example, issues like cookies not being sent due to mismatched `Path` values between Django and the proxy routes were identified during these debugging sessions.

- **Iterative development.** Development progressed incrementally across multiple sessions. I provided the evolving codebase and requirements, and Claude assisted with targeted updates and fixes to specific files rather than regenerating large sections of the project.

- **Limitations.** Claude could not execute the code directly, so all fixes had to be tested locally using Docker. This required running the code, capturing logs or errors, and feeding that information back into the conversation. Some issues required several iterations to isolate the root cause, and maintaining awareness of the latest file versions during long debugging sessions was necessary.

---