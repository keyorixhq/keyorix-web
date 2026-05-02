# Keyorix Product — L2 Reference
### Load for: coding sessions (backend or frontend), roadmap discussions, demo prep
### Covers: what's built, codebase reality, ADRs, roadmap, demo state, open items

---

## What's Built and Working (verified April 2026 code audit)

**Backend (`keyorix` Go repo):**
- Secret CRUD + versioning (every write creates numbered version, full history via API/CLI)
- Secret sharing between users and groups
- Chunked AES-256-GCM encryption (configurable chunk size)
- SQLite + PostgreSQL backends (same storage abstraction, both fully working)
- Session auth + API clients/tokens (all encrypted at rest)
- Full RBAC: roles, user/group-role assignments, permission enforcement at API level
- Two audit layers: `AuditEvent` (system-wide) + `SecretAccessLog` (per-secret)
- HTTP REST API (fully operational) + Swagger UI
- gRPC server infrastructure (TLS, interceptors done — protobuf service registration stubbed)
- Full CLI: secrets, users, groups, RBAC, sharing, auth, system init, audit, status, config
- i18n: English, Russian, Spanish, French, German
- `keyorix run` — injects secrets as env vars into any process ✅
- `keyorix secret import/export` — vault/dotenv/json formats + dry-run ✅
- `keyorix connect` command ✅
- `keyorix anomalies list` — anomaly detection, 3 rules: `off_hours`, `new_ip`, `new_user` ✅
- `keyorix secret scan [path]` — detects hardcoded secrets in source/config files, risk-scored HIGH/MEDIUM/LOW, `--report` JSON, `--import` to push into Keyorix ✅
- `keyorix secret explain <key>` — risk context, impact description, remediation example ✅
- `keyorix secret fix <key>` — replaces hardcoded value with env var reference in-place, dry-run by default ✅
- v0.1.0 released ✅
- Install script ✅

**Config-scaffolded but not implemented:**
- Soft delete / recycle bin (`SoftDeleteConfig` exists, no storage/service layer)
- Purge scheduler (`PurgeConfig` exists, not wired)

**Confirmed not started:**
- Dynamic secrets, KMS/HSM integration, HA/clustering, Kubernetes operator, gRPC proto registration

**SDKs (all shipped with petstore examples):**
- `keyorix-go`, `keyorix-python`, `keyorix-node`

---

## Frontend — Page Status (`keyorix-web`)

| Page | Status |
|---|---|
| Login | ✅ Real — auth store, token refresh |
| Dashboard | ✅ Stats + activity wired; system health = inline mock |
| Secrets list | ✅ Real — filtering, sorting, pagination, bulk actions, versioning |
| Sharing management | ✅ Real — list, delete, self-remove wired |
| Audit log | ✅ Real — wired to `audit_events` table |
| User management (admin) | ❌ Mock only |
| Admin dashboard | ❌ Mock — hardcoded stats |
| Analytics | ❌ Mock only |

**Known frontend bugs:**
- Create secret modal closes on input click (Headless UI v1.7 focus trap bug)
- Share secret submit returns error (API endpoint mismatch)
- Environment selector on secrets page not implemented

**Tech stack:** React 18 + TypeScript, React Query, Zustand, React Router v6, Axios, Zod + react-hook-form, Tailwind + Headless UI, Recharts, Vitest + Playwright. Dockerised with nginx.

**Canonical location:** `/Users/andreibeshkov/dev/keyorix/keyorix-web/` — separate git repo. No frontend files at parent directory root (cleaned up May 2026). Env files: `keyorix-web/.env.development`, `keyorix-web/.env.production`, `keyorix-web/.env.example`.

**Technical debt note:** Frontend has inconsistent API response handling, overlapping state management (Zustand + React Query + custom form store), type mismatches. Rewrite with shadcn/ui when technical co-founder joins. Do NOT fix incrementally.

**Build status (May 2026):** `tsc` produces 439 type errors across 55 files — root cause is `@types/react` ts5.0 subfolder conflicting with TypeScript 4.9.5, plus `exactOptionalPropertyTypes: true` cascade. Build command changed to `vite build` (skips `tsc`) so Vite bundles correctly. Runtime is unaffected — all type errors are compile-time only. Full type safety to be restored in the shadcn/ui rewrite.

**Vite build output (May 2026):** ✅ Clean. 647 modules, 1.67s. dist/assets: index.css 49kb, vendor 141kb, index 233kb, query 39kb, ui 38kb, router 19kb. Two non-blocking warnings: `"use client"` directive (harmless, Next.js artifact) and dynamic/static import mixing in api.ts (chunking advisory only).

---

## Architecture Decision Records

### ADR-004 — Envelope Encryption: Passphrase-Derived KEK (April 2026, decided + implemented)
KEK derived at startup from `KEYORIX_MASTER_PASSWORD` via PBKDF2-SHA256 (600k iterations). KEK never written to disk. DEK wrapped by KEK stored at `keys/dek.key`. Salt at `keys/kek.salt`.
v2: `KeyProvider` interface will abstract KEK source (see `keyorix-security.md`).

### ADR-003 — Binary Split (April 2026, decided)
Two binaries: `keyorix` (CLI, runs on laptops/CI) and `keyorix-server` (runs in datacenter).
Rationale: reduced attack surface, separate dependency trees, industry standard pattern.
```bash
make build-cli / make build-server / make build / make install-cli / make install-server
```

### ADR-002 — CLI Config Priority (April 2026, decided)
Priority order: env vars → `~/.keyorix/cli.yaml` → `keyorix.yaml` (server config, not CLI).
`keyorix connect --server --token` replaces `config set-remote` + `auth login`.

### ADR-001 — User Hierarchy: Project → Environment → Secret (April 2026, decided)
Backend has Namespace/Zone/Environment. Users see only Project → Environment → Secret.
"Namespace" = Project. "Zone" hidden (defaults to `default`).

---

## Codebase — Key Packages

| Package | Status |
|---|---|
| `internal/encryption/` | Working — see `keyorix-security.md` for issues |
| `internal/core/` | Working — business logic, permissions, versioning, sharing |
| `internal/storage/` | Working — factory, SQLite + PostgreSQL, remote client |
| `internal/config/` | Working — YAML, env vars, validation |
| `internal/cli/` | Working — Cobra |
| `server/http/` | Working — REST, Swagger, handlers |
| `server/grpc/` | Partial — interceptors done, proto not wired |
| `internal/i18n/` | Working — 5 languages |

**DB schema (AutoMigrate):** 25+ models — Namespace, Zone, Environment, User, Role, UserRole, Group, UserGroup, GroupRole, SecretNode, SecretVersion, SecretAccessLog, SecretMetadataHistory, ShareRecord, Session, PasswordReset, Tag, SecretTag, Notification, AuditEvent, Setting, SystemMetadata, APIClient, APIToken, RateLimit, APICallLog, GRPCService, IdentityProvider, ExternalIdentity.

**Security directory (verified May 2026):**
- `security/ssl/key.pem` — ✅ not tracked by git
- `security/scans/` — ✅ has gosec, govulncheck, semgrep, trivy, trufflehog, gitleaks reports
- `security/compliance/` — ❌ still empty
- CSP configs may still reference "Secretly" — verify before public launch

---

## Current Demo State (April 2026)

**Complete orphaned Vault demo — works end to end:**
```bash
docker compose up -d && sleep 15
keyorix config set-remote --url http://localhost:8080
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | jq -r '.data.token')
keyorix auth login --api-key $TOKEN
keyorix secret import --file vault-export.yaml --format vault --env production
keyorix run --env production -- node app.js
# Open http://localhost:8080/audit — shows every access logged
```

| Feature | Demo-able? |
|---|---|
| Login, dashboard, secrets list, reveal, edit, delete | ✅ Yes |
| Audit log page | ✅ Yes |
| `keyorix run`, import, export, create/list/get/delete | ✅ Yes |
| Docker Compose with auto-seeding | ✅ Yes |
| Create secret via web UI | ❌ Modal bug |
| Share secret modal | ❌ Submit broken |

---

## Roadmap Priority (M1 focus)

**P1 — Before first customer demo:**
1. Fix create secret modal (Headless UI focus trap)
2. Wire share secret submit
3. Wire user management page to real API

**P2 — Before first paying customer:**
4. OIDC service account auth (CI/CD story)
5. Secret rotation trigger (manual, via UI)
6. `keyorix system init` rewrite (server-side bootstrap, not local config wizard)

**P3 — Post-M1:**
7. gRPC protobuf registration
8. Soft delete storage + service layer (ADR first)
9. MCP server
10. Kubernetes operator

**Backlog (deferred):**
- FinOps/billing module (usage by team/namespace, chargeback reporting)
- Frontend rewrite with shadcn/ui (wait for co-founder)
- `keyorix system init` full rewrite (deferred — not incremental patch)

---

## ADRs Pending (write before implementing)

| Decision | Options |
|---|---|
| Soft delete restore | Via SecretVersion (recommended) vs separate recycle bin |
| gRPC service registration | Toolchain choice, timeline |
| HA strategy | PgBouncer vs Patroni vs managed PostgreSQL |

---

## What to Say to Prospects

*"We have a working API-first secrets manager that runs on your infrastructure, with full PostgreSQL support, secret versioning, RBAC, group-based access control, and two layers of audit logging. We are doing early-access design partner deployments."*

**Do not promise:** dynamic secrets, KMS integration, clustering, gRPC client support.
