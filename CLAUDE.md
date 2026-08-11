# Tègbalé Backend API

**Stack:** Node.js · Express · TypeScript · Prisma ORM · PostgreSQL · Socket.io · Cloudinary · Brevo/SMTP · Render

## Commands

```bash
npm run dev            # ts-node-dev watch mode (hot reload)
npm run build          # tsc compile → dist/
npm run start          # prisma migrate deploy + node dist/server.js  (used by Render)
npm run db:migrate     # prisma migrate dev (creates a new migration)
npm run db:migrate:prod # prisma migrate deploy (run pending migrations)
npm run db:generate    # regenerate Prisma client after schema change
npm run db:studio      # Prisma Studio GUI
npm run db:seed        # seed.ts
```

## Source Layout

```
src/
  server.ts              # HTTP + Socket.io server bootstrap
  app.ts                 # Express app, global middleware, route mounting
  config/
    env.ts               # all env vars parsed here — import { env } everywhere
    index.ts             # prisma client singleton
  modules/               # one directory per domain
    auth/
    classrooms/
    events/
    messages/
    notifications/
    parents/
    posts/
    school-requests/
    schools/
    staff/
    students/
    users/
  middleware/
    auth.ts              # verifyToken, requireRole(...)
    errorHandler.ts      # global Express error handler
    upload.ts            # multer config (memory storage)
    validate.ts          # Zod/Joi request validation wrapper
  gateway/               # Socket.io namespace + event handlers
  lib/                   # cloudinary.ts, email.ts (Brevo SMTP), helpers
  types/                 # shared TypeScript types / interfaces
  utils/                 # small pure utilities
prisma/
  schema.prisma          # single source of truth for all models
  migrations/            # never edit manually; use npm run db:migrate
  seed.ts
```

## Module Conventions

Each module follows this exact file pattern:
```
modules/<domain>/
  <domain>.routes.ts      # Express Router, role guards applied here
  <domain>.controller.ts  # thin — parse req, call service, send res
  <domain>.service.ts     # all business logic, all Prisma calls
  <domain>.schema.ts      # Zod validation schemas
```

- **Never** put DB calls in controllers.
- **Never** import Prisma client directly in controllers — go through the service.
- Use `req.user` (attached by `auth.ts` middleware) for the authenticated user context.
- Always return `{ success, message, data }` shaped responses.

## Auth & Roles

Role hierarchy (highest → lowest): `SUPER_ADMIN > SCHOOL_ADMIN > STAFF > TEACHER > PARENT`

- `verifyToken` middleware attaches `req.user` (id, role, schoolId).
- `requireRole(...roles)` guard — pass an array of allowed roles.
- `SUPER_ADMIN` has platform-wide access but has **no schoolId** in their JWT — endpoints that are school-scoped must accept `schoolId` from the request body/query for SUPER_ADMIN callers.
- `SCHOOL_ADMIN`/`STAFF`/`TEACHER`/`PARENT` derive `schoolId` from their JWT automatically.

## Infrastructure per Environment

| | Staging | Production |
|-|---------|------------|
| **Host** | Render (web service) | Digital Ocean (App Platform / Droplet) |
| **Database** | NeonDB (serverless Postgres) | DO Managed Postgres |
| **SMTP** | Mailgun sandbox | Mailgun (production domain) |
| **File storage** | Cloudinary | DO Spaces |
| **`STORAGE_PROVIDER`** | `cloudinary` | `spaces` |

## Environment Variables

Parsed in `src/config/env.ts`. Required vars throw at startup if missing:

| Variable | Staging value source | Production value source |
|----------|---------------------|------------------------|
| `DATABASE_URL` | NeonDB connection string | DO Managed Postgres URL |
| `JWT_ACCESS_SECRET` | Render env | DO env |
| `JWT_REFRESH_SECRET` | Render env | DO env |
| `SMTP_HOST` | `smtp.mailgun.org` | `smtp.mailgun.org` |
| `SMTP_PORT` | `587` | `587` |
| `SMTP_USER` | Mailgun sandbox SMTP user | Mailgun production SMTP user |
| `SMTP_PASS` | Mailgun sandbox SMTP password | Mailgun production SMTP password |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Cloudinary dashboard | N/A (use Spaces) |
| `DO_SPACES_KEY/SECRET/BUCKET/REGION` | N/A | DO Spaces credentials |
| `STORAGE_PROVIDER` | `cloudinary` | `spaces` |
| `CLIENT_ORIGINS` | Comma-separated staging URLs | Comma-separated prod URLs |

## Development Workflow

### Branching

- All feature work branches from `develop`: `git checkout develop && git pull && git checkout -b feat/<name>`
- Never branch from `main` or `staging` for features.
- PRs target `develop`; `develop` is merged into `staging` for testing; `staging` is merged into `main` for releases.

### Planning & decisions

- **Always list the plan and get approval before writing code** for any non-trivial task. Outline: which files change, what the approach is, what tradeoffs exist.
- **Ask before making design or technical decisions** — schema changes, API shape, auth patterns, library choices, breaking changes. Surface options with a recommendation; do not pick silently.

### Testing requirements for new features

Every new feature or endpoint must have:
1. **Unit tests** — pure service/utility logic in isolation.
2. **Functional tests** — controller + service integration (HTTP layer via `supertest`, no live DB).
3. **Feature tests** — end-to-end via Newman against staging (0 failures before merging).

Do not ship a feature with only a passing Newman run. Unit and functional coverage must exist.

## Testing & Postman

**Skills:** `/test-api` — run the suite · `/update-collection` — update collection JSON + re-import

**Collection file:** `Tegbale_API.postman_collection.json` (in this directory)

```bash
npx newman run Tegbale_API.postman_collection.json --timeout-request 20000
```

### Testing requirements

- **Newman must be green (0 failures) before merging any backend PR.**
- Run against staging — never against a mock or local-only DB.
- When adding a new endpoint: add a request folder entry + test scripts to the collection JSON, validate JSON, re-import into Postman.
- After a bug fix: push to staging, wait for Render deploy, then re-run Newman to confirm.
- The **Teardown** folder runs last — resets SUPER_ADMIN password to `Admin@1234` and logs out. Never move it.

### Collection variable chain

| Variable | Set by | Consumed by |
|----------|--------|-------------|
| `token` | Login | All auth'd requests |
| `refreshToken` | Login | Teardown → Logout |
| `schoolId` | Approve School Request | Schools, Staff, Classrooms, Students, Events, Posts |
| `staffId` | Create Staff | Get/Update/Delete/Toggle Staff |
| `classroomId` | Create Classroom | Assign Classroom |
| `studentId` | Create Student | Get/Update/Delete Student |

### Postman desktop import

**File → Import → select JSON → Replace** (do not duplicate). Do this after every collection change.

## Known Issues (2026-08-11)

1. **SMTP broken on staging** — `POST /auth/forgot-password` and `POST /auth/reset-password` return 500. `GET /auth/verify-smtp` times out. Most likely causes (check in order):
   - `SMTP_USER` / `SMTP_PASS` not set (or set to placeholders) in Render env dashboard.
   - Mailgun sandbox domain hasn't added the recipient email as an authorised address.
   - Render's outbound port 587 is blocked — try port 465 with `secure: true` in `src/lib/mailer.ts`.
   - The `password_reset_tokens` table missing from NeonDB staging — run `npx prisma migrate deploy` against the staging DB URL to confirm.
2. **SUPER_ADMIN 403 on Student writes** — ✅ Fixed in `students.routes.ts` (SUPER_ADMIN added to all write route guards).
3. **Idempotent delete inconsistency** — `DELETE /staff/:id` returns 200 even when the record is not found. Should return 404.

## Prisma Notes

- After any `schema.prisma` change: run `db:generate` then `db:migrate`.
- The baseline migration (`0001_baseline`) is idempotent — safe to re-run on existing DBs with `IF NOT EXISTS` guards.
- Never edit migration SQL files manually after they have been committed.

## Deployment

**Staging (Render):**
- Build command: `npm run build`
- Start command: `npm run start` (runs `prisma migrate deploy` then starts the server)
- Env vars set in Render dashboard.

**Production (Digital Ocean):**
- Same build/start commands.
- `STORAGE_PROVIDER=spaces` — file uploads go to DO Spaces instead of Cloudinary.
- Env vars set in DO App Platform / server env.
