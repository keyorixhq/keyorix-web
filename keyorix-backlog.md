# Keyorix Backlog
### Single source of truth for all open items. Updated at end of every session.
### Last updated: May 2026 (post context-system rebuild + frontend cleanup session)

Load this file in every session type alongside the relevant L2 file.

---

## 🔴 This Week (critical — pipeline at risk)

- [ ] **Send 5 Vault health assessment outreach messages** — LinkedIn, ex-Microsoft network, conference contacts. Use Template C in `keyorix-gtm.md`. Without this, first customer August 2026 slips.
- [ ] **Follow up on LOI 5** — still pending. No action taken yet.

---

## 🟡 M1 — Before First Paying Customer (target: August 2026)

### Sales & Legal
- [ ] **Keyorix SL incorporation** — follow up with gestoria. Can invoice as autónomo before SL is complete.
- [ ] **LOI formalisation** — convert verbal LOIs to signed one-page letters. Templates exist: `keyorix-loi-template-en.docx`, `keyorix-loi-template-es.docx`.
- [ ] **Pricing model in writing** — decided but not yet customer-facing. Write one-page pricing sheet.
- [ ] **Design partner agreement template** — written agreement for early-access customers.
- [ ] **Support mailbox** — verify `support@keyorix.com` exists and is monitored. OpenAPI spec references it.

### Frontend (demo-blocking)
- [ ] **Fix create secret modal** — Headless UI v1.7 focus trap bug closes modal on input click. Options: upgrade to v2.x, add `initialFocus` ref, or replace with custom portal modal.
- [ ] **Fix share secret submit** — returns error (API endpoint mismatch). Blocks sharing demo.
- [ ] **Wire user management page** — currently mock. Wire to real API for admin demo.

### Backend
- [ ] **Dashboard activity feed endpoint** — frontend calls `GET /api/v1/dashboard/activity`, returns 404. Implement backend endpoint.
- [ ] **`keyorix system init` rewrite** — should be server-side bootstrap: create admin user, default namespace/zone/3 environments, print connection instructions. Idempotent. Write ADR first — do NOT patch incrementally.
- [ ] **Wire encryption `Initialize(passphrase)` to server startup** — `server/main.go` never calls `Initialize()`. KEK derivation not wired to startup. Needs env var or config passphrase source before enterprise POC.

### Security (before enterprise POC)
- [ ] **AAD binding in GCM** 🟡 — pass `secretID + namespaceID + versionNumber` as AAD to `gcm.Seal()`.
- [ ] **KEK rotation re-encryption sweep** 🟡 — current `RotateKEK()` is key proliferation, not rotation. Write ADR first.
- [ ] **Triage gosec + govulncheck findings** — reports in `/Users/andreibeshkov/dev/keyorix/keyorix/security/scans/`. Review, document accepted risks.
- [ ] **Test coverage baseline** — `cd /Users/andreibeshkov/dev/keyorix/keyorix && go test -coverprofile=coverage.out ./...`
- [ ] **Threat model document** — written, reviewable by external security engineer.
- [ ] **CSP `unsafe-eval` inconsistency** — `csp.conf` has it, `security-headers.conf` does not. Resolve before public launch.
- [ ] **`security/compliance/`** — create: data flow diagram, NIS2/DORA controls statement, security FAQ. Currently empty.
- [ ] **"Secretly" rebrand** — verify no files still reference old product name across all repos.

### GitHub
- [ ] **GitHub stars** — 0 currently. Goal: 50-100 before KubeCon EU. Plan: HN Show HN, r/devops, r/netsec, OpenBao/HashiCorp alumni communities.

---

## 🟠 M2 — Seed Round Readiness

### Product
- [ ] **OIDC service account auth** — Kubernetes workloads authenticate via projected service account tokens. No static credentials in cluster.
- [ ] **Secret rotation trigger** — manual rotation via UI button. Prerequisite for rotation state inspector.
- [ ] **Rotation state inspector** — show rotation progress, last timestamp, success/failure reason. Nobody in market has this.
- [ ] **Short-lived tokens with silent auto-refresh** — add `expires_at` to sessions table, add `/auth/refresh` endpoint.
- [ ] **Secrets usage analytics dashboard** — surface `secret_access_logs`: most accessed, by which services, flag unused 30/60/90 days. Data already in DB.
- [ ] **Secrets health score** — per-secret risk score: age, access frequency, users with access, expiry status. Dashboard widget.
- [ ] **Cross-environment drift detection** — compare secrets across dev/staging/prod, surface mismatches. Visibility only in v1.
- [ ] **Soft delete storage + service layer** — `SoftDeleteConfig` + `PurgeConfig` exist in config, not wired. Use `SecretVersion` as restore source. Write ADR first.
- [ ] **gRPC protobuf service registration** — infrastructure complete, proto not wired. `/Users/andreibeshkov/dev/keyorix/keyorix/server/grpc/server.go`.
- [ ] **Verify `keyorix.com/install.sh`** — end-to-end test on clean machine.

### Sales & Operations
- [ ] **Technical co-founder written spec** — equity framework, vesting schedule, role definition. Use for OpenBao outreach (Template D in `keyorix-gtm.md`).
- [ ] **OpenBao community outreach** — identify 5 target contributors, send Template D.
- [ ] **September 2026 calendar reminder** — re-engage LOI 3 + LOI 4 for Q1 2027 budgets.
- [ ] **OSINT cadence** — formalise weekly competitor monitoring (Perplexity + Claude).

### Security & Compliance
- [ ] **OpenAPI spec** — autogenerate or write by hand. Publish with next release.
- [ ] **ADR backfill** — document already-made decisions: cipher choice, GORM, Cobra, dual licence, GitHub Flow.

### Clearway CA Partnership
- [ ] **Technical call** — REST API surface? Pricing? Open to joint customer intro?
- [ ] **Referral arrangement** — 15-20% revenue share on referred deals.
- [ ] **Joint pitch doc** — "Complete secrets + certificate stack, fully on-premise, European, GDPR-native."
- [ ] **Warm intro** — ask for intro to one of his existing enterprise customers.

---

## 🔵 M3 — Post-Seed / 2027

### Product (requires technical co-founder)
- [ ] **KeyProvider interface** — define in `/Users/andreibeshkov/dev/keyorix/keyorix/internal/crypto/`. File, env var, wrapped KEK providers + resolver + migration tooling. See `keyorix-security.md`.
- [ ] **Kubernetes operator / Helm chart**
- [ ] **Dynamic secrets** — on-demand credentials with TTL for PostgreSQL, MySQL, AWS, GCP, Azure.
- [ ] **Keyorix Connect** — federation with Azure Key Vault, AWS SM, HashiCorp Vault. Enterprise commercial tier only.
- [ ] **Secret migration tool** — import from Vault, AWS SM, Azure KV, .env files.
- [ ] **CI/CD integrations** — GitHub Actions, GitLab CI, CircleCI. Docs + service token examples.
- [ ] **HA strategy** — PgBouncer vs Patroni vs managed PostgreSQL. ADR required.
- [ ] **Anomaly detection ML** — Isolation Forest. Target: mid-2027.
- [ ] **Automated rotation planning** — AI proposes rotation sequence. Requires secret dependency tracking first.
- [ ] **FinOps/billing module** — usage by team/namespace, chargeback reporting, license management UI.
- [ ] **Frontend rewrite** — shadcn/ui, keep React Query, drop Zustand + custom formStore. Wait for co-founder.
- [ ] **ENS certification** — Spain national security scheme. Architecture already aligned.
- [ ] **KeyProvider Tier 2** — OS Keychain, AWS/GCP/Azure KMS, Kubernetes ServiceAccount, TPM.

### ENISA (3-year review)
- [ ] **ENISA progress narrative** — running log of AI feature plans vs actuals. Update quarterly.
- [ ] **Anomaly detection ML** — Isolation Forest, mid-2027.

---

## ⏳ Deferred (explicit decision — do not build until conditions met)

| Item | Condition to revisit |
|---|---|
| **HRPS Identity Acceleration Layer** | 10+ paying customers + distributed systems co-founder + seed closed |
| **NLP query interface** | ICP expands to non-technical buyers |
| **SaaS offering** | 3 paying on-prem customers first |
| **K8s secrets firewall** | Dropped — K8s service account auth covers the real need |
| **Biometric/TouchID daemon** | Dropped — consumer pattern, wrong buyer |
| **Separate product for anything** | Dropped — solo founder, features not products |

---

## ✅ Recently Completed (April–May 2026)

- [x] PostgreSQL integration — 31 models, auth flow, CRUD, versioning, encryption verified
- [x] Dashboard trends and expiry alerts
- [x] Go/Python/Node/Java SDKs with petstore examples
- [x] Install script (`keyorix.com/install.sh`)
- [x] v0.1.0 release
- [x] `keyorix connect` command
- [x] Envelope encryption — ADR-004, PBKDF2 passphrase-derived KEK, never written to disk
- [x] Constant-time token comparison — `crypto/subtle`
- [x] Encryption-disabled startup warning — loud banner in `NewService()`
- [x] Anomaly detection statistical baseline — 3 rules: `off_hours`, `new_ip`, `new_user`
- [x] MCP server — shipped at `github.com/keyorixhq/keyorix-mcp`, 8 tools registered
- [x] Secret scanner CLI — `keyorix secret scan`, `explain`, `fix`
- [x] Binary split — `keyorix` (CLI) + `keyorix-server`
- [x] Docker Compose with auto-seeding (admin/Admin123!, 3 environments)
- [x] Real session auth — validates against PostgreSQL sessions table
- [x] Audit log page wired in web UI
- [x] `keyorix --version` flag
- [x] `security/ssl/key.pem` — confirmed never committed to git
- [x] gosec + govulncheck baseline scans — reports in `security/scans/`
- [x] **L2 context system built** — `keyorix-core.md`, `keyorix-product.md`, `keyorix-gtm.md`, `keyorix-strategy.md`, `keyorix-security.md`, `keyorix-backlog.md`, `keyorix-session-starters.md`, `CLAUDE.md` written to `/Users/andreibeshkov/dev/keyorix/`
- [x] **L2 files synced to Bible v1.4** — 3 critical security fixes ticked off, new CLI commands added
- [x] **Filesystem MCP confirmed** — Claude Desktop reads files directly, no manual attachment needed
- [x] **Frontend repo clarified** — `keyorix-web/` is canonical, stale root-level copy deleted (src/, public/, e2e/, docs/, Dockerfile, docker-compose.yml, all root config files)
- [x] **Env files moved** — `.env.development`, `.env.production`, `.env.example` → `keyorix-web/`
- [x] **Frontend build fixed** — 3 dead Kiro files deleted, `react-hook-form` pinned to 7.43.1, build command → `vite build`. Clean build: 647 modules, 1.67s
- [x] **Frontend + backend working together** — `docker compose up` in `keyorix/` + `npm run dev` in `keyorix-web/`, login confirmed end to end
