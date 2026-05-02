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

## Frontend — Page Status (`keyorix-web`, post-refactor May 2026)

| Page | API wired | Status |
|---|---|---|
| Login | ✅ | Real — auth store, token refresh, /auth/me validation on load |
| Dashboard | ✅ | Real — stats + activity feed wired |
| Secrets list | ✅ | Real — create, edit, delete (single + bulk), rotate, share all working |
| Sharing management | ✅ | Real — list, delete, self-remove wired |
| Audit log | ✅ | Real — wired to `audit_events` table |
| Admin | ❌ | Stub — "enterprise tier" placeholder, no mock data, no API calls |
| Analytics | ❌ | Removed — no backend, recharts dependency removed |
| Profile | ❌ | Stub |

**Tech stack:** React 18 + TypeScript, TanStack Query, Zustand (authStore + uiStore only), React Router v6, Axios, Zod + react-hook-form, Tailwind CSS, Vitest + Playwright. Dockerised with nginx.

**Canonical location:** `/Users/andreibeshkov/dev/keyorix/keyorix-web/` — separate git repo.

### Frontend architecture (post-refactor, May 2026)

**Deleted:**
- `formStore`, `appStore`, `preferencesStore`, `notificationStore` — replaced with react-hook-form and local useState
- `AnalyticsPage`, `AdminDashboardPage`, `UserManagementPage` — no backend, mock data only
- `components/activity/`, `components/features/`, `components/admin/`

**Removed dependencies:** `recharts`, `i18next`, `react-i18next`, `date-fns`

**Added:** `src/features/secrets/` — `useSecretsList.ts`, `useSecretReveal.ts`, `SecretTableRow.tsx`

**Simplified:** `uiStore` trimmed to sidebar + modal state only. `authStore` validates session on load via `/auth/me` — tampered localStorage token no longer bypasses login.

**Bundle:** 233 kB → 152 kB (35% reduction)

**Known gaps:**
- No `.eslintrc` config — add before co-founder joins
- 24 pre-existing test failures — broken mock setup + i18n infrastructure removed. Delete or rewrite before seed round due diligence
- Bulk share disabled (backend does not support sharing multiple secrets in one call) — tooltip shown

**Build status (May 2026):** `tsc` produces type errors — root cause is `@types/react` ts5.0 subfolder conflicting with TypeScript 4.9.5. Build command is `vite build` (skips `tsc`). Runtime unaffected. Full type safety to be restored in the shadcn/ui rewrite.

**Technical debt:** Frontend rewrite with shadcn/ui deferred until technical co-founder joins. Do NOT fix incrementally.

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

## Current Demo State (May 2026)

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

| Feature | Status | Demo-able? |
|---|---|---|
| Login / auth | ✅ Working | ✅ Yes |
| Dashboard with real stats | ✅ Working | ✅ Yes |
| Secrets list | ✅ Working | ✅ Yes |
| Secret reveal | ✅ Working | ✅ Yes |
| Create secret via web UI | ✅ Working | ✅ Yes |
| Edit secret via web UI | ✅ Working | ✅ Yes |
| Delete secret (single) | ✅ Working | ✅ Yes |
| Delete secret (bulk) | ✅ Working | ✅ Yes |
| Rotate secret via web UI | ✅ Working | ✅ Yes |
| Share secret modal | ✅ Working | ✅ Yes |
| Audit log page | ✅ Working | ✅ Yes |
| Admin page | ⚠️ Stub | ⚠️ Not for demo |
| `keyorix run` | ✅ Working | ✅ Yes |
| `keyorix secret import` | ✅ Working | ✅ Yes |
| `keyorix secret export` | ✅ Working | ✅ Yes |
| Docker Compose with auto-seeding | ✅ Working | ✅ Yes |

---

## Roadmap Priority (M1 focus)

**P1 — Before first paying customer:**
1. Wire user management page to real API
2. OIDC service account auth (CI/CD story)
3. Secret rotation trigger (manual, via UI)
4. `keyorix system init` rewrite (server-side bootstrap)

**P2 — Post-M1:**
5. gRPC protobuf registration
6. Soft delete storage + service layer (ADR first)
7. MCP server
8. Kubernetes operator

**Deferred (co-founder milestone):**
- Frontend rewrite with shadcn/ui
- FinOps/billing module
- `keyorix system init` full rewrite

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
