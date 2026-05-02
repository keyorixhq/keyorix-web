# Keyorix Bible
### Version 1.4 — April 19, 2026 | Demo readiness session: environment selector, dashboard trends, expiry alerts, location column

> **ARCHIVED — Version 1.2, April 2026.** This file is frozen. The working reference documents are `keyorix-core.md`, `keyorix-product.md`, `keyorix-gtm.md`, `keyorix-strategy.md`, and `keyorix-security.md` — all in `~/dev/keyorix/`. Update those files, not this one. This Bible exists as a historical archive and onboarding reference only.

---

## Table of Contents

1. [Company Snapshot](#1-company-snapshot)
2. [Product — What Actually Exists](#2-product--what-actually-exists)
3. [Codebase Reality](#3-codebase-reality)
4. [AI Roadmap](#45-ai-roadmap)
5. [Encryption Model](#4-encryption-model)
6. [Architecture](#5-architecture)
7. [Business Context](#6-business-context)
8. [ICP and Target Market](#7-icp-and-target-market)
9. [Competitive Landscape](#8-competitive-landscape)
10. [SDLC Decisions](#9-sdlc-decisions)
11. [Licence Strategy](#10-licence-strategy)
12. [Open Items and Known Gaps](#11-open-items-and-known-gaps)
13. [Discovery Call Script](#12-discovery-call-script)
14. [Outreach Templates](#13-outreach-templates)
15. [GitHub Project Board — Definitions of Done](#14-github-project-board--definitions-of-done)
16. [Product Roadmap — Prioritised for Demo Readiness and First Customer](#16-product-roadmap--prioritised-for-demo-readiness-and-first-customer)
17. [Implementation Reference](#17-implementation-reference)

---

## 1. Company Snapshot

| Field | Detail |
|---|---|
| **Product name** | Keyorix |
| **One-liner** | Lightweight, on-premise secrets management for teams that can't use SaaS and won't maintain Vault |
| **Category** | Secrets management / PAM-adjacent |
| **Stage** | Early product — backend complete, web dashboard partial, pre-revenue |
| **Legal entity** | Keyorix SL — name approved, bank account opening April 2026, incorporation pending |
| **Domain** | keyorix.com |
| **GitHub** | github.com/keyorixhq |
| **Founder** | Solo — Microsoft Security PM background, enterprise sales, domain expertise |
| **Co-founder status** | Actively searching — target: OpenBao community / HashiCorp alumni |
| **Revenue today** | €0 ARR; bill-paying via Vault health assessment consulting |
| **LOIs** | 5 verbal — 2 declined (no pain), 2 declined (no budget, re-engage Sep 2026), 1 pending |
| **Primary geography** | Europe-first, data sovereignty angle |
| **Regulatory hook** | ENISA NIS2 / DORA alignment |

### Mission
Make enterprise-grade secrets management boring to operate. Not a research project. Not a compliance checkbox. Something a two-person DevOps team can deploy on a Friday afternoon and forget about by Monday.

### What we are not
- We are not a SaaS company. Air-gapped and on-premise is a feature, not a constraint.
- We are not targeting solo developers or startups. Too saturated, wrong buyer.
- We are not trying to clone Vault. We are trying to replace it for the 80% of enterprises that adopted it and now regret it.

---

## 2. Product — What Actually Exists

> **Note:** This section was rewritten after a code audit in April 2026. The original Bible was written from memory and significantly undersold the product. Everything below reflects what was verified in source code.

### Confirmed shipped and working

**Core secrets engine**
- Secret CRUD with full permission enforcement
- Secret versioning — every create and update generates a numbered version; full version history retrievable via API and CLI
- Secret sharing between users and groups
- Chunked encryption for large secrets (configurable chunk size)
- Soft delete config scaffolded — recycle bin and purge not yet implemented (see §11)

**Storage**
- SQLite backend — fully working, used for dev and single-node
- PostgreSQL backend — **fully implemented**, not a stub. Same storage abstraction serves both. Connection pooling configured. SSL mode defaults to `require`.
- Remote storage client — exists, used for client-mode deployments

**Auth and identity**
- Session management with encrypted session tokens
- API clients and API tokens — created, stored encrypted, retrievable
- Password reset flow
- Rate limiting per client
- API call logging
- Identity provider and external identity models in schema — SSO groundwork present, not wired

**RBAC and groups**
- Roles, user-role assignments, group-role assignments
- Group membership management
- Permission enforcement on secret operations — owners only can delete, sharing is permission-gated
- RBAC CLI: assign role, remove role, list roles, check permission, list permissions

**Audit**
- Two audit layers: `AuditEvent` (system-wide) and `SecretAccessLog` (per-secret read/write tracking)
- Audit service exists in gRPC services layer

**Transport**
- HTTP REST API — fully operational
- gRPC server — infrastructure complete (TLS, interceptor chain: auth, logging, recovery, metrics) but protobuf service registration is stubbed with TODOs. Not usable by clients yet.

**CLI**
- Full CLI for: secrets (create, get, list, update, delete, versions), users, groups, RBAC, sharing, auth, system init, audit, status, config
**Scanner**
- `keyorix secret scan [path]` — detects hardcoded secrets in source and config files; categorises by risk (HIGH/MEDIUM/LOW); distinguishes hardcoded-in-source vs config file vs .env; supports `--report` for JSON output and `--import` to push findings directly into Keyorix
- `keyorix secret explain <key>` — shows risk context, impact description, and language-appropriate remediation example for a named secret
- `keyorix secret fix <key>` — replaces hardcoded value with env var reference in-place, appends stub entry to `.env`, dry-run by default (`--dry-run=false` to apply); supports `--path` to target a specific directory

**Encryption**
- AES-256-GCM throughout
- Key manager with KEK + DEK lifecycle, rotation methods, memory wiping on shutdown
- See §4 for full encryption model and known issues

**Operational**
- File permission validation and auto-fix for key files
- i18n in 5 languages: English, Russian, Spanish, French, German
- Swagger UI available on HTTP server

### Config-scaffolded but not implemented
- Soft delete / recycle bin (`SoftDeleteConfig` exists, no storage or service layer behind it)
- Purge scheduler (`PurgeConfig` exists, not wired)

- Web dashboard (React) — ✅ Working end to end as of April 2026. Login, dashboard with real stats (secrets count, users, shares), secrets list, sharing management all functional against PostgreSQL backend. Admin and analytics pages remain mockups.

### Confirmed not started
- Dynamic secrets
- KMS / HSM integration
- HA / clustering
- Kubernetes operator / Helm chart
- gRPC protobuf service registration

### What to say to prospects right now
*"We have a working API-first secrets manager that runs on your infrastructure, with full PostgreSQL support, secret versioning, RBAC, group-based access control, and two layers of audit logging. We are doing early-access design partner deployments."*

**Do not promise:** dynamic secrets, KMS integration, clustering, web UI, or gRPC client support until those are explicitly complete.

### Customer Migration Journey — Scan → Import → Run → Govern

The complete on-premise migration path from legacy secrets to Keyorix:

**Step 1 — Scan (🔴 not yet built)**
```
keyorix scan /path/to/project
```
Finds all secrets: hardcoded in source, .env files, config files.
Risk-scored output. Feeds directly into import.

**Step 2 — Import (✅ exists)**
```
keyorix import --from-scan
```
All discovered secrets migrated into Keyorix in one command.
Dashboard populated with real data immediately — no empty state.

**Step 3 — Run (✅ exists)**
```
keyorix run --env production -- node app.js
```
Keyorix injects secrets as environment variables. Zero app code changes.
Old .env file can be deleted. App still works.

**Step 4 — Govern (✅ exists)**
```
keyorix anomalies list  → anomaly detection active
keyorix audit           → full access audit trail
keyorix secret rotate   → rotation without touching apps
Dashboard              → expiry alerts, security panel, stats
```

**The sales narrative:**
*"Run one command to find all your secrets. One command to import them. One command to inject them into your apps without changing a line of code. Then full audit, rotation, and anomaly detection from day one."*

**Gap to close:** `keyorix scan` is the only missing piece. Everything else is shipped.

---

## 3. Codebase Reality

> **Audit status:** Backend encryption package, storage factory, and core service audited directly from source. Web frontend pages and services layer audited. Full codebase review by technical co-founder still required.

### Three repositories

| Repo | Purpose | Status |
|---|---|---|
| `keyorix` | Go backend — API server, CLI, encryption, storage | Working — see packages below |
| `keyorix-web` | React web dashboard | Partial — see breakdown below |
| `keyorix-landing` | Static marketing site | Production-ready, Netlify-deployed, bilingual EN/ES |

**`security/` directory — audited April 2026:**

| Folder | Contents | Status |
|---|---|---|
| `ssl/` | Self-signed localhost dev cert + private key + openssl.conf | ✅ Fixed April 2026 — key was never committed. Cert regenerated: 4096-bit RSA, org Keyorix, jurisdiction ES/Valencia/Valencia |
| `policies/` | nginx security headers config + CSP config | ✅ Headers solid; CSP has `unsafe-eval` inconsistency |
| `compliance/` | Empty | ❌ No compliance documentation exists yet |
| `scans/` | Empty | ❌ No vulnerability scan reports exist yet |

**Note:** SSL cert and CSP configs reference organisation name **"Secretly"** — the previous product name. Rebrand artifact. Audit all three repos for remaining references before any public launch or due diligence.

---

### `keyorix` — Go backend

| Package | Purpose | Status |
|---|---|---|
| `internal/encryption/` | Key manager, AES-256-GCM, auth encryption | Working — see §4 for issues |
| `internal/core/` | Business logic, permission enforcement, versioning, sharing | Working |
| `internal/storage/` | Factory, SQLite + PostgreSQL drivers, remote client | Both DB backends working |
| `internal/config/` | YAML config, env var resolution, validation | Working |
| `internal/cli/` | Full CLI via Cobra | Working |
| `server/http/` | REST API, Swagger, handlers | Working |
| `server/grpc/` | gRPC server infrastructure | Partial — interceptors done, proto not wired |
| `internal/i18n/` | Internationalisation | Working, 5 languages |

**Language and runtime:** Go throughout. GORM for ORM, Cobra for CLI. No JVM, no Python, no Node runtime in the backend. Single binary target is achievable.

**Database schema (confirmed via AutoMigrate):** 25+ models — Namespace, Zone, Environment, User, Role, UserRole, Group, UserGroup, GroupRole, SecretNode, SecretVersion, SecretAccessLog, SecretMetadataHistory, ShareRecord, Session, PasswordReset, Tag, SecretTag, Notification, AuditEvent, Setting, SystemMetadata, APIClient, APIToken, RateLimit, APICallLog, GRPCService, IdentityProvider, ExternalIdentity.

**Tests:** Unit and integration tests across core, encryption, CLI, HTTP, and gRPC packages. Exact coverage unknown — run `go test -coverprofile` for baseline.

---

### `keyorix-web` — React dashboard

**Tech stack:** React 18 + TypeScript, React Query, Zustand, React Router v6, Axios, Zod + react-hook-form, Tailwind CSS + Headless UI, Recharts, Vitest + Playwright.

This is a production-quality frontend stack, not scaffolding. Dockerised with nginx, CSP headers configured.

**Page audit — real vs mock:**

| Page | API wired | Status |
|---|---|---|
| Login | ✅ | Real — auth store, token refresh logic |
| Secrets list | ✅ | Real — full filtering, sorting, pagination, bulk actions, versioning |
| Sharing management | ✅ | Real — list, delete, self-remove all wired via mutations |
| Dashboard | ⚠️ | Mostly real — stats and activity feed wired; system health is inline mock |
| Profile | Not audited | Unknown |
| User management (admin) | ❌ | Mock — comment: *"in real app this would come from the API"* |
| Admin dashboard | ❌ | Mock — stats and alerts are hardcoded |
| Analytics | ❌ | Mock — comment: *"in real app this would come from the API"* |

**Service layer:** `apiService` in `services/api.ts` has typed methods wired for: secrets (CRUD + versions), sharing (CRUD + self-remove), users (list, get, search), groups (list, get, search), dashboard (stats, activity), admin (stats, users, roles, audit logs). The service layer is more complete than the pages that use it.

**Summary:** The web UI is real and substantially built for core user flows (secrets, sharing, auth). Admin and analytics pages are mockups. This is not "not started" — it is partially shipped.

---

### Known stubs and TODOs across all repos
- gRPC protobuf service registration (`server/grpc/server.go`)
- Soft delete / purge (config-only stub — see §11)
- DEK wrapping by KEK — ✅ Fixed April 2026 (ADR-004). Full envelope encryption implemented.
- Admin dashboard and analytics pages (mock data)
- Dashboard activity feed endpoint missing on backend (404) — frontend calls `/api/v1/dashboard/activity`, endpoint not yet implemented
- `security/` directory contents not fully audited

### What needs a proper review before enterprise sales
- `gosec` baseline run and findings triage
- `govulncheck` on all dependencies
- Encryption implementation review by security engineer (see §4)
- Test coverage report (`go test -coverprofile`)
- `security/` directory audit — what is in compliance/, scans/, policies/?

---

## 4.5 AI Roadmap

> **Context for ENISA:** The original innovation concept (Annex 1) and business plan described NLP-driven access management features. Through customer discovery and technical validation, we determined that NLP query features solve a marginal problem — the same outcomes are achievable with one CLI command, and the target buyer (DevOps/security engineers) does not need natural language abstractions. This is documented here as a validated learning, not an abandonment. The AI investment was redirected toward anomaly detection, which solves a problem that no CLI command can solve and maps directly to NIS2/DORA incident detection requirements.

### Decided: Primary AI investment

**Access anomaly detection on `SecretAccessLog`**

Every secret access is already recorded in `SecretAccessLog` (confirmed in codebase audit). AI/ML can establish normal access baselines per secret, per service, per user — and alert when behaviour deviates. Examples of detectable anomalies:

- Database credential accessed at 3am from an unrecognised IP
- API key accessed 10x normal frequency (potential credential stuffing or runaway process)
- Secret accessed by a user who has never accessed it before, outside business hours
- Sudden access from a new geographic region

This is not a gimmick because:
- No human reviews access logs at scale — this is genuinely automated detection
- The data infrastructure already exists (`SecretAccessLog` model, `AuditEvent`)
- Maps directly to NIS2 Article 21 incident detection requirements and DORA operational monitoring
- Does not require a frontier LLM — lightweight anomaly detection (Isolation Forest, statistical baseline) works well for this problem
- Air-gap compatible — runs entirely on-premise, no external API calls

**Status:** ✅ Statistical baseline shipped April 2026. 3 rules: off_hours, new_ip, new_user. ML-based detection (Isolation Forest) targeted mid-2027.

---

### Decided: Secondary AI investment

**Automated rotation planning**

"This certificate expires in 14 days and is used in 3 services — here is the proposed rotation sequence, confirm to execute." AI understands secret dependency context and proposes safe rotation plans rather than requiring the operator to reason through dependencies manually.

Requires: secret usage tracking infrastructure (which does not yet exist — secrets currently record access but not which services depend on them). This is an M3 item.

---

### Deprioritised: NLP query interface

*Status: validated learning — deprioritised, may never be built.*

Originally conceived as: natural language access management queries ("who has access to project X", "replicate my access to Mike", "explain where this secret is used").

**Why deprioritised:**
- "Who has access" and "replicate access" are already answered by one CLI command — NLP adds no material value for an engineer buyer
- "Where is this secret used" requires secret dependency tracking infrastructure that doesn't exist yet — the AI would be the last step, not the first
- NLP interfaces are a purchasing reason for non-technical buyers — not the DevOps/security engineer ICP who evaluates and implements secrets managers
- In air-gapped deployments, cloud LLM API calls are disqualified; local LLM adds operational complexity for marginal value

**ENISA narrative:** Initial hypothesis was that NLP would reduce cognitive load for access management. Customer validation showed the actual cognitive load problem is not in querying access — it is in knowing when access has been misused. Anomaly detection addresses the validated pain; NLP addresses a hypothetical convenience.

**Preserved as pivot reference:** If ICP expands to include non-technical buyers (e.g. compliance officers, security managers who don't use CLI), NLP query interface becomes relevant again. Architecture to revisit at that point: two-mode design (Claude API for connected deployments, Ollama/Llama for air-gapped), with a hard constraint that secret values never touch any AI model — metadata only.

---

### AI architecture principles (decided)

1. **Secret values never touch any AI model.** Local or cloud. The AI layer operates on metadata only: secret names, access timestamps, user identities, access counts, IP ranges. This is a hard constraint.
2. **Local-first for air-gapped customers.** Any AI feature must be operable without external API calls. Cloud AI (Claude API) is an optional enhancement for connected deployments, never the default.
3. **No AI feature ships without a non-AI fallback.** If the AI component is unavailable, the product remains fully functional.

---

## 4. Encryption Model

> **Source:** Verified from `internal/encryption/` package audit, April 2026. This is the single source of truth for encryption claims made to prospects, auditors, and co-founders.

### What is implemented and works correctly

| Property | Implementation | Assessment |
|---|---|---|
| Cipher | AES-256-GCM | ✅ Correct. Authenticated encryption. |
| Randomness | `crypto/rand` (Go stdlib) | ✅ Correct. Uses `/dev/urandom` on Linux. |
| Nonce | Fresh random nonce per encryption operation | ✅ Correct. No nonce reuse. |
| Thread safety | `sync.RWMutex` throughout, keys copied on return | ✅ Correct. |
| Memory wiping | `Wipe()` overwrites key bytes with random data on shutdown | ✅ Better than most. |
| File permissions | Key files written at `0600`, validated and auto-fixable | ✅ Good. |
| Metadata | Algorithm, key version, nonce, timestamp stored alongside ciphertext | ✅ Enables future rotation and audit. |
| Key rotation | `RotateKEK()`, `RotateDEK()`, `RotateAuthEncryption()` exist | ✅ Rotation is implemented. |
| Auth token encryption | Session tokens, API tokens, client secrets all encrypted at rest | ✅ |
| Chunked encryption | Large secrets split into configurable chunks, each encrypted independently | ✅ |

### Known issues — ranked by severity

#### ✅ Fixed: Envelope encryption implemented (April 2026)

See ADR-004. Passphrase → PBKDF2-SHA256 (600k iterations) → KEK (memory only) → unwraps wrapped DEK → DEK used for all encryption. KEK never written to disk.

#### ✅ Fixed: Token comparison — constant-time (April 2026)

`subtle.ConstantTimeCompare([]byte(storedToken), []byte(plainToken)) == 1` in `auth_encryption.go`. `crypto/subtle` imported.

#### 🟡 High: KEK rotation does not re-encrypt existing secrets

`RotateKEK()` generates a new KEK and backs up the old one to `kek.backup.{timestamp}`. Secrets encrypted with the old KEK are not re-encrypted. Old KEK backup files accumulate on disk indefinitely. This is key proliferation, not key rotation. True rotation requires a re-encryption sweep of all secrets, atomically. This is an M2 item — design carefully.

**Status: Backlog — tracked in §11 security backlog. ADR required before implementation.**

#### 🟡 High: No Additional Authenticated Data (AAD)

`gcm.Seal(nil, nonce, plaintext, nil)` — no AAD. Without it, a ciphertext could theoretically be transplanted between secrets (same key, different secret ID). Fix: bind ciphertext to its context by passing `secretID + namespaceID + versionNumber` as AAD. Medium effort, significant security improvement.

**Status: Backlog — tracked in §11 security backlog.**

#### ✅ Fixed: Encryption-disabled warning (April 2026)

Loud banner printed to stderr in `NewService()` when `cfg.Enabled == false`. Cannot be missed.

### What to say to a security-conscious prospect

> *"Keyorix uses AES-256-GCM for all secrets at rest. Every encryption operation generates a fresh random nonce. Key material is wiped from memory on shutdown. We have a key manager with rotation capability. We do not use external KMS today — key material lives on your infrastructure, under your control. We have a documented roadmap to add KMS passthrough and HSM support for enterprise deployments."*

**Do not claim:** FIPS 140-2 compliance. Envelope encryption IS now implemented (ADR-004, April 2026) — you may claim it.

Updated prospect statement:
> *"Keyorix uses AES-256-GCM for all secrets at rest with proper envelope encryption. The data encryption key is wrapped by a master key derived from an operator passphrase — no plaintext key ever touches disk. Key material is wiped from memory on shutdown. We do not use external KMS today — key material lives on your infrastructure, under your control."*

### Recycle bin / soft delete — architectural note

Secret versioning is fully implemented (`SecretVersion` model, version history API, CLI). Because every state of every secret is already preserved in version history, a restore function does not require a separate recycle bin mechanism. The cleaner design is:

- `DeleteSecret` moves the secret to a `deleted` state (add `DeletedAt` field, GORM soft delete)
- Deleted secrets remain queryable by admins via a `--include-deleted` flag
- `RestoreSecret` reactivates the latest non-deleted `SecretVersion`
- `PurgeSecret` hard-deletes the `SecretNode` and all associated `SecretVersion` rows after `RetentionDays`

This reuses existing version infrastructure rather than building a parallel recycle bin. `SoftDeleteConfig.RetentionDays` and `PurgeConfig` are already in the config — the storage and service layer just needs to honour them. Document this approach as an ADR before implementing.

---

## 5. Architecture

### Design Principles
1. **On-premise first.** No telemetry, no phone-home, no SaaS dependency.
2. **Air-gap compatible.** Installation must work with zero internet access. All dependencies bundled or documented for offline install.
3. **Single binary target.** Operations teams should be able to move one file. No JVM, no Python runtime, no NPM.
4. **Storage agnostic via abstraction layer.** SQLite for small/dev, PostgreSQL for enterprise HA.
5. **API first.** Every feature is an API call. UI is optional and secondary.
6. **Progressive disclosure.** Simple concepts exposed to users, complex primitives hidden until needed.

### ADR-003 — Binary Split: keyorix-server and keyorix CLI

**Decision date:** April 2026
**Status:** Decided

**Context:**
The codebase already has a natural split:
- `server/main.go` — HTTP API server, runs in datacenter
- `main.go` — CLI, runs on developer/operator laptops

Previously both were built from the same Makefile target causing confusion about what to install where.

**Decision:**
Maintain two distinct binaries with separate build and install targets:

| Binary | Entry point | Installed by | Runs on |
|---|---|---|---|
| `keyorix-server` | `server/main.go` | Server operator | Datacenter/server |
| `keyorix` | `main.go` | Developers/operators | Laptops, CI/CD |

**Rationale:**
- Industry standard pattern — Vault, Doppler, Infisical all work this way
- Security: developers never need database access, only HTTP API
- Distribution: `keyorix` CLI can be distributed via Homebrew/apt independently
- Operational clarity: operator knows exactly what to install where
- Enforces audit trail: all access goes through the server API

**Makefile targets:**
```bash
make build-cli      # builds keyorix binary
make build-server   # builds keyorix-server binary
make build          # builds both
make install-cli    # installs keyorix to /usr/local/bin
make install-server # installs keyorix-server to /usr/local/bin
make run            # starts server for development
```

**Security rationale — reduced attack surface:**
Separate binaries mean separate dependency trees. The `keyorix` CLI binary does not include PostgreSQL drivers, database migration code, or server-side encryption logic. A compromised developer laptop only exposes the CLI binary — the attacker still needs a valid token to reach the server. PostgreSQL credentials, KEK, and database contents never touch the developer machine.

This also simplifies security audits — CLI and server can be reviewed as distinct components with distinct threat models.

**Package naming:**
- `keyorix` — CLI only, installs on developer laptops and CI/CD agents
- `keyorix-server` — server only, installs on datacenter/server machines
- No `keyorix-cli` suffix — CLI is the default package, consistent with industry convention (vault, doppler, infisical all use the product name for the CLI)

**Repository structure:** Monorepo for now. Single repository, two build targets. Split into separate repos only when co-founder joins or CLI needs different release cadence.

**Getting started workflow:**

*Server operator (installs on datacenter):*
```bash
git clone https://github.com/keyorixhq/keyorix
make install-server
keyorix-server  # starts the server
```

*Developer/operator (installs CLI on laptop):*
```bash
curl -L keyorix.com/install.sh | sh  # installs keyorix CLI only
keyorix config set-remote --url http://keyorix.company.com
keyorix auth login --api-key $TOKEN
keyorix secret list
```

### ADR-004 — KEK Root: Passphrase-Derived Key for v1 Envelope Encryption

**Decision date:** April 2026
**Status:** Decided and implemented

**Decision:** KEK is never stored on disk. Derived at startup from operator passphrase via PBKDF2-SHA256 (600k iterations + 32-byte random salt). DEK is wrapped (AES-256-GCM) by KEK and stored at `keys/dek.key`. Salt stored at `keys/kek.salt`. KEK wiped from memory immediately after DEK unwrap. DEK held in memory for process lifetime and passed to `NewEncryptionService`.

**Passphrase source:** `KEYORIX_MASTER_PASSWORD` env var (required). Empty passphrase blocked at startup.

**On-disk files:** `keys/kek.salt` (random salt, 32 bytes) + `keys/dek.key` (wrapped DEK). No raw KEK ever on disk.

**Files changed:** `internal/encryption/keymanager.go`, `service.go`, `auth_encryption.go`, `integration.go`, `auth_encryption_test.go`, `internal/cli/encryption/encryption.go`, `auth_encryption.go`, `examples/encryption/main.go`, `internal/config/config.go`

**v2 path:** `KeyProvider` interface (§8c) will abstract KEK source — passphrase becomes one provider alongside OS Keychain, TPM, KMS. Build when technical co-founder joins.

---

### ADR-002 — CLI Config Priority and Remote Mode

**Decision date:** April 2026
**Status:** Decided

**Context:**
The CLI has two modes — direct database access and remote HTTP. The local `keyorix.yaml` was taking precedence over the remote config stored in `~/.keyorix/cli.yaml`, causing confusion when switching between modes.

**Decision:**
Config priority order (highest to lowest):
1. Environment variables (`KEYORIX_SERVER`, `KEYORIX_TOKEN`)
2. `~/.keyorix/cli.yaml` (written by `keyorix auth login` and `keyorix config set-remote`)
3. `keyorix.yaml` in current directory (server config, should NOT be used by CLI for remote mode)

**Implementation note:** The local `keyorix.yaml` is the SERVER config file. The CLI remote config should always live in `~/.keyorix/cli.yaml`. These must not conflict.

**Implemented April 2026:** `keyorix connect <server> --username <user> --password <pass>` — single command. Also supports `--api-key` for token-based auth.

### ADR-001 — User-Facing Hierarchy: Project → Environment → Secret

**Decision date:** April 2026
**Status:** Decided

**Context:**
The backend data model has three isolation primitives: `Namespace`, `Zone`, and `Environment`. These were designed for a potential future SaaS multi-geography deployment where:
- `Namespace` = tenant/customer isolation
- `Zone` = geographic region (EU-West, US-East, etc.)
- `Environment` = dev/staging/production

This made sense when SaaS was a near-term possibility. The current ICP (on-premise European enterprises) has one deployment, one datacenter, one geography.

**Decision:**
In the UI, CLI, and all user-facing documentation, expose only:

```
Project → Environment → Secret
```

- **Project** maps to `Namespace` internally. Users never see the word "namespace".
- **Environment** maps to `Environment` internally. Three defaults: `development`, `staging`, `production`.
- **Zone** is hidden entirely. Defaults to `default` zone transparently.
- **Secret** is the leaf node.

**Rationale:**
- `Project → Environment → Secret` is the universal mental model (same as Doppler, GitHub, most SaaS tools)
- `Namespace` is a Kubernetes/technical term — confusing to non-technical buyers
- `Zone` adds complexity with no immediate user benefit for on-prem single-datacenter deployments
- Simplicity is a core competitive differentiator — the UI should reflect this

**What stays in the backend:**
Namespaces and zones remain as backend isolation primitives. They are not removed. If a future customer needs multi-geography, multi-datacenter, or SaaS deployment, the architecture already supports it — users just don't see it until they need it.

**Implementation:**
- UI: replace all "namespace" labels with "project"
- CLI: `keyorix project list/create`, `keyorix env list/create` — no `namespace` or `zone` commands exposed
- API: keep `namespace_id` and `zone_id` in the API for backwards compatibility, but default both transparently
- Docs: never mention namespace or zone in getting started guides

**SLUG / multi-geography note:**
The original SLUG concept (for SaaS deployments across geographies) is deferred indefinitely. The namespace+zone structure preserves this capability if needed. Revisit only when a specific customer requirement demands it.

### Deployment Models

| Model | Target customer | Backend | Support tier |
|---|---|---|---|
| Single-node SQLite | POC / small team | SQLite | Community |
| Single-node PostgreSQL | Production / mid-market | PostgreSQL | Commercial |
| HA PostgreSQL | Enterprise | PostgreSQL + PgBouncer or Patroni | Enterprise |

### Integration Surface
- REST API (primary)
- Future: Kubernetes secret store CSI driver, Vault-compatible API shim (strategic — allows migration from Vault with no app changes)

### Security Posture (target state)
- mTLS between components
- Short-lived tokens
- Audit log: append-only, signed
- No root keys stored in process memory longer than needed
- FIPS 140-2 compatibility: **open item / future**

---

## 6. Business Context

### Legal Entity
- Founder based in Valencia, Spain on startup visa
- **Keyorix SL** — name approved. Notary appointment attempted April 2026. Spanish bureaucracy — estimated completion ~1 week from late April 2026. Bank account follows entity registration. Note: SL not required to start selling — first customer can be invoiced as autónomo.
- VAT/invoicing: currently via consulting work — formalise before first LOI converts to contract. Target: entity complete before first signed contract.

### Team
| Role | Person | Status |
|---|---|---|
| Founder / CEO / PM | [Founder] | Active |
| CTO / Technical Co-founder | — | **Searching** |
| Advisor | — | Open |

**Co-founder pipeline (April 2026):**
- **Yuri** — ENISA startup visa submitted 20 days ago. 3 kids to relocate. Estimated arrival Valencia: 6-9 months. Role: Operations & Deployments, first customer onboarding. ENISA credibility (ex-Microsoft team narrative). Not CTO-level technically.
- **Olga** — Submitting ENISA papers now. Academic/university background. Writing LOIs, LinkedIn content, ENISA documentation. Estimated arrival: 4-5 months. Role: Research, Marketing, Compliance.
- **Yliya** — Based in Germany, close to German citizenship (cannot risk leaving employer). Informal CTO role — experienced developer, Docker/Kubernetes infra. Will join officially after first deployments and seed round. Currently: Technical Advisor (unofficial). Best technical fit for CTO.

**Key insight:** Do not wait for co-founders to start selling. First 1-2 deployments done by founder. Yliya provides informal technical backup. Team narrative for ENISA/investors: Olga (Research/Compliance), Yuri (Operations), Yliya (Technical Advisor).

### Revenue and Traction
- **ARR:** €0
- **LOIs:** 5 verbal LOIs — outcome April 2026:
  - 2 declined — courtesy LOIs, no real pain ("we knew you, wanted to help with ENISA")
  - 2 declined — genuine interest but no budget this year (re-engage September 2026)
  - 1 pending
  - Value: served ENISA credibility purpose. September re-engagement scheduled for the 2 budget-constrained prospects.
- **Consulting revenue:** Vault health assessments — bill-paying side service
  - Consulting creates pipeline: every Vault health assessment is a discovery call for Keyorix
  - Do not let consulting consume more than 40% of weekly time

### Pipeline Status (April 2026)

**Critical gap: 0 Vault health assessment conversations in last 30 days.**

The consulting → pipeline → customer flywheel has stalled. Product building consumed all time.

**Pipeline math:**
- 5 assessments → 1 Keyorix prospect
- 2-3 conversations → LOI
- 1-2 months → contract
- Start now → first customer August 2026

**Immediate action required:**
- 5 outreach messages this week — LinkedIn, ex-Microsoft network, conference contacts
- Target: companies with Vault clusters, Java-based secrets tools, or "forgotten secrets" problem
- Offer: Vault health assessment (€3-5K consulting) — not a Keyorix pitch
- Keyorix becomes the natural next step after the assessment

**September re-engagement list:**
- 2 prospects who said "no budget this year" — contact in September when Q1 2027 budgets are being planned

### Vault Health Assessment — Consulting Product
- Deliverable: report on Vault cluster health, upgrade risk, maintenance burden
- Price point: TBD (suggest €3-8K for a mid-market engagement)
- Buyer: same as Keyorix ICP — security and DevOps teams stuck with Vault
- Strategic value: this is the top of our funnel, not a separate business

### ENISA and Startup Visa Context

The Spanish startup visa (Ley de Startups 2023) requires the product to be classified as innovative. ENISA evaluates this. Five annexes were submitted as part of the business plan:

- **Annex 1** — innovation concept describing context-aware ephemeral secret generation with AI (patent-style system claim, not filed as a patent)
- **Annex 5** — business model (written in Russian, described SaaS + on-premise hybrid)
- **Annex 6** — Spain market analysis ($4.6-4.8B cybersecurity market, NIS2/DORA/ENS regulatory drivers)
- **Annex 8** — strengths and opportunities
- **Annex 9** — go-to-market roadmap

**Important context for anyone reading these documents:**
- These were written to satisfy the innovation criterion, not as binding product commitments
- The three-person team described (CEO, CTO, R&D Lead AI) reflects the plan as written — current reality is solo founder
- SaaS model described in Annex 5 was the initial hypothesis — strategy has since pivoted to on-premise first (see SaaS decision below)
- AI features described are on a 2027+ roadmap, not near-term — the GitHub description "AI powered" is aspirational

**Three-year renewal:** The startup visa requires renewal in three years. ENISA will review what was actually built against the innovation claim. The AI roadmap is designed around this deadline with two complementary deliverables:

1. **Anomaly detection** — statistical baseline on `SecretAccessLog` by end of 2026, ML-based detection by mid-2027. Solves the validated pain (knowing when access has been misused). Maps directly to NIS2/DORA incident detection requirements.

2. **MCP server** — ✅ Shipped April 2026. github.com/keyorixhq/keyorix-mcp. Claude can now create secrets, query audit logs, list users, and get stats via natural language. ENISA demo: ask Claude to list secrets expiring in 30 days and show who accessed them — Claude calls Keyorix MCP tools and returns a consolidated report from your air-gapped server.

**MCP Demo Status (April 2026):**
- MCP server ships, connects, and registers all 8 tools successfully (confirmed via logs)
- Claude Desktop MCP tool-calling is in beta rollout — tool invocation not triggering reliably in current Claude Desktop version
- ENISA proof: log showing "Server started and connected successfully" + full tools list registration is sufficient for 3-year review
- Decision: do not build Streamlit/Gradio wrapper — actual product demo (web dashboard + CLI) is stronger for both investors and ENISA
- Demo narrative: "Keyorix exposes an MCP interface — Claude can manage secrets via natural language. Here's the server running and tools registered. Full conversational demo pending Claude Desktop MCP stability."

Together these represent a credible, demonstrable AI story: Keyorix is observable and controllable by AI assistants (MCP), and Keyorix itself detects anomalous behavior using AI/ML techniques (anomaly detection).

### SaaS vs On-Premise — Strategic Decision Log

**Original assumption (Annex 5, 2024):** SaaS is an easier business to build and scale. Plan included Starter and Pro SaaS subscriptions alongside on-premise.

**What changed:** Through market conversations and research, it became clear that:
- The customer pain that is most acute and easiest to close is on-premise — orphaned Vault clusters, Java tools consuming excessive hardware, air-gap requirements
- SaaS secrets management is a crowded market (Doppler, Infisical, 1Password Secrets) with well-funded competitors
- Building a sovereign EU SaaS requires significantly more infrastructure, compliance certification, and capital than on-premise
- On-premise closes faster with less trust-building — the customer controls their own data from day one

**Decided:** On-premise first. Build three paying enterprise on-premise customers. Then evaluate whether a sovereign EU SaaS built on that foundation makes sense. SaaS is not ruled out — it is sequenced correctly. AGPL licence supports this: community on-premise builds trust, commercial licence funds SaaS development.

### Early Market Conversations

17 early conversations completed with DevOps, SecOps, and IT managers across tech companies, banks, telecoms, and MSPs (Spain/EU market). Characterised as short exploratory calls rather than structured customer discovery interviews — directional signal, not validated data. Key recurring themes: Vault operational burden, compliance audit pressure, reluctance to use US-based SaaS for secrets.

### ENS Certification Opportunity

ENS (Esquema Nacional de Seguridad, RD 311/2022) is Spain's national security scheme — mandatory for public sector systems and their suppliers. ENS certification unlocks public sector contracts and differentiates from non-certified competitors. Medium-term (1-2 year) target. Requires: audit logging, encryption, key management, and classification-based controls — all directionally aligned with the current Keyorix architecture. Not on M1 or M2 — document as M3 target.

### Regulatory Angle
- **NIS2** (EU Network and Information Security Directive 2) — mandates security controls for mid-market in critical sectors. Spain draft law approved Jan 2025.
- **DORA** (Digital Operational Resilience Act) — financial services operational resilience. In force Jan 2025.
- **ENS** (Esquema Nacional de Seguridad) — Spain national security scheme. Public sector unlock. M3 certification target.
- **EU AI Act** — phased enforcement 2025-2026. Keyorix audit logs and explainability angle relevant for customers deploying AI systems.
- Keyorix audit logs and access controls are a compliance artefact, not just a feature — position this way in every sales conversation.

### Funding
- Bootstrapped currently
- Target: seed round after 3-5 paying customers
- Spanish startup law (Ley de Startups 2023): tax incentives, stock option improvements — use this when recruiting co-founder

---

## 6b. Pricing Model — Decided April 2026

### Core principle
Two-track pricing: transparent flat-fee for SME, custom enterprise for large accounts.
No per-user pricing — incompatible with air-gapped on-premise deployments (no remote metering possible).

### Competitive context
- Doppler: $21/user/month → $6,300/year for 25-person team
- Infisical: ~$9/user/month cloud, free self-hosted
- Vault Enterprise: custom, no public pricing
- CyberArk Conjur: enterprise only, starts ~€50k+
- Keyorix positioning: below Doppler for mid-market, well below Conjur for enterprise

### SME Track (4 small company LOIs)

| Tier | Price | Includes |
|---|---|---|
| **Community** | Free (AGPL) | Self-hosted, community support, no SLA |
| **Professional** | €12,000/year | Up to 50 users, 1 node, email support, updates |
| **Enterprise** | €28,000/year | Unlimited users, 3 nodes, SSO, SLA, priority support |
| **Enterprise+** | Custom | Unlimited everything, HA, audit export, dedicated support |

Decision process: DevOps lead or CTO. Target close: 2-4 weeks.
Do not offer per-user pricing. Annual contract only. No monthly billing.

### Enterprise Track (EPAM and similar)

Pricing: "Contact us" — no public number.
Target range: €40,000-100,000/year depending on deployment scope.
Decision process: procurement + legal + security review. Target close: 3-6 months.

**EPAM context (April 2026):**
Early conversations with EPAM architect about using Keyorix in client delivery projects — not internal deployment. This is potentially a channel/reseller relationship, not a single customer.

Three possible commercial models (in order of preference to pursue first):
1. **Referral** — EPAM recommends Keyorix, client pays Keyorix directly,

---

## 7. ICP and Target Market

### Primary ICP

**Who:** European companies, 200–1,000 employees, with an existing secrets management problem

**Sectors (priority order):**
1. Financial services (DORA compliance driver)
2. Healthcare / MedTech (data sovereignty, NIS2)
3. Defence / government adjacent (air-gap requirement)
4. Manufacturing / industrial (OT environments, no cloud)
5. SaaS companies with enterprise customers requiring on-prem

**Buying roles:**
- **Economic buyer:** CISO or Head of Security
- **Champion / user:** DevOps lead, Platform engineer, Security engineer
- **Blocker:** Enterprise architect (evaluate alternatives)

**Pain profile (ranked):**
1. Vault was adopted, nobody maintains it, the maintainer left
2. Java-based secrets tool consuming 4x the hardware it should
3. Can't use SaaS (Doppler, etc.) due to data residency or air-gap requirement
4. Compliance audit flagged secrets management as a gap
5. Developer experience is terrible — secrets hardcoded in `.env` files

### Anti-ICP (do not pursue)
- Solo developers / indie hackers — wrong buyer, wrong price point, too saturated
- US-first startups without EU presence — longer sales cycle, wrong compliance angle
- Greenfield companies with no existing tooling — no urgency, no pain

### Qualification Criteria (MEDDIC-lite)
- **Metric:** What does a Vault outage cost them? What is the audit finding worth?
- **Economic buyer:** Can we get to the CISO within two meetings?
- **Decision criteria:** On-premise required? Yes → we qualify. SaaS acceptable? → deprioritise.
- **Decision process:** POC → security review → legal → procurement. Budget cycle?
- **Identify pain:** Ask about who currently manages secrets. What happens if that person leaves?
- **Champion:** Is the DevOps lead willing to sponsor internally?

---

## 8. Competitive Landscape

### Primary Competitors

#### HashiCorp Vault
- **Market position:** Default enterprise choice, large install base
- **Weaknesses:** Operational complexity (Raft consensus, unsealing, agent injection), BSL licence change alienated OSS community, requires dedicated Vault admin, resource-hungry for what it does
- **Our angle:** "You already have Vault. We're what you replace it with when the person who set it up leaves."
- **Key data point:** Customer 1 has an orphaned Vault cluster. Nobody on the team can maintain it.

#### CyberArk Conjur
- **Market position:** Enterprise PAM suite, Conjur is the secrets component
- **Weaknesses:** Java runtime (resource consumption), requires full CyberArk ecosystem buy-in, expensive, complex
- **Our angle:** "Single binary. No JVM. A mid-market team can run this without a dedicated platform team."
- **Key data point:** Customer 2 is running a Java-based tool consuming excessive hardware resources.

#### Doppler
- **Market position:** SaaS secrets manager, developer-friendly, US-centric
- **Weaknesses:** SaaS only — disqualified immediately for air-gapped / data sovereignty requirements
- **Our angle:** "Doppler is great if you can use SaaS. You can't. We're the answer."

#### OpenBao (HashiCorp Vault fork)
- **Relationship:** Potential co-founder source, not a competitor per se
- **Note:** OpenBao community members are the best possible technical co-founder targets — they understand the space, have Vault codebase knowledge, and are ideologically aligned with BSL alternatives

#### AWS Secrets Manager / Azure Key Vault / GCP Secret Manager
- **Market position:** Built-in cloud provider tools. Default choice for teams already in that cloud.
- **AWS Secrets Manager weaknesses:** Rotation fails silently ("A previous rotation isn't complete" is a common error). Pipeline-coupled secrets (CodePipeline, GitHub webhooks) are brittle. IAM complexity. AWS-only.
- **Azure Key Vault weaknesses:** Pricing surprises (code signing via Key Vault is expensive — Azure Trusted Signing is separate). GitHub Actions + Function Apps + Key Vault reference syntax creates deployment failures. Not beginner-friendly error messages.
- **GCP Secret Manager weaknesses:** Sparse ecosystem tooling. Works well inside GCP only. Limited when mixing with other clouds.
- **Common to all three:**
  - Cloud-locked — no on-prem, no air-gap
  - Separate tool per cloud — no unified control plane
  - IAM complexity grows with scale
  - No cross-cloud visibility
  - Vendor dependency — if AWS/Azure has an outage, your secrets are inaccessible
- **Our angle:** *"AWS Secrets Manager works great until you have a second cloud, an on-prem datacenter, or a compliance requirement that says your data can't leave your country. Then you need Keyorix."*
- **Verdict:** Not a direct competitor for your ICP. But every prospect will ask "why not just use AWS/Azure?" — have a crisp answer ready.

**Objection script:** *"Cloud-native secret managers create vendor lock-in and can't run in your datacenter or air-gapped environments. They also create separate silos per cloud — your AWS secrets, your Azure secrets, your on-prem secrets are all managed differently. Keyorix gives you one system for all of them, fully under your control."*

#### Delinea (formerly Thycotic/Centrify)
- **Market position:** PAM-focused, Windows/AD-heavy enterprises. Not a direct competitor.
- **Weaknesses:** RBAC design complexity, awkward secret reuse/linking, cognitive overhead for admins. Teams want secret inheritance and reference linking — Delinea makes this hard.
- **Our angle:** Not in the same deal. Mention only if prospect is evaluating PAM tools.

#### Teleport
- **Market position:** Infrastructure access management (SSH, Kubernetes, databases) with built-in secrets. Growing fast in DevOps space.
- **Note:** Insufficient public complaint data to fully assess. Needs separate research pass. Likely competes on the access/PAM layer more than secrets storage.
- **Action:** Research separately before any deal where Teleport comes up.

#### Akeyless
- **Market position:** Most technically sophisticated competitor. Unified platform for secrets management, PAM, certificate lifecycle management, and key management. Fastest growing enterprise competitor.
- **Company:** US/Israel-based, VC-backed
- **License:** Commercial SaaS with gateway for on-prem connectivity
- **Architecture:** SaaS-first with "gateway" — a stateless Docker container deployed on-premise that acts as a proxy to local resources. Zero Knowledge via DFC (Distributed Fragments Cryptography) — encryption key split across AWS, Azure, GCP, and customer-held fragment.
- **Key technical features:**
  - Dynamic secrets — credentials generated on-demand with TTL, auto-expired, never static
  - Rotated secrets — automatic credential rotation on schedule
  - Just-in-time PAM — temporary privileged access to databases, SSH, RDP, Kubernetes without jump hosts
  - Certificate lifecycle management — built-in PKI, intermediate CA, leaf cert issuance and provisioning to target machines
  - Session recording — video recording for RDP, text recording for SSH/CLI sessions
  - Multi-vault governance — visibility into external secret stores (AWS SM, Vault)
  - Universal Identity — proprietary auth method for legacy/on-prem without trusted identity
  - SAML/OIDC/LDAP/cloud IAM authentication
- **Demo approach:** Live web UI + CLI demos. Shows dynamic Postgres credentials, certificate provisioning to server, SSH/RDP just-in-time access, audit logs. Very polished.
- **Strengths:**
  - Unified platform — secrets + PAM + certificates + key management in one control plane
  - DFC zero-knowledge architecture — even Akeyless can't see your secrets
  - Dynamic secrets coverage far exceeds Conjur
  - Kubernetes native injector
  - Session recording built-in
  - "Crawl, walk, run" adoption messaging resonates with enterprise buyers
- **Weaknesses:**
  - Still fundamentally SaaS — gateway is a workaround, not true on-prem
  - Customer must protect their DFC fragment — operational risk
  - Gateway requires network connectivity for DFC decryption (caching helps but not air-gapped)
  - Complex platform — overkill for teams that just need secrets management
  - US/Israel company — GDPR concerns for European enterprise
  - Per-seat/consumption pricing can get expensive
  - "One platform for everything" pitch can feel bloated vs purpose-built tools
- **Their ICP:** Large enterprises (500+ employees) replacing legacy PAM (CyberArk, BeyondTrust) who also want to modernize secrets management. Security-led buying decisions.
- **Our angle vs Akeyless:**
  - Akeyless gateway still requires internet for DFC — truly air-gapped workloads cannot use it
  - Keyorix is a European company — no US jurisdiction, no CLOUD Act concerns
  - Keyorix is purpose-built for secrets management — simpler, easier to adopt
  - Akeyless is trying to be everything (PAM + secrets + certs) — Keyorix + Clearway CA partnership is same coverage without the complexity
  - Single binary vs Docker container gateway — Keyorix is simpler to operate

**Key talking point vs Akeyless:** *"Akeyless gateway still phones home to their SaaS for DFC key reconstruction — the moment you lose internet, you're dependent on their cache. Keyorix runs entirely within your perimeter. No cloud dependency, ever."*

**What to steal from Akeyless:**
- Dynamic secrets concept — generate credentials on-demand with TTL. This should be on Keyorix roadmap.
- "Crawl, walk, run" adoption framing — use this in sales conversations
- Multi-vault governance angle — enterprises often have secrets sprawled across AWS SM, Vault, etc. Keyorix could offer import/migration tooling.
- Session recording — add to roadmap for PAM-adjacent use cases

#### 1Password Secrets Manager
- **Market position:** Extension of 1Password password manager into developer secrets. Huge existing customer base (teams already using 1Password for passwords).
- **Company:** AgileBits, Toronto Canada. US market focused.
- **License:** Commercial SaaS only
- **ICP:** SMB/mid-market teams already using 1Password for passwords who want to extend it to infrastructure secrets. NOT enterprise security buyers.
- **Key features:** 1Password Connect (local caching proxy), AWS Secrets Manager sync, CLI/SDK injection, replace .env files messaging
- **Weaknesses:**
  - SaaS-only — Connect is a caching layer, not true on-prem
  - No air-gapped support
  - Rate limits on API access (mentioned in their own FAQ)
  - Not designed for high-throughput infrastructure patterns
  - Per-seat pricing gets expensive at enterprise scale
  - Shallow RBAC for enterprise needs
  - US/Canadian company — GDPR concerns
- **Good messaging to steal:** *"No more .env files, hardcoded keys, or copy-pasting between tools."* Simple, relatable, resonates with developers immediately. Use similar language on Keyorix landing page.
- **Our angle:** 1Password is for teams managing human passwords that also have some infrastructure secrets. Keyorix is purpose-built for machine-to-machine secrets at enterprise scale, fully on-prem.
- **Verdict:** Not a direct competitor. Different buyer, different use case. Rarely in the same deal.

#### Infisical
- **Market position:** Open-source Doppler alternative, ~15k GitHub stars, fastest growing in the category
- **License:** MIT (open source, but revenue model is SaaS)
- **Company:** US-based, VC-backed
- **CLI UX:** Best-in-class. `infisical run -- npm run dev` injects secrets into any process. `infisical init` creates local config. Service tokens for CI/CD via `INFISICAL_TOKEN` env var.
- **Self-hosted:** Technically available but SaaS-first. Self-hosted still defaults to connecting Infisical cloud for auth. `INFISICAL_API_URL` env var workaround exists but is an afterthought.
- **Air-gapped:** ❌ Not supported. Requires internet connectivity for authentication flows.
- **EU data:** Partial — EU Cloud SaaS option exists (`eu.infisical.com`) but data still on Infisical's servers. Not true data sovereignty.
- **Kubernetes:** Has operator and CSI driver integration.
- **SDKs:** Multiple language SDKs available.
- **Weaknesses:**
  - SaaS-first architecture — self-hosted is second-class citizen
  - US company — GDPR/data sovereignty concerns for European enterprise
  - No air-gapped support
  - Self-hosted requires more ops complexity than advertised
- **Our angle:**
  - Keyorix is on-prem first, not SaaS with an on-prem option
  - Single binary, no cloud dependencies, works fully air-gapped
  - European company, Valencia Spain — native GDPR compliance story
  - `keyorix run -- [command]` should match their CLI UX (backlogged)

**Key talking point vs Infisical:** *"Infisical has an EU Cloud option — your data is still on their servers in Frankfurt. With Keyorix, your data never leaves your building. There's no Infisical.com in the loop at all."*

**Deep competitive analysis — April 2026:**

Infisical's real positioning (stripped of marketing): "Central source of truth for secrets across the entire lifecycle." Four pillars: centralization, identity-based access, runtime delivery (CLI/K8s/CI/CD), and lifecycle management (rotation, dynamic secrets, versioning).

**Their Tier 1 features:** Secret delivery everywhere (CLI, CI/CD, K8s, agents), identity-based RBAC + machine identity, dynamic secrets + rotation, secret references (secrets built from other secrets — no duplication).

**Critical weaknesses confirmed:**
- org → project → env → folder → secret hierarchy = cognitive overload
- No instant value — requires full setup before any benefit
- Empty state problem — blank screen on first login, no demo mode, no pre-filled secrets
- Too flexible = too complex — 10 ways to do the same thing, no opinionated path
- Strong DevOps bias — not accessible to security managers or compliance officers
- No viral loop, no shareable output, no "wow feature"

**Key opportunity for Keyorix:**
The empty state problem is directly solvable with the scanner. First thing after deployment: `keyorix scan` populates the dashboard with real data from the customer's existing codebase. This is the onboarding moment no competitor has.

**Revised positioning insight:**
- Infisical: "setup first, value later"
- Keyorix: "value during setup" (scanner → import → dashboard populated immediately)

The right Keyorix framing is NOT "simpler than Infisical for solo devs" — it IS "enterprise-capable without enterprise complexity, with instant value on day one via scanner."

### Positioning Matrix

| | On-prem / Air-gap | Simple ops | EU-native | Open source | CLI UX | K8s auth | Dynamic secrets | CI/CD integrations | Secret migration | Certificates | PAM/Remote access | SDKs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Keyorix** | ✅ | ✅ | ✅ | ✅ (AGPL) | 🔜 | 🔜 | 🔜 | 🔜 | 🔜 | 🤝 Clearway CA | ❌ | 🔜 |
| HashiCorp Vault | ✅ | ❌ | ❌ | ⚠️ (BSL) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| CyberArk Conjur | ✅ | ❌ | ❌ | ⚠️ | ✅ | ✅ | ⚠️ limited | ✅ | ❌ | via Venafi | ✅ | ✅ |
| Doppler | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| OpenBao | ✅ | ❌ | ❌ | ✅ (MPL) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| Infisical | ⚠️ SaaS-first | ⚠️ | ❌ US | ✅ | ✅ best | ✅ | ❌ | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| Akeyless | ⚠️ Gateway/SaaS | ⚠️ | ❌ US/Israel | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ built-in | ✅ full PAM | ✅ |
| 1Password | ❌ SaaS | ✅ | ❌ Canada/US | ❌ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ✅ |

**Legend:** ✅ Strong | ⚠️ Partial | ❌ No | 🔜 On roadmap | 🤝 Via partnership

**Keyorix honest assessment:** Strong on core differentiators (on-prem, air-gap, EU-native, simplicity). Feature gaps vs Akeyless/Vault in dynamic secrets, K8s auth, CI/CD integrations — all on roadmap. Certificates covered via Clearway CA partnership. PAM/Remote access out of scope for v1.

### Competitive Segment Map

| Competitor | Their ICP | Why you win against them |
|---|---|---|
| HashiCorp Vault | Large enterprises, already invested in HashiCorp stack | Too complex, BSL license, needs dedicated Vault admin |
| CyberArk Conjur | Enterprise, Kubernetes-heavy, Java shops | Java/resource heavy, complex demo setup, expensive |
| Doppler | SaaS-native startups and scale-ups | SaaS-only, no on-prem, no air-gap, US company |
| Infisical | Developer-led teams wanting open source | SaaS-first, self-hosted is afterthought, US company, no air-gap. Empty state problem — blank screen on first login, no instant value moment. Keyorix scanner solves this. |
| 1Password Secrets | SMB/mid-market already using 1Password | Password manager extension, not enterprise-grade, SaaS-only |
| AWS/Azure KV | Cloud-native teams locked into one cloud | Cloud-locked, no on-prem, vendor dependency |
| AWS/Azure/GCP | Teams fully committed to one cloud | Cloud-locked, no on-prem, no air-gap, separate silos per cloud, vendor dependency |
| Akeyless | Large enterprises replacing legacy PAM (CyberArk) who also want modern secrets | Still SaaS — gateway phones home for DFC. Not truly air-gapped. US company. |
| **Keyorix** | **European enterprises needing on-prem, air-gap, compliance** | **Only purpose-built on-prem-first option from a European company** |

### Differentiation Narrative (for sales calls)
> *"Most secrets managers were built for the cloud-first world. Keyorix was built for the world where your data cannot leave your building. Single binary, no JVM, no SaaS dependency, audit logs that satisfy your compliance team. Operational complexity that a two-person DevOps team can manage without a dedicated Vault admin."*

---

## 8e. Validated Future Product — HRPS Identity Acceleration Layer

> **Status: Validated idea, NOT a backlog item. Do not build until Keyorix has 10+ paying customers and a technical co-founder.**

### Origin

April 2026 conversation with Lead SRE/CTO of a large oil company (~5000 gas stations). Each station runs POS systems, loyalty card systems, and other apps — all authenticated via Active Directory. AD load became so high they introduced HashiCorp Vault as a proxy. Still not solved — Vault still depends on AD, just adds a layer.

This is apparently a common pattern across large enterprises with distributed infrastructure (retail, telco, oil/gas, logistics).

### The Problem

```
5000 gas stations × N apps × auth requests
→ Active Directory (bottleneck — LDAP chatty, can't scale)
→ HashiCorp Vault (partial relief, still AD-dependent at runtime)
→ Still not solved at 10k-100k+ RPS
```

No existing product solves this properly. Vault, Conjur, Akeyless all still depend on AD/IAM at runtime. This is a genuine market gap.

### The Proposed Solution — "Keyorix Identity" or Separate Product

An in-memory identity graph that removes AD from the authentication hot path entirely:

**Data Plane (hot path — sub-1ms):**
- In-memory identity graph (users, groups, roles, policies)
- Policy evaluation engine (precompiled, no runtime interpretation)
- Token validation
- Cache lookup
- Zero AD dependency — stateless request processing

**Control Plane (slow path — async):**
- AD/LDAP synchronization (delta sync)
- Policy compilation
- Audit logging

**Request flow:**
```
Client → Keyorix Edge Node → in-memory graph → policy engine → decision (<1ms)
MISS → async AD fetch (never blocks request)
```

**Performance targets:**
- 100k+ RPS per node
- <1ms p99 latency (cache hit)
- >95% cache hit rate
- 0% AD dependency in hot path

### Why This Is NOT Keyorix Today

| | Keyorix (current) | HRPS Identity Layer |
|---|---|---|
| What it stores | Secrets (API keys, passwords) | Identity graph (users, groups, roles) |
| Primary buyer | DevOps/Security teams | Platform/SRE teams at 5000+ employee companies |
| Core problem | Secret storage and injection | Auth at 100k+ RPS without AD dying |
| Technical core | Encryption, audit logging | In-memory graph, cache, policy engine |
| Competitors | Vault, Doppler, Infisical | Virtually none — genuine gap |
| Sales cycle | 2-4 weeks | 6-12 months enterprise |
| Deal size | $20-50k ARR | $200k-1M ARR |
| Build effort | Working prototype exists | Greenfield, 6-12 months minimum |

### Why NOT to Build Now

- Solo founder — split focus kills both products
- No existing budget line item — buyers don't know they need this yet
- 6-12 month sales cycles before first revenue
- Requires different technical co-founder profile (distributed systems, not security)
- Keyorix has momentum — don't abandon it

### How to Use This Now

**The CTO conversation is a gift — mine it for Keyorix:**

Go back to this CTO and say: *"Your AD/Vault bottleneck is fascinating — we're researching that problem space. For now, can I ask how you manage the actual secrets and credentials across those 5000 stations? Service tokens, API keys, database passwords — that's where Keyorix can help you today."*

5000 gas stations = 5000 sets of secrets. That's a Keyorix enterprise deal right now.

### When to Revisit

Build HRPS when:
- [ ] Keyorix has 10+ paying customers
- [ ] Technical co-founder with distributed systems background is hired
- [ ] 3+ enterprise CTOs independently describe the same AD bottleneck pain
- [ ] Seed round closed, 18+ months runway

### Reference Documents

Architecture specs saved in: `keyorix_full_architecture_spec.md`, `keyorix_hrps.md`, `keyorix_production_hardening_pack.md`

Key insight from the architecture work:
> *"Identity decisions must be local, deterministic, and memory-resident. AD is the control plane. Keyorix Identity is the execution layer."*

This is a genuinely new product category. The timing is wrong now. The idea is right.

---

## 8c. Architecture Vision — Key Provider System

> This section captures the encryption architecture vision. The foundation (KeyProvider interface) should be built now. Full provider implementations are 2027 work requiring a technical co-founder.

### Core Insight

Security is defined NOT by encryption itself, but by KEK lifecycle management.

The current v1 architecture has DEK/KEK encryption but the KEK is stored in a file — this is the primary security gap to fix. The solution is a `KeyProvider` interface that abstracts WHERE and HOW the KEK is stored and accessed.

### Three Operational Modes

| Mode | Storage | KEK Location | Target |
|---|---|---|---|
| **Dev Mode** | SQLite | File (acceptable for dev) | Developer laptops, quickstart |
| **Edge Mode** | SQLite | OS Keychain or TPM | Air-gapped deployments, offline capability |
| **Production Mode** | PostgreSQL | OS Keychain, KMS, or wrapped | Enterprise on-premise deployments |

Do NOT remove SQLite. Treat it as a separate operational mode, not a weaker version of PostgreSQL. SQLite uses ~1-5MB RAM vs 50-150MB+ for PostgreSQL — real resource savings for edge/dev deployments.

### KeyProvider Interface (build now)

```go
type KeyProvider interface {
    WrapKey(ctx context.Context, plaintextDEK []byte) (wrappedDEK []byte, metadata Metadata, err error)
    UnwrapKey(ctx context.Context, wrappedDEK []byte, metadata Metadata) (plaintextDEK []byte, err error)
}

type Metadata struct {
    Provider string
    KeyID    string
    Version  int
    Context  map[string]string
}
```

**Critical rule:** Never expose the KEK directly. Only expose cryptographic operations (wrap/unwrap). The KEK never leaves the provider.

**Optional capability interfaces:**
```go
type Rotatable interface { RotateKey(ctx context.Context) error }
type Auditable interface { AuditInfo() AuditMetadata }
```

### Secret Zero Problem — How We Solve It

Secret Zero = how does the system authenticate to the KeyProvider at startup? Each provider has a different answer:

**OS Keychain (macOS Keychain, Linux libsecret, Windows DPAPI):**
No Secret Zero problem. The OS handles authentication via the logged-in user session or system identity. Unlocks automatically. Cleanest solution for on-premise deployments. No engineering complexity for the caller.

**AWS KMS / GCP KMS / Azure Key Vault:**
The cloud platform provides ambient identity — EC2 instance IAM role, GKE pod ServiceAccount, Azure Managed Identity. KMS SDK reads these automatically. No secret needed. Genuinely solves Secret Zero for cloud deployments.

**Air-gapped / bare metal (hardest case):**
1. **Wrapped KEK at boot** — KEK encrypted with a bootstrap passphrase that an operator enters once at startup (like Vault's unseal key). Acceptable for security-conscious enterprises. Implement first.
2. **TPM-bound KEK** — KEK sealed to the TPM chip, unlocks automatically on boot only on that specific hardware. Best security, complex to implement. 2027 work.
3. **Split key ceremony** — KEK split across multiple administrators (Shamir's Secret Sharing). Nobody alone can unseal. Enterprise compliance requirement for some sectors.

**Key insight:** Secret Zero is only fully solved when you trust the environment. OS trusts the logged-in user. Cloud trusts the platform identity. Air-gapped bare metal trusts the hardware (TPM) or a human operator. Trust has to start somewhere — the goal is to make the trust boundary explicit and auditable.

### Provider Implementations — Roadmap

**Tier 1 — Build in 2026 (foundation):**
- [ ] Define `KeyProvider` interface in `internal/crypto/`
- [ ] **File provider** — current behavior, explicit and documented (dev only)
- [ ] **Environment variable provider** — KEK from env var, suitable for containers/CI
- [ ] **Wrapped KEK provider** — operator-entered passphrase at startup (production on-prem v1)
- [ ] **Provider resolver** — dynamic provider selection based on config/metadata
- [ ] **Key migration tooling** — unwrap with old provider, re-wrap with new provider

**Tier 2 — Build in 2027 (requires co-founder):**
- [ ] **OS Keychain provider** — macOS Keychain, Linux libsecret, Windows DPAPI
- [ ] **AWS KMS provider** — ambient IAM role authentication
- [ ] **GCP KMS provider** — ambient ServiceAccount authentication
- [ ] **Azure Key Vault provider** — ambient Managed Identity authentication
- [ ] **Kubernetes ServiceAccount provider** — OIDC-based, no static secrets
- [ ] **TPM provider** — hardware-bound KEK for air-gapped bare metal

### Migration Strategy

Seamless transition between providers without re-encrypting all secrets:

```
SQLite + file KEK (dev)
   → migrate
PostgreSQL + OS Keychain (production)
   → migrate
PostgreSQL + AWS KMS (cloud)
```

Steps: (1) Unwrap DEK using old provider, (2) Re-wrap using new provider, (3) Update metadata. All secrets remain encrypted throughout.

### Anti-Patterns to Avoid

- ❌ Exposing KEK directly anywhere in the codebase
- ❌ Storing KEK in environment variables in production
- ❌ Hardcoding provider logic instead of using the interface
- ❌ Treating all providers as equal in security (file ≠ TPM)

### Strategic Product Advantage

If implemented correctly, Keyorix achieves:
- **Local-first UX** (like 1Password) — works offline, no cloud dependency
- **Production-grade security** (like Vault) — proper KEK lifecycle
- **Edge/offline capability** (rare in market) — TPM-bound keys, air-gapped deployments

No competitor has all three. This is the long-term moat.

---

## 8d. Competitive Intelligence — Market Pain Analysis (April 2026)

> Synthesized from deep analysis of 12 secrets management tools across Reddit, GitHub, HN, and engineering write-ups. Filtered for relevance to Keyorix ICP (European enterprise, on-prem, 200-1000 employees).

### Pain Points Keyorix Already Solves

| Pain | Evidence | Keyorix solution |
|---|---|---|
| Vault operational complexity | "Built for sysadmins, forced upon developers" | Single binary, no Vault admin needed |
| Self-hosted complexity | Infisical self-hosted "significantly slower and more complex" | `make install`, one command start |
| EU data sovereignty | GDPR concerns with US-based tools | Valencia, Spain — European company |
| .env file chaos | "Ticking time bomb" — 35% of private repos contain hardcoded secrets | `keyorix run` eliminates .env files |
| Secret sprawl | "Despite having a Central Vault, secrets still found in Slack, Jira, .env files" | Import from any source, one source of truth |

### Pain Points to Prioritize — Ordered by Impact

**Priority 1 — Credential usage blind spot (most universal, most urgent)**

> *"Vault's job ends at the moment it hands over the credential. What happens after that is a blind spot."*
> *"Which service made which API call, when, and was it expected? You can't tell."*

You already have `secret_access_logs` with IP, user agent, timestamp. No competitor surfaces this data properly.

**Build:** Usage analytics dashboard — which secrets are accessed most, by which services, at what frequency. Secrets not accessed in 90+ days flagged for review. This becomes the "secret observability" differentiator.

---

**Priority 2 — Rotation failures are silent and opaque**

> *"AWS showed 'rotation successful' — 3+ hours of downtime because rotation actually failed silently"*
> *"Teams need to see why rotation is stuck, what dependency failed, and how to safely resume"*

Nobody has a rotation debugger. This is a genuine market gap.

**Build:** Rotation state inspector — shows rotation in progress, dependency status, last success/failure reason. "Why did rotation fail?" answered in the UI, not in logs.

---

**Priority 3 — Non-Human Identity (NHI) crisis**

> *"NHIs outnumber human users 45-to-1 in DevOps environments"*
> *"23.7M new secrets leaked on GitHub in 2024 — 25% surge year-over-year"*
> *"70% of secrets leaked in 2022 are still active and unrotated today"*

Service accounts, CI/CD tokens, Kubernetes service accounts — this is the real problem your ICP has.

**Build:** Kubernetes service account authentication (already in backlog — raise priority). Service token lifecycle management in the UI.

---

**Priority 4 — Zombie secrets / unused secret detection**

> *"38% of secrets found in collaboration tools are classified as critical"*
> *"Every secret stored carries a direct financial cost, multiplying with sprawl"*

You have the audit data to detect this already.

**Build:** Secrets health dashboard — flag secrets not accessed in 30/60/90 days. "Zombie secret" detection. One-click review workflow.

---

**Priority 5 — Re-auth friction kills developer productivity**

> *"1Password CLI requires re-unlocking every 30 minutes — especially annoying in shell-heavy workflows"*

Your short-lived token backlog item addresses this.

**Build:** Short-lived tokens with silent auto-refresh. Developer never has to re-auth during a working session.

---

### Pain Points NOT Worth Chasing for Current ICP

### Multi-Cloud Strategy — Revised (April 2026)

**Initial assessment was wrong.** Multi-cloud orchestration is NOT off the table — it needs to be reframed correctly.

**The reality of European enterprise in 2026:**
Most large European enterprises are hybrid, not purely on-prem. They have legacy workloads on-prem AND some Azure/AWS for newer projects. Microsoft is aggressively pushing Azure into every enterprise account. GDPR requires data sovereignty but doesn't prohibit EU-region cloud.

**The correct framing — "Keyorix as Control Plane":**

Not: "orchestrate secrets across AWS, GCP, Azure" (US startup multi-cloud story — wrong buyer)

But: "Keep your most sensitive secrets on-prem in Keyorix, and get visibility and governance over whatever secrets already exist in Azure Key Vault or AWS SM — one control plane, no vendor dependency."

This is Akeyless's "Multi-Vault Governance" feature — one of their key enterprise differentiators.

**The anti-Microsoft pitch:**
> *"Microsoft wants you to put everything in Azure Key Vault — creating vendor lock-in and making your most sensitive on-prem secrets dependent on Azure availability. Keyorix keeps sensitive secrets on your hardware while federating visibility across your Azure and AWS secrets. One control plane, no vendor dependency."*

**Product structure — NOT a separate product:**

| Tier | Features | License |
|---|---|---|
| Keyorix Core | On-prem secrets management | AGPL |
| Keyorix Connect | Federation with Azure Key Vault, AWS SM, HashiCorp Vault | Commercial enterprise |

This maps cleanly to dual licensing strategy. Core is open source. Connect is the enterprise revenue driver.

**Roadmap placement:** 2027 — requires co-founder, significant engineering effort. But the narrative should be used in sales conversations NOW even before the feature exists. "We're building Connect — federation with your existing Azure and AWS secrets stores."

- [ ] **Keyorix Connect — Multi-vault federation** — read-only visibility into Azure Key Vault, AWS Secrets Manager, HashiCorp Vault secrets from the Keyorix dashboard. Sync status, drift detection, unified audit view. Does NOT require moving secrets — Keyorix federates without migration. Enterprise tier only.

### Pain Points NOT Worth Chasing for Current ICP

| Opportunity | Decision | Rationale |
|---|---|---|
| AI agent intent validation | 2027 watch list | NHI problem accelerating fast — revisit when 10 customers signed. MCP server is first step. |
| Multi-cloud orchestration | Reframed as Keyorix Connect (2027) | NOT dropped — repositioned as "control plane for entire secrets estate" including Azure/AWS federation. Anti-Microsoft pitch. |
| K8s secrets firewall | Drop | Too niche, kernel-level work. Kubernetes service account auth covers the real need. |
| FinOps pricing simulator for AWS/Azure | Drop | Wrong FinOps — internal chargeback for on-prem (already in backlog) is the right version. |
| Biometric/TouchID local sync daemon | Drop | Consumer product pattern, not enterprise buyer. |
| Separate product for any of the above | Drop | Solo founder — separate product means separate GTM, support, pricing. Focus is survival. Build features, not products. |

### Key Stats for Sales Conversations

- **$17,200/developer/year** — estimated cost of secrets management toil (3 hrs/week × fully-loaded dev cost)
- **23.7M secrets leaked on GitHub in 2024** — 25% year-over-year increase
- **70% of leaked secrets from 2022 are still active and unrotated**
- **35% of private repositories contain hardcoded secrets**
- **45-to-1** — ratio of non-human identities to human users in DevOps environments
- **38% of secrets in collaboration tools (Slack, Jira) are classified as critical**

Use these in sales conversations to quantify the problem before presenting Keyorix.

### Updated Roadmap Priorities (from this analysis)

1. **Secrets usage analytics** — surface `secret_access_logs` data as a dashboard (zombie secrets, usage heatmap)
2. **Rotation state inspector** — show rotation status, last failure reason, safe resume
3. **Short-lived tokens with auto-refresh** — eliminate re-auth friction
4. **Kubernetes service account auth** — solve NHI problem for K8s workloads
5. **Secrets health score** — per-secret risk score based on age, access frequency, rotation status

---

## 8b. Strategic Vision — Secrets Runtime Platform

> This section captures the long-term category vision. Use this narrative with investors, analysts, and in content marketing. Do NOT lead with this in early customer conversations — lead with the concrete on-prem/air-gap/EU positioning instead.

### The Core Insight

The entire secrets management category is solving the wrong layer of the problem.

**What the market does:** store secrets, sometimes rotate them, sometimes inject them.

**What the market should do:** manage the full lifecycle — onboarding, rotation, access review, revocation, drift detection, debugging — with zero developer friction.

The real job to be done is not *"secure secrets"* but *"make secrets invisible, self-healing, and non-blocking for developers."*

### Category Reframe

| Today | Tomorrow |
|---|---|
| Secrets Management | Secrets Runtime Platform |
| Passive storage | Active lifecycle control |
| "Where is the secret?" | "How is the secret behaving?" |
| Manual rotation | Self-healing credentials |
| Siloed tools | Unified control plane |

**Investor-grade one-liner:**
> *"We're building the Datadog for secrets — not just storing them, but making them observable, debuggable, and self-healing."*

**Killer differentiator (long-term):**
> *"We don't just store secrets. We understand and control how they behave."*

### The Sales Narrative (How to Open Every Customer Call)

**Opening hook (30 seconds):**
> *"Most teams think secrets are a security problem. In reality, they're a reliability and debugging problem."*

Pause. Then:

> *"When something breaks in production — deployments, pipelines, services — secrets are often involved. But no one has visibility into what actually went wrong."*

**Guide them to admit:**
- "We don't fully know where all secrets are"
- "Debugging failures takes too long"
- "Rotation sometimes breaks things"
- "Environments drift between staging and production"

**The reframe:** from security problem → operational pain problem

**The insight (turning point in the call):**
> *"The problem isn't storing secrets. It's that no system understands how they behave."*

> *"You don't have a secrets problem. You have a visibility and control problem."*

**The enemy (what you position against — not competitors):**
❌ "Fragmented secrets lifecycle" — secrets in multiple systems, no visibility, no ownership, no debugging

**ROI framing:**
- 5–10 engineers, 2–3 hours/week wasted on secrets issues = **$100k–$300k/year inefficiency**
- *"We eliminate a significant portion of that wasted time."*

**Closing question:**
> *"If your team could instantly see why a deployment failed or what breaks when a secret changes — how much time would that save you?"*

**Final one-liner:**
> *"We don't replace your secrets manager. We make it observable, debuggable, and reliable."*

---

### The Demo Scenarios No One Else Is Running

**What all competitors demo:** create a secret, inject into Kubernetes, show CI/CD pipeline. Everyone does this.

**What NO competitor demos** (your opportunity):
- ❌ Why a pipeline failed due to a secret
- ❌ Secret dependencies — who uses what, what breaks if it changes
- ❌ Cross-environment drift detection
- ❌ Secret lifecycle (everyone shows creation, nobody shows lifecycle)
- ❌ Self-healing rotation

**Your four killer demo scenarios (build these):**

**Demo 1 — "Why did this fail?"**
1. Show broken deployment
2. Show: missing secret / wrong env / expired credential
3. Show fix in Keyorix
4. Outcome: *"We reduce debugging time from hours to minutes"*

**Demo 2 — "Blast radius"**
1. Change a secret
2. Show affected services, pipelines, environments
3. Outcome: *"You understand impact before things break"*

**Demo 3 — "Drift detection"**
1. Show staging ≠ production
2. Highlight mismatch and remediation
3. Outcome: *"No more hidden configuration bugs"*

**Demo 4 — "Rotation failure"**
1. Simulate failed rotation
2. Show root cause and fix
3. Outcome: *"Rotation becomes safe and observable"*

**Demo Scenario 5 — "Instant inventory" (scanner)**
1. Run `keyorix scan /path/to/project` on customer's existing codebase
2. Show: 23 secrets found, 3 hardcoded in source (HIGH), 12 in .env files (MEDIUM), 8 in config files (LOW)
3. Run `keyorix import --from-scan` — all secrets migrated into Keyorix in one command
4. Show dashboard — populated with real customer data immediately
Outcome: *"You went from zero visibility to full inventory in 2 minutes. No competitor can do this on day one."*

---

### Target Buyer Profile

**Primary (who buys):**
- Head of Platform Engineering
- Director of DevOps / SRE
- Staff / Principal Engineers

**Secondary (who influences):**
- Security / AppSec
- Cloud / Infrastructure leads

**Important:** This is NOT a pure security sale. This is a **reliability + productivity + risk** sale. Frame accordingly.

---

### What Competitors Sell vs What You Sell

| Competitor | Their hero demo | Their positioning | What they DON'T solve |
|---|---|---|---|
| Vault / Conjur | Dynamic secrets, Kubernetes sidecar | "Central source of truth, zero trust" | DX, onboarding, debugging |
| Doppler | Replace .env files, env sync | "Fast onboarding, single dashboard" | Enterprise depth, complex workflows |
| Infisical | CI/CD injection, multi-env | "Developer-first, open source" | Debugging, lifecycle |
| Akeyless | Vault without ops, dynamic secrets | "Vault but easier" | True air-gap, EU data sovereignty |
| AWS/Azure/GCP | Native cloud integration, rotation | "Secure by default, fully managed" | Multi-cloud, on-prem, debugging |
| **Keyorix (today)** | **On-prem secrets, real encryption, audit logs** | **"Vault without complexity, European, air-gapped"** | **Dynamic secrets, secret graph (roadmap)** |
| **Keyorix (vision)** | **Why deployments fail, blast radius, drift** | **"Secrets Runtime Platform"** | **Building now** |

---

### Competitive One-Liners (for sales calls)

- **vs Vault:** *"Vault is great for storing secrets. We help you understand and operate them — without needing a dedicated Vault admin."*
- **vs Doppler:** *"Doppler simplifies access. We solve debugging and lifecycle control — and we run in your datacenter."*
- **vs AWS SM:** *"Cloud tools manage secrets inside one platform. We give you visibility across all of them, including on-prem."*
- **vs Akeyless:** *"Akeyless gateway still phones home for key reconstruction. Keyorix runs entirely within your perimeter, no cloud dependency, ever."*
- **vs Infisical:** *"Infisical has an EU Cloud option — your data is still on their servers. With Keyorix, there's no Infisical.com in the loop at all."*

---

### Hidden Pains DevOps Teams Don't Say Out Loud

These are the real drivers — use these to open discovery conversations:

**Pain #1 — "Secrets are everywhere and no one is in control"**
Teams have Kubernetes secrets + CI/CD variables + cloud secrets + local .env files with no single source of truth. Creates inconsistency, security risks, operational chaos.

**Pain #2 — Environment Drift (Silent Killer)**
A secret exists in staging but not in production → deployment breaks. Leads to failed releases, increased MTTR, hard-to-debug outages. Almost no tool solves this properly.

**Pain #3 — "We don't actually trust our setup"**
Teams don't trust rotation, don't know who has access, don't fully understand their own policies. This is a confidence gap, not just a tooling issue.

**Pain #4 — Kubernetes Secrets = False Sense of Security**
Secrets are just base64-encoded. Access to etcd = access to secrets. Many teams realize this only after a security review.

**Pain #5 — Rotation & Sync Are a Mess**
Secrets duplicated across systems, manual updates, inconsistent environments. Result: drift, errors, operational overhead.

**What teams actually want (but rarely articulate):**
1. "One system that works everywhere" — local dev → CI/CD → K8s → cloud
2. "Explain what's broken" — not just "access denied" but why, where, how to fix
3. "No more manual sync" — automatic propagation and drift detection
4. "Don't make me think about secrets" — secrets are invisible, everything just works

### Five Unsolved Problems in the Market

**1. Fragmentation — four disconnected worlds**
Secrets live in local dev, CI/CD, Kubernetes, and cloud runtime with no unified control plane. Every tool solves one layer. Nobody connects all four.

**2. Broken rotation**
Rotation fails silently, gets stuck, and is hard to debug. AWS, Vault, and Azure all have public complaint threads about this. Teams don't know *why* rotation failed — they just see it's broken.

**3. Local development chaos**
`.env` files, copy-paste sharing, secrets in Slack. This is often the #1 real vulnerability, not Vault misconfiguration. Infisical addresses this best today but incompletely.

**4. No secret graph**
Nobody tracks which service uses which secret, or what breaks if a secret changes. Blast radius is unknown until something breaks in production.

**5. Poor debuggability**
"Rotation failed." "Access denied." That's it. No explanation, no root cause, no guidance. A developer wastes hours on IAM/policy debugging that an AI could resolve in seconds.

### Innovation Scenarios — Filtered by ICP Relevance

**Filter applied:** Would the Head of Platform Engineering at a 500-person European enterprise pay for this today / in 12 months / in 24+ months?

#### ✅ Near-term roadmap (buildable in 2026, real buyer need)

- **Cross-environment drift auto-healing** — detect inconsistencies between dev/staging/prod and automatically reconcile secrets. Nobody does this. Directly addresses Pain #2 (environment drift). High customer value, medium complexity.
- **Zero-touch developer onboarding** — provision secrets automatically for new developers based on role and context. `keyorix init` + role-based auto-provisioning. Eliminates manual setup and `.env` sharing. Strong adoption driver.
- [x] **Behavioral anomaly detection** — ✅ Shipped April 2026. Statistical baseline with 3 rules. ML upgrade planned mid-2027.
- **Secrets observability** — real-time insights into how secrets are used, where they flow, and how they impact system behavior. Beyond static audit logs — live dashboards, usage heatmaps. Natural extension of existing audit layer.
- **Autonomous rotation triggers** — rotate secrets based on risk signals (anomalous access, age, breach detection) rather than fixed schedule. Removes manual scheduling, improves security posture.
- **Secret usage simulation** — simulate changes to secrets before applying them, predicting impacted services and risks. "What happens if I rotate this secret?" answered before anything breaks.

#### 🔜 Vision layer (2027, needs foundation first)

- **Trust graph** — dynamic graph of relationships between services, secrets, and identities. Blast radius analysis, dependency visualization, impact prediction. Requires behavioral data foundation first. This becomes the "secret graph" killer feature.
- **Time-travel debugging** — replay historical secret states and system interactions to identify when and why failures occurred. Forensic analysis for incident response. Needs significant audit infrastructure maturity first.
- **Self-healing access policies** — automatically detect and fix broken or misconfigured access policies based on observed failures. Needs ML baseline from behavioral anomaly detection first.
- **Secrets as code intelligence** — analyze codebases to detect implicit secret dependencies, suggest improvements, prevent misconfigurations before deployment. IDE plugin / git hook. Powerful developer adoption tool.
- **Intent-aware secrets** — system understands purpose behind secret usage, validates alignment with expected intent, prevents misuse even when access permissions are technically valid. Advanced zero-trust concept.
- **Ephemeral identity generation** — generate short-lived identities instead of static secrets, tied to workload context. Essentially dynamic secrets v2 with identity context. Build dynamic secrets first.
- **Multi-cloud trust orchestration** — unified trust policies across cloud providers. Relevant once you have K8s auth + cloud integrations working.
- **Human-to-machine trust bridging** — link human access workflows with machine identity systems. Consistent policies across developers, services, and automated agents.

#### ⏳ Edge computing scenarios (niche, not mainstream ICP)

Relevant for defence, industrial, and critical infrastructure customers — but not your primary ICP. Revisit when you have a specific customer in that vertical.

- Offline secret validation during disconnection (air-gapped nodes)
- Compromised node isolation with trust graph recalculation
- Edge-wide rotation with partial connectivity handling

**Note:** Your air-gapped positioning already covers the core need here. These are extensions for specific verticals, not general positioning.

#### ❌ Deprioritised — wrong direction for current ICP

- **Web3 / blockchain scenarios** — key usage anomaly for wallets, programmable key policies, transaction blast radius. European enterprise security teams are not managing private keys for smart contracts. Would confuse positioning. Revisit only if a specific customer requests it.
- **AI agent scenarios (pure)** — agent action tracing, secret misuse prevention for AI agents, policy for AI behavior. Interesting in 2027, but leading with this now sounds trend-chasing. Your ICP doesn't have AI agents in production yet. The behavioral anomaly detection covers the legitimate need without the AI-agent framing.
- **Runtime secret sandboxing** — isolate secrets in runtime environments. Very complex, unclear enterprise buyer need today.

### Product Roadmap Implications (Vision Layer)

These are not near-term features — they are the 2027 product direction:

- [ ] **Unified control plane** — one policy model and one audit trail spanning local dev → CI/CD → Kubernetes → cloud. Works on top of existing tools (Vault, AWS SM, Azure KV) as an abstraction layer.
- [ ] **Secret graph** — dependency mapping showing which services use which secrets, blast radius analysis if a secret is rotated or compromised, impact visibility before making changes.
- [ ] **AI debugging copilot** — "Why did rotation fail?" "Why can't this service access a secret?" "What broke after deployment?" Natural language root cause analysis on audit logs and access patterns.
- [ ] **Self-healing secrets** — automatic retry on rotation failure, fallback mechanisms, policy auto-fix suggestions.
- [ ] **Rotation debugger** — visual state inspector showing rotation progress, dependency status, and safe resume paths.
- [ ] **FinOps secret governance** — visible cost of vaulting, rotation, and access policies. Chargeback by team/namespace.

### Two-Layer Positioning Strategy

**Layer 1 — For customers (use now):**
> *"Vault without the complexity, fully on-prem, European company. Single binary, one command to run, audit logs your compliance team can actually use."*

**Layer 2 — For investors and analysts (use when pitching vision):**
> *"We're building the Secrets Runtime Platform — the first solution that unifies secrets management across the entire development lifecycle with intelligence, observability, and self-healing. Think Datadog, but for secrets behavior."*

**Rule:** Never lead with Layer 2 in a customer call. They want to know if their Vault replacement works, not hear about the future of the category. Win the deal first, expand the vision later.

### Market Gap Summary (from public complaint analysis)

| Pain | Frequency | Best current solution | Keyorix opportunity |
|---|---|---|---|
| Operational complexity | Very high | None — all tools suffer | Simple ops is core differentiator |
| Fragmentation across envs | Very high | None fully solved | Unified control plane (roadmap) |
| Broken rotation | High | None | Rotation debugger (roadmap) |
| Local dev chaos | High | Infisical (partial) | `keyorix run` + local-first mode |
| No secret graph | Medium | None | Secret graph (roadmap) |
| Poor debuggability | High | None | AI copilot (roadmap) |
| Cloud vendor lock-in | High | On-prem tools | Core Keyorix strength today |
| EU data sovereignty | Medium-high | None (Keyorix only) | Core Keyorix strength today |

---

## 9. SDLC Decisions

These decisions are made. Do not relitigate without a documented reason.

### GitHub organisation
- **Org:** `github.com/keyorixhq`
- **`keyorix`** — public (AGPL, correct)
- **`keyorix-web`** — private (dashboard, not open sourced)
- **`keyorix-landing`** — private (marketing site, not open sourced)
- **`keyorix-go`** — public (Go SDK)
- **`keyorix-python`** — public (Python SDK)

**Public repo description — ✅ Updated April 2026:** *"Lightweight on-premise secrets management for European enterprises. AGPL. No SaaS dependency. Air-gap compatible. NIS2/DORA aligned. AI-native via MCP server — roadmap."*

**GitHub topics — ✅ Added April 2026:** `secrets-management`, `devops`, `security`, `golang`, `on-premise`, `gdpr`, `vault-alternative`, `air-gap`, `devsecops`, `european`

**GitHub stars target:** Goal: 50-100 before KubeCon EU. Stars are the first social proof signal a technical evaluator checks.

### AI tooling in development
- **Kiro (Amazon)** — AI IDE used heavily during build phase. `.kiro/specs/` directory contains feature specs for: secret sharing, web dashboard, remote CLI, internationalisation, test completion, architecture cleanup. This explains the codebase maturity relative to a solo founder's timeline.
- **Claude** — strategy, analysis, writing, code review (this document)
- **Claude Code** — development assistance
- **Perplexity** — OSINT, market research, competitor monitoring

Rule: AI output is always reviewed before committing. No AI-generated security-critical code without a human reading every line. Kiro-generated specs in `.kiro/` are planning artefacts — verify implementation against them before claiming features are complete.

### CLI binary name
- Binary: `keyorix`
- Brand: `Keyorix`
- Legal entity: `Keyorix SL` (Spain)
- Domain: `keyorix.com`
- GitHub org: `keyorixhq`

### Security tooling
| Tool | Purpose | When it runs |
|---|---|---|
| `govulncheck` | Go vulnerability database scan | CI — every PR, blocks merge on critical |
| `gosec` | Static analysis — Go security anti-patterns | CI — every PR, results reviewed |
| `golangci-lint` | General lint + vet | CI — every PR |

### Code Quality Baseline (April 2026)

Current state after first full quality pass:

| Tool | Status | Notes |
|---|---|---|
| `gofmt` | ✅ Clean | 73 files reformatted; zero formatting debt |
| `go vet` | ✅ Clean | 2 test signature mismatches fixed in `auth_test.go` |
| `govulncheck` | ✅ 0 vulns | 0 vulnerabilities in called code |
| `gosec` | ✅ 0 HIGH/MEDIUM | 10 LOW remaining — all in test helpers, accepted |
| `golangci-lint` | ⚠️ Not yet run | Blocked on CI setup |
| `go test -race` | ⚠️ Partial | Core packages pass; 4 pre-existing failures (mock mismatch, integration tests need running server) |

**Pending for tomorrow:**
- [ ] Pre-commit hooks (gofmt + go vet + golangci-lint on staged files)
- [ ] GitHub Actions CI (push → vet → lint → test → govulncheck → gosec)
- [ ] Prettier check on `keyorix-web` (CI)
- [ ] Prettier fix pass on `keyorix-mcp` and `keyorix-node`
- [ ] black check on `keyorix-python` (CI)
- [ ] Test coverage baseline (`go test -coverprofile`)
- [ ] OpenAPI spec — auto-generate from chi router or hand-write for `/api/v1` endpoints

### Branching strategy
- **GitHub Flow** — `main` is always deployable, feature branches, PR required for merge
- No `develop` branch. No gitflow. Too much ceremony for current stage.
- Branch naming: `feat/`, `fix/`, `chore/`, `sec/` prefixes

### Release process (current)
- Semantic versioning: `MAJOR.MINOR.PATCH`
- GitHub Releases with changelog
- Docker image on GitHub Container Registry (ghcr.io)
- No automatic deployment — customer pulls and deploys

### Testing requirements
- Unit tests required for all business logic
- Integration tests required for storage layer (both SQLite and PostgreSQL drivers)
- No merge without tests for new features
- `go test -race` in CI — data race detection

### Documentation standards
- README must cover: install, quickstart, configuration reference
- Every API endpoint documented (OpenAPI spec — target)
- Architecture decision records (ADRs) in `/docs/decisions/`
- **Rebrand:** 50 files still reference old product name "Secretly" — batch replace pending (see §11)

---

## 10. Licence Strategy

### Decision: Dual Licence (AGPL + Commercial)

**Community edition:** GNU Affero General Public License v3 (AGPL-3.0)
- Free to use, modify, distribute
- AGPL copyleft triggers if you run it as a network service — forces contribution back or commercial licence
- Specifically chosen because it closes the "SaaS loophole" that MIT/Apache permits

**Commercial / Enterprise edition:** Proprietary commercial licence
- Required for: organisations that cannot comply with AGPL (internal policy), enterprise features (HA, SSO, audit log export, SLA), OEM / redistribution

### Why not MIT or Apache?
- MIT/Apache would allow a hyperscaler to fork, add managed service, and compete directly
- We are not HashiCorp — we cannot absorb that risk at this stage

### Why not BSL (Business Source Licence)?
- HashiCorp's BSL switch created significant community backlash — that backlash is our recruiting and community strategy
- BSL is not OSI-approved; enterprise legal teams sometimes reject it
- AGPL is battle-tested, legally understood, achieves the same commercial protection

### Contributor Licence Agreement (CLA)
- CLA required for external contributions
- CLA grants Keyorix the right to relicence contributions under commercial licence
- Use CLA Assistant (GitHub App) to automate

### Enterprise Feature Gate
Features reserved for commercial licence (indicative, not exhaustive):
- LDAP / SAML / OIDC SSO
- Audit log streaming (Splunk, ELK)
- HA / clustering support
- Priority support SLA
- FIPS 140-2 mode (future)

---

## 11. Open Items and Known Gaps

These are tracked here until they have a home on the GitHub board. Severity reflects impact on first paying customer or co-founder recruitment.

### 🔴 Critical — fix before any security review or enterprise POC

- [x] **Private key committed to repo** — Verified April 2026: key was never committed, already covered by `/security/` rule in `.gitignore` (line 130). Cert rotated anyway: regenerated as 4096-bit RSA, org updated Secretly → Keyorix, jurisdiction US/CA/San Francisco → ES/Valencia/Valencia. `openssl.conf` updated to match.

- [x] **Timing attack on token comparison** — Fixed April 2026. `internal/encryption/auth_encryption.go` line 284: replaced `storedToken == plainToken` with `subtle.ConstantTimeCompare([]byte(storedToken), []byte(plainToken)) == 1`. Added `crypto/subtle` import. All encryption tests pass.

- [x] **DEK not wrapped by KEK** — Implemented April 2026 (ADR-004). Full envelope encryption wired: passphrase → PBKDF2-SHA256 (600k iterations) → KEK (memory only, wiped after unwrap) → unwraps wrapped DEK from disk → DEK passed to EncryptionService. KEK never written to disk. Salt stored at `keys/kek.salt`. Passphrase via `KEYORIX_MASTER_PASSWORD` env var. 9 files changed. All encryption tests pass.

- [x] **Encryption-disabled silent mode** — Fixed April 2026. Warning banner added to `NewService()` in `internal/encryption/service.go`. Prints to stderr via `log.New(os.Stderr)` when `cfg.Enabled == false`. Fires at service creation before any operations. All encryption tests pass.

### 🟡 High — Security backlog (post-M1)

- [ ] **AAD binding in AES-256-GCM** — Bind ciphertext to context by passing `secretID + namespaceID + versionNumber` as Additional Authenticated Data to `gcm.Seal()`. Prevents ciphertext transplantation between secrets. Medium effort. See §4 known issues.
- [ ] **KEK rotation re-encryption sweep** — Current `RotateKEK()` generates new KEK but does not re-encrypt existing secrets. Old KEK backups accumulate on disk. True rotation requires atomic re-encryption sweep of all secrets. Write ADR before implementing. High effort.
- [ ] **TestSharingHTTPIntegration hardcoded tokens** — `sharing_integration_test.go` still uses `valid-token` and `recipient-token` via `newSharingTestCore()`. Needs refactor to use real session tokens like the main integration test. Medium effort.

### 🟠 Medium — Security hygiene (before seed round)

- [x] **`gosec` baseline** — ✅ Done April 2026. 0 HIGH/MEDIUM findings. 26 LOW accepted. Reports in security/scans/gosec-2026-04.txt.
- [x] **`govulncheck` baseline** — ✅ Done April 2026. 0 vulnerabilities in called code. Reports in security/scans/govulncheck-2026-04.txt.
- [ ] **CSP `unsafe-eval` inconsistency** — `security/policies/csp.conf` has `unsafe-eval`, `security-headers.conf` does not. Clarify which is served, eliminate `unsafe-eval` from both. Symbolically important for a security product. Low effort.
- [ ] **Threat model document** — Write a one-page document: attack surface diagram, top 5 threat vectors, mitigations in place, known gaps. Required for enterprise security review and seed round due diligence. Low effort.
- [ ] **Audit log tamper resistance** — Current audit log is append-only in PostgreSQL but a DB admin can delete rows. Document this limitation honestly in security FAQ. For NIS2 compliance claims, note that external log shipping (Splunk, ELK) is the enterprise-tier solution. Low effort to document, medium effort to implement log shipping.

### 🔵 Partnership — Clearway CA

**Clearway CA** — x.509 certificate management solution built by ex-Microsoft colleague. On-premise, has a few existing deployments in ex-Microsoft enterprise customers. Website in progress.

- [ ] **Technical call** — 3 questions: (1) REST API surface for cert operations (issue/renew/revoke)? (2) Pricing model? (3) Open to joint customer intro meeting?
- [ ] **Explore integration** — if REST API exists, a "Certificates" tab in Keyorix sidebar talking to Clearway CA backend is feasible. User never leaves Keyorix UI.
- [ ] **Formal partnership agreement** — start with referral arrangement (15-20% revenue share on referred deals), formalise after first shared customer.
- [ ] **Joint go-to-market angle** — "Complete secrets + certificate management stack, fully on-premise, European company, GDPR native." No American vendor can say this.
- [ ] **Warm intro opportunity** — ask for intro to one of his existing ex-Microsoft customers to explore whether they also need secrets management.

**Why this matters:** Keyorix handles application secrets, Clearway CA handles certificate lifecycle. Together = complete security stack for on-premise European enterprises. Complementary, not competing.

### 🟡 High — required for M1 (first paying customer)

- [ ] **LOI formalisation** — 5 verbal LOIs need to become signed one-page letters. Draft template.
- [ ] **Soft delete storage + service layer** — `SoftDeleteConfig` and `PurgeConfig` are config-only stubs. Implement using version history as the restore source (see §4 architectural note). Write ADR first.
- [ ] **gRPC protobuf registration** — wire existing service implementations to proto definitions. Server infrastructure is complete.
- [ ] **Authentication mechanism documentation** — write up what exists (session tokens, API tokens, API clients) for security review handoff.
- [ ] **Spanish legal entity** — incorporate SL, open business account. Required before first contract.
- [ ] **Pricing model** — per-node, per-seat, or annual contract minimum? Must be defined before first paid LOI converts.

### 🟠 Medium — required for M2 (seed round readiness)

- [x] **GitHub repo description** — Updated April 2026: "Lightweight on-premise secrets management for European enterprises. AGPL. No SaaS dependency. Air-gap compatible. NIS2/DORA aligned. AI-native via MCP server — roadmap."
- [ ] **GitHub stars** — target 50-100 before KubeCon EU. Plan: HN Show HN post, relevant subreddits (r/devops, r/netsec), posting in OpenBao / HashiCorp alumni communities.
- [x] **"Secretly" rebrand** — Completed April 2026. All docs, examples, configs, .gitignore, Taskfile.yml, server/Makefile updated. Proto file renamed: `secretly.proto` → `keyorix.proto`, package `secretly.v1` → `keyorix.v1`, go_package updated to `keyorixhq/keyorix`. Stale test-reports/*.out and sharing_test_suite.go.bak deleted.
- [ ] **CSP `unsafe-eval` inconsistency** — `csp.conf` has `unsafe-eval`, `security-headers.conf` does not. Clarify which is served, eliminate `unsafe-eval` from both. For a security product this matters symbolically.
- [ ] **AAD binding in GCM** — bind ciphertext to `secretID + namespaceID + versionNumber`. See §4.
- [ ] **KEK rotation re-encryption sweep** — current rotation leaves old ciphertext under old key. Design atomically, implement carefully. ADR required.
- [ ] **Threat model document** — written, reviewable by external security engineer.
- [ ] **`gosec` baseline** — run, triage findings, document accepted risks.
- [ ] **`govulncheck` baseline** — run against all dependencies, resolve or document critical/high findings.
- [ ] **Test coverage report** — `go test -coverprofile` baseline before co-founder starts.
- [ ] **OpenAPI spec** — autogenerate or write by hand, publish with release.
- [ ] **ADR backfill** — document decisions already made: cipher choice, GORM, Cobra, dual licence, GitHub Flow.
- [ ] **Compliance documentation** — `security/compliance/` is empty. Create at minimum: a one-page data flow diagram, a statement of what NIS2/DORA controls Keyorix satisfies, and a security FAQ for prospects. These do not need to be formal — they need to exist.
- [ ] **Vulnerability scan baseline** — `security/scans/` is empty. Run `gosec`, `govulncheck`, and a dependency audit. Store reports here.
- [ ] **`keyorix-web` git history cleanup** — `.env.production` and `.env.development` are committed to git history. Files are currently clean (no real credentials) but should be removed from history before any serious external review. Fix with BFG Repo Cleaner after ENISA permits approved. For now: files removed from tracking via `git rm --cached`, added to `.gitignore`.
- [ ] **Technical co-founder profile** — written spec, equity framework, vesting schedule.
- [ ] **OpenBao community outreach** — identify 5 target individuals, use Template D from §13.

### 🔴 High Priority — Keyorix CLI Scanner (Scan → Explain → Fix)

**Design principles:**
1. Value in < 30 seconds
2. Default = no config required
3. Three core commands maximum
4. Everything else = optional flags
5. Always guide to next step after every command

**Command hierarchy:**

MUST (MVP):
- `keyorix secret scan [path]` — entry point, find secrets instantly
- `keyorix explain <key>` — explain risk + impact + fix suggestion
- `keyorix fix <key>` — actually solve the problem

NICE TO HAVE (next sprint):
- `keyorix import --from-scan` — store secrets after user understands value
- `keyorix scan --apply` — one-shot scan + explain + fix

LATER:
- `keyorix sync`
- `keyorix scan --include-history` (git history scan — expensive)

**Current status:**
- [x] `keyorix secret scan [path]` — ✅ Shipped. Path scanning, risk scoring, JSON report, `--import` flag.
- [ ] `keyorix secret scan --staged` — scan git staged files (pre-commit use case)
- [ ] `keyorix secret scan --commit <ref>` — scan specific commit
- [ ] `keyorix secret scan --severity <level>` — filter by low/medium/high
- [ ] `keyorix explain <key>` — static pattern-based explanation (no AI needed for v1)
- [ ] `keyorix fix <key> --dry-run` — show what would change, require confirmation (dry-run DEFAULT)
- [ ] `keyorix fix --all --interactive` — step through each finding interactively
- [ ] `.keyorixignore` support — allowlist file to exclude files/dirs/patterns

**UX rules (non-negotiable):**
- Never require login, project setup, or cloud connection for scan/explain/fix
- After every command, show next step hint
- dry-run is DEFAULT for fix — automatic mode requires explicit `--force` flag
- `keyorix fix` modifying source files is HIGH RISK — always confirm before writing

**Why this beats Infisical:**
| Area | Infisical | Keyorix |
|---|---|---|
| Entry point | Setup first | Scan instantly |
| Time to value | Delayed | < 30 seconds |
| Complexity | High | Low |
| Flow | Flexible (too many options) | Opinionated |

**Build order for next session:**
1. `--staged`, `--commit`, `--severity` flags on existing scan (1 hour)
2. `keyorix explain <key>` — static pattern-based, no LLM needed (1 hour)
3. `keyorix fix <key> --dry-run` — preview mode default (2-3 hours)
4. `keyorix fix --all --interactive` — step through findings (later)

- [ ] **Context-aware detection** — skip findings where right-hand side is a function call to a secrets manager (already using secure storage). Medium effort, M2 item.

### 🔵 Developer Experience — Ease of Use Layer

Three layers of friction reduction, in priority order.

#### Layer 1 — Zero Friction Start (highest priority, next sprint)

- [x] **Install script** — `curl -L https://raw.githubusercontent.com/keyorixhq/keyorix/main/install.sh | sh` — implemented April 2026. Detects OS/arch, downloads from GitHub Releases v0.1.0. Tested on darwin/arm64.
- [ ] **`keyorix start` command** — wraps server startup with friendly output showing what was created. Output should show: environments created, web UI URL, next step hint. Makes the "batteries included" moment visible.

```
✓ Keyorix started
✓ Three environments ready: development, staging, production  
✓ Web UI: http://localhost:3000
✓ Next: keyorix secret create my-first-secret
```

#### Layer 2 — Developer Daily Workflow (next sprint)

- [ ] **`keyorix run` command** — injects secrets as environment variables into any process. Zero app code changes. Matches Infisical's best-in-class UX.

```bash
keyorix run --env production -- node app.js
keyorix run --env development -- flask run
keyorix run --env staging -- ./gradlew bootRun
```

- [ ] **`keyorix export` command** — export secrets in multiple formats for tools that need files.

```bash
# Export as shell eval
eval $(keyorix export --env production --format shell)

# Generate .env file
keyorix export --env development --format dotenv > .env

# Export as JSON
keyorix export --env production --format json
```

#### Layer 3 — Team Automation (Month 2-3)

- [ ] **`keyorix sync` command** — sync secrets between environments with dry-run preview.

```bash
# Preview what would change
keyorix sync --from staging --to production --dry-run

# Apply sync
keyorix sync --from staging --to production
```

- [ ] **`keyorix audit` CLI** — query audit log from terminal without opening web UI.

```bash
# Who accessed what in last 7 days
keyorix audit --env production --since 7d

# Secrets not accessed in 90+ days (candidates for cleanup)
keyorix audit --unused --older-than 90d
```

- [ ] **`keyorix rotate` bulk** — rotate multiple secrets matching a filter.

```bash
# Preview rotation candidates
keyorix rotate --older-than 90d --dry-run

# Execute rotation
keyorix rotate --older-than 90d
```

- [ ] **`keyorix user invite`** — onboard a new developer with appropriate access in one command.

```bash
keyorix user invite andrei@company.com   --role developer   --env development,staging
```

### 🔵 MCP Server — AI Integration

**Decision: Build the MCP server. This is the right "AI-powered" claim.**

An MCP server allows Claude (and any MCP-compatible AI assistant) to talk directly to Keyorix in natural language. A developer or admin can say:

> *"Create a secret called db-password in the production environment"*
> *"Show me all secrets that haven't been accessed in 30 days"*
> *"Who accessed the api-key secret last week?"*
> *"Rotate all secrets older than 90 days in staging"*

**Why this is better than building NLP ourselves:**
- Real AI integration with existing ecosystem — not fake AI
- Buildable in ~1 week using the MCP SDK
- Doppler already advertises their MCP server — table stakes soon
- Defensible ENISA "AI-powered" claim — demonstrably real, not aspirational
- No ML infrastructure required — Keyorix provides the tools, Claude provides the intelligence

**ENISA angle:** If a reviewer asks "where's the AI?" — demonstrate Claude talking to Keyorix via MCP: creating secrets, querying audit logs, detecting access anomalies. This is a stronger claim than NLP query parsing.

**MCP server capabilities to expose (v1):**
- `create_secret` — create a secret in a project/environment
- `get_secret` — retrieve a secret value
- `list_secrets` — list secrets with filters
- `delete_secret` — delete a secret
- `list_audit_events` — query audit log
- `list_users` — list users and their access
- `create_user` — invite a new user
- `get_stats` — dashboard statistics
- `list_environments` — list projects and environments

**Build order:** `keyorix run` → install script → MCP server → `keyorix export` → `keyorix sync`

- [x] **MCP server built** — April 2026. github.com/keyorixhq/keyorix-mcp v0.1.0. 8 tools shipped.

### 🔵 MCP Demo — Deferred

- [ ] **Claude Desktop live demo** — MCP server connects and tools register correctly but Claude Desktop tool-calling is in beta rollout and not triggering reliably. Revisit when Claude Desktop MCP is stable. Do NOT build Streamlit/Gradio wrapper — product demo (dashboard + CLI) is stronger for investors and ENISA.
- [ ] **MCP token refresh** — session tokens expire after 24 hours. Claude Desktop config requires manual token update. Fix: implement long-lived API tokens for MCP auth, or add auto-refresh to MCP server using KEYORIX_USERNAME + KEYORIX_PASSWORD env vars instead of token.

### 🔵 MCP — Security Backlog (post-seed)

These items were reviewed and deliberately deferred. Do not build before seed round without a specific customer requirement.

- [ ] **Attack simulation harness in CI** — automated adversarial testing: prompt injection, IDOR, enumeration, role escalation, metadata leakage, replay attacks. Good idea, weeks of work. Add to CI after first paying customer.
- [ ] **HSM / KMS integration** — hardware security module or cloud KMS for root key storage. Already in §8c KeyProvider roadmap as 2027 item. Do not duplicate effort.
- [ ] **Approval workflows for production secret access** — require human approval for prod secrets above sensitivity threshold. Enterprise tier feature. Build after seed round when enterprise customers request it.
- [ ] **Physical tenant isolation** — separate DB or sharded storage per tenant. Only relevant for SaaS multi-tenant deployment. Deprioritised until SaaS is revisited (see §6 SaaS decision log).
- [ ] **ABAC (attribute-based access control)** — policy attributes: environment, secret sensitivity, request origin, time constraints. RBAC covers current ICP. ABAC adds 3-6 months. Revisit at M3 when enterprise customers have complex policy requirements.
- [ ] **Per-tenant encryption keys** — cryptographic isolation per customer. Only relevant for multi-tenant SaaS. Deprioritised.

### 🔵 SDKs — Language Coverage

Priority order based on ICP (European enterprise DevOps/security teams):

- [x] **Go SDK** — ✅ Shipped April 2026. github.com/keyorixhq/keyorix-go v0.1.2. Zero deps, stdlib only.
- [x] **Python SDK** — ✅ Shipped April 2026. github.com/keyorixhq/keyorix-python v0.1.1. Zero deps, stdlib only.
- [ ] **Node.js SDK** — P1, next sprint. CI/CD pipelines, frontend tooling. 1 day effort.
- [x] **Java SDK** — ✅ Shipped April 2026. github.com/keyorixhq/keyorix-java v0.1.0.
- [ ] **Rust SDK** — P3, deprioritised. Too niche for current ICP.
- [ ] **SDK (.NET/C#)** — P3, deprioritised. Revisit when Windows enterprise prospect appears.

### 🔵 Demo App — Keyorix Pet Store

A simple demo application (Go or Node.js) that demonstrates real-world Keyorix integration:
- App fetches DB credentials from Keyorix at startup using a service token
- Connects to PostgreSQL, serves a simple REST CRUD API (pets inventory)
- Entire stack runs with `docker compose up` — zero hardcoded credentials
- Audit log shows secret access event in Keyorix dashboard

**Demo script:** show config (no hardcoded password) → `docker compose up` → `curl /pets` → show audit log → rotate secret → app picks up new value.

**Why it matters:** industry standard demo pattern (Conjur uses pet store too). Answers "how does my app actually use Keyorix?" in 2 minutes. Also serves as the foundation for SDK example apps.

- [x] Build pet store demo app in Go — April 2026, lives in keyorix-go/examples/petstore
- [x] Add Node.js version — April 2026, keyorix-node/examples/petstore
- [x] Add Python version — April 2026, keyorix-python/examples/petstore
- [x] Docker Compose file: postgres + pet store app — April 2026
- [x] README with quickstart — April 2026

### 🔵 Recent Fixes & Improvements (April 2026)

- [x] **Vault YAML parser — multi-key format support** — `parseVault()` now handles both Keyorix export format (single `value` key) AND real Vault/Medusa export format (multiple keys per path). `secret/production/database: {password: x, username: y}` → creates `database-password` and `database-username` secrets. Both formats auto-detected.
- [x] **Docker seed endpoint — admin role with full permissions** — `POST /api/v1/system/seed` now creates `admin` role with 11 permissions and `viewer` role with read-only permissions. Assigns admin role to seeded user. Fixes 403 errors on all write operations after fresh Docker deployment.
- [x] **Binary split** — `keyorix` (CLI) and `keyorix-server` (server) are now separate binaries with separate Makefile targets. Reduces attack surface on developer laptops.
- [x] **Docker Compose** — `docker compose up` spins up PostgreSQL + Keyorix server with auto-seeding. Default credentials: admin/Admin123!. Three environments created automatically.
- [x] **Audit log page** — `/audit` route in web UI shows real data from `audit_events` table.
- [x] **Real session auth** — auth middleware now validates tokens against PostgreSQL sessions table instead of hardcoded test tokens.
- [x] **Dashboard API** — `GET /api/v1/dashboard/stats` and `GET /api/v1/dashboard/activity` return real data.
- [x] **Namespace/environment names in secrets list** — backend resolves names server-side, frontend shows `default / production` instead of `/`.
- [x] **`GetAuditLogs` storage implementation** — was a stub returning nil. Now queries `audit_events` table with filters.
- [x] **`--version` flag on CLI** — `keyorix --version` works correctly.
- [x] **`keyorix secret export --output`** — exports to file correctly.
- [x] **User search endpoint** — `GET /api/v1/users/search?q=` for Share modal recipient lookup.
- [x] **Envelope encryption (ADR-004)** — Passphrase-derived KEK, wrapped DEK, KEK never on disk. `KEYORIX_MASTER_PASSWORD` env var. 9 files changed. April 2026.
- [x] **Timing attack fix** — `subtle.ConstantTimeCompare` in `auth_encryption.go`. April 2026.
- [x] **Encryption-disabled warning** — Banner in `NewService()` when `cfg.Enabled == false`. April 2026.
- [x] **SSL cert rotation** — Regenerated 4096-bit RSA, org Keyorix, ES/Valencia. `openssl.conf` updated. April 2026.
- [x] **Create Secret modal fix** — `initialFocus` ref in `Modal.tsx` prevents Headless UI v1.7 focus trap closing dialog on input click. April 2026.
- [x] **Share Secret fix** — Payload mapped to backend field names: `recipient_id`, `is_group`. `api.ts` updated. April 2026.
- [x] **Duplicate secrets fix** — Deduplication by secret ID in `secret_listing.go` after merging owned + shared lists. April 2026.
- [x] **CORS fix** — `keyorix.docker.yaml` set to `environment: development` to allow `localhost:3000` CORS in local dev. April 2026.
- [x] **Rebrand complete** — All "Secretly" references replaced across docs, examples, configs. `secretly.proto` → `keyorix.proto`, package `secretly.v1` → `keyorix.v1`. April 2026.
- [x] **GitHub repo description updated** — "Lightweight on-premise secrets management for European enterprises. AGPL. No SaaS dependency. Air-gap compatible. NIS2/DORA aligned. AI-native via MCP server — roadmap." April 2026.
- [x] **GitHub topics added** — `secrets-management`, `devops`, `security`, `golang`, `on-premise`, `gdpr`, `vault-alternative`, `air-gap`, `devsecops`, `european`. April 2026.
- [x] **`keyorix connect --username --password`** — Single command auth flow. Calls `/auth/login`, obtains session token, saves connection. Fixed health check path (`/health` not `/api/v1/health`). Fixed nil panic in `HTTPClient.Health()`. April 2026.
- [x] **Install script** — `curl -L https://raw.githubusercontent.com/keyorixhq/keyorix/main/install.sh | sh` — detects OS/arch, downloads from GitHub Releases. Supports darwin/amd64, darwin/arm64, linux/amd64, linux/arm64. April 2026.
- [x] **Release build script** — `scripts/build-release.sh` cross-compiles all 4 platforms, generates checksums.txt. Usage: `VERSION=v0.1.0 ./scripts/build-release.sh`. April 2026.
- [x] **v0.1.0 GitHub Release published** — Binary assets uploaded for all 4 platforms. Install script live and tested. April 2026.
- [x] **Go SDK v0.1.0** — `github.com/keyorixhq/keyorix-go` published. Zero external dependencies (stdlib only). New(), Login(), GetSecret(), ListSecrets(), Health(). Unit tests + integration tests. Tagged v0.1.0. April 2026.
- [x] **Java SDK v0.1.0** — `github.com/keyorixhq/keyorix-java`. Zero external dependencies (Java stdlib only, Java 11+). Keyorix.login(), Keyorix.newClient(), client.getSecret(), client.listSecrets(), client.health(). KeyorixException/AuthException/SecretNotFoundException. Hand-rolled JSON parser. 9 unit tests passing. April 2026.
- [x] **Pet store example app** — `github.com/keyorixhq/keyorix-go/examples/petstore`. Go REST API fetching DB password from Keyorix at startup via keyorix-go SDK. Docker Compose stack (postgres + app). Zero hardcoded credentials. Shows audit log entry on startup. April 2026.
- [x] **Python SDK v0.1.0** — `github.com/keyorixhq/keyorix-python`. Zero external dependencies (stdlib only). login(), Client(), get_secret(), list_secrets(), health(). KeyorixError/AuthError/SecretNotFoundError hierarchy. April 2026.
- [x] **SDK endpoint fix** — GetSecret now uses `GET /api/v1/secrets/{id}?include_value=true` (correct endpoint). Fixed in both keyorix-go v0.1.2 and keyorix-python v0.1.1. April 2026.
- [x] **MCP server v0.1.0** — `github.com/keyorixhq/keyorix-mcp`. TypeScript. 8 tools: list_secrets, get_secret, create_secret, delete_secret, list_environments, get_stats, list_audit_events, list_users. Auth via token or username/password. Claude Desktop config documented. April 2026.
- [x] **Anomaly detection baseline v1** — Statistical access pattern analysis on SecretAccessLog. 3 rules: off_hours (22:00-06:00 UTC), new_ip (IP not in 30-day baseline), new_user (user with no prior access). AnomalyAlert model + anomaly_alerts table. Runs hourly on server startup. REST: GET /api/v1/audit/anomalies + acknowledge endpoint. CLI: keyorix anomalies list [--unacknowledged], keyorix anomalies acknowledge <id>. Metadata only — secret values never examined. April 2026.
- [x] **Anomaly alerts wired to dashboard** — Security Alerts panel shows red anomaly alerts (new_ip, off_hours, new_user) with acknowledge button and badge count. Auto-refreshes every 5 minutes. April 2026.
- [x] **MCP security hardening** — list_secrets returns metadata only (id, name, type, environment, namespace, created_at) — never exposes secret values via list. get_secret still retrieves values explicitly. Rate limiting added: 60 requests/minute per client token. Stale entries auto-cleaned every 5 minutes. April 2026.
- [x] **govulncheck + gosec baseline — April 2026** — govulncheck: 0 vulnerabilities in called code. gosec: 0 HIGH or MEDIUM findings. 26 LOW findings accepted and documented. G118 suppressed (context.Background in audit goroutines — intentional). G204 suppressed (subprocess in keyorix run — intentional, same pattern as infisical run). Reports saved to security/scans/.
- [x] **Repo naming consistency** — keyorix-py renamed to keyorix-python. All SDK repos follow pattern: keyorix-go, keyorix-python, keyorix-java (planned), keyorix-node (planned). April 2026.
- [x] **Hardcoded test tokens removed** — `valid-token`, `test-token`, `recipient-token`, `owner-token` removed from production auth middleware (`server/middleware/auth.go`). These allowed authentication against any production server with a known string. April 2026.
- [x] **Login rate limiting** — IP-based rate limiting on `/auth/login`: max 10 failed attempts per 15 minutes per IP, returns HTTP 429 TooManyRequests. Implemented in `server/http/handlers/auth.go`. April 2026.
- [x] **Security audit — clean findings** — Verified: no secret values in logs, token expiry enforced server-side in `ValidateSessionToken`, AES-256-GCM throughout, constant-time token comparison. April 2026.
- [x] **Python pet store example** — `keyorix-python/examples/petstore`. Fetches DB password from Keyorix at startup via keyorix-python SDK. stdlib http.server + psycopg2. Docker Compose stack (port 3002). April 2026.
- [x] **Node.js pet store example** — `keyorix-node/examples/petstore`. Fetches DB password from Keyorix at startup via keyorix-node SDK. Built-in http + pg driver. Docker Compose stack (port 3003). April 2026.
- [x] **Environment selector on secrets page** — Dropdown in primary filter row (All Environments / Development / Staging / Production). Fetches environments dynamically from `/api/v1/environments`. Passes `environment_id` to backend filter. April 2026.
- [x] **Location column → Environment column** — Replaced namespace/zone/environment triple display with single environment pill badge. Renamed column header from "Location" to "Environment". Hides namespace and zone per ADR-001. April 2026.
- [x] **Dashboard trend percentages** — Real % change vs previous day snapshot. New `StatsSnapshot` model stores daily counts. `computeTrend()` calculates % change. `SaveStatsSnapshot` / `GetPreviousStatsSnapshot` in Storage interface. Raw SQL table creation (cross-db safe). StatCards now show real trend arrows. April 2026.
- [x] **Password expiry alerts** — Real data from backend. `getExpiringSecrets()` queries secrets with `Expiration` within 30 days. `ExpiringSecret` type added to `DashboardStats` response. Dashboard shows green shield when no alerts, per-secret list with days remaining (red ≤7 days) when alerts exist. April 2026.
- [x] **gosec G104 fixes — April 2026** — Fixed orphaned secret cleanup in `service.go` (now logs warning instead of silent ignore). Suppressed 14 intentional unhandled returns with `#nosec G104` across 10 files. Issues: 26 → 10, all remaining LOW in test helpers.
- [x] **Makefile targets added** — `make vet`, `make lint`, `make test`, `make test-cover`, `make security`, `make ci`. `go vet` findings fixed in `auth_test.go` (Authentication signature mismatch, validateToken signature mismatch).
- [x] **gofmt pass** — 73 files reformatted to standard Go formatting. Zero formatting debt in Go codebase.
- [x] **keyorix secret scan** — secret scanner for enterprise migration. April 2026. Pattern detection: AWS keys, API tokens, DB passwords, JWT secrets, private keys, Stripe keys, GitHub tokens. Risk scoring: HIGH (hardcoded in source), MEDIUM (.env files), LOW (config files). Flags: `--report` (JSON output for CISO/compliance), `--import` (feeds existing import command). Smart filtering: skips test files, node_modules, vendor, demo dirs, files >1MB. Deduplicates findings by file+line. Placeholder detection (changeme, xxx, your_secret_here). CI green.
- [x] **Secret scanner (scan/explain/fix commands)** — `keyorix secret scan [path]` detects hardcoded secrets across source and config files with risk categorisation. `keyorix secret explain <key>` provides risk context and remediation guidance. `keyorix secret fix <key>` rewrites the offending line in-place and stubs a `.env` entry. Dry-run by default. Bug fixed: `skipDirs` check now guarded with `info.IsDir()` to prevent `filepath.Walk` aborting the entire directory on a filename match.

### 🔵 Roadmap — Enterprise Integration (inspired by Conjur analysis)

- [ ] **Kubernetes secrets injection** — Keyorix operator or CSI driver to inject secrets directly into Kubernetes pods as environment variables or mounted files. Critical for cloud-native enterprise adoption. Reference: Conjur Kubernetes authenticator + Secrets Provider.
- [ ] **`keyorix run` command** — CLI tool that fetches secrets from Keyorix and injects them as environment variables into any process (`keyorix run --env=prod -- npm run dev`). Matches Infisical's best-in-class `infisical run` UX. Zero app code changes required. Service token auth via `KEYORIX_TOKEN` env var. `keyorix init` creates local project config. This is the fastest path to developer adoption.
- [ ] **Dynamic secrets** — Generate credentials on-demand with configurable TTL for databases (PostgreSQL, MySQL), cloud providers (AWS, GCP, Azure), and Kubernetes. Credentials auto-expire and are deleted from the target system when TTL expires. Reduces blast radius vs static long-lived credentials. Inspired by Akeyless and Vault dynamic secrets.
- [ ] **Policy-as-code** — YAML/HCL policy files for defining roles, permissions, and secret access rules. Enterprise buyers expect infrastructure-as-code for security configuration. Reference: Conjur policy YAML format.
- [ ] **One-command demo environment** — Docker Compose file that spins up a complete Keyorix demo (backend + frontend + sample secrets + sample app) with a single command. Keyorix advantage over Conjur: this should take 30 seconds, not 4 hours.
- [ ] **Secret migration tool** — import secrets from HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, and `.env` files into Keyorix. Enterprises always ask "how do I move my existing secrets?" Automated migration removes the #1 adoption blocker. Reference: Akeyless Automated Secret Migration feature.
- [ ] **CI/CD integrations** — GitHub Actions, GitLab CI, CircleCI. Primarily documentation + service token examples + a small helper CLI command. Low engineering effort, high perceived value. Every DevOps team uses at least one of these. Example: `KEYORIX_TOKEN=${{ secrets.KEYORIX_TOKEN }} keyorix run -- ./deploy.sh`
- [ ] **Kubernetes authentication** — allow Kubernetes workloads to authenticate to Keyorix using their Kubernetes service account identity (projected service account tokens / JWT). No static credentials needed in the cluster. This is the most common integration question in the enterprise secrets management space. Reference: Akeyless Kubernetes Authentication, Vault Kubernetes auth method.
- [ ] **Short-lived tokens with automatic refresh** — CLI tokens expire after configurable TTL (default 1 hour). CLI automatically refreshes before expiry using a refresh token. Reduces blast radius of leaked tokens from "permanent access" to "max 1 hour". This is the near-term solution to the Secret Zero problem for static token auth. Implementation: add `expires_at` to sessions table, add `/auth/refresh` endpoint, CLI checks expiry before each command and refreshes automatically.
- [ ] **Cloud IAM authentication (Secret Zero solution)** — allow workloads to authenticate to Keyorix using their cloud platform identity instead of a static token. Priority order: (1) Kubernetes service account tokens, (2) AWS EC2/ECS instance roles, (3) GCP workload identity, (4) Azure managed identity. When running on any of these platforms, `keyorix run` needs zero credentials on disk — the platform proves the identity. This is how Vault, Akeyless, and Conjur solve Secret Zero at enterprise scale. Reference: Vault Kubernetes auth, Akeyless Universal Identity.

**Competitive context:** Conjur demo requires Docker, Ansible, Jenkins, 4 vCPU, 8GB RAM, and half a day to set up. Keyorix runs with one command. This is a core sales talking point.

### 🔵 Secrets Intelligence — From Competitive Analysis (April 2026)

Derived from deep market pain analysis. These address the most universal, most unmet needs across the category.

- [ ] **Secrets usage analytics dashboard** — surface `secret_access_logs` data: which secrets accessed most, by which services, at what frequency. Flag secrets not accessed in 30/60/90 days ("zombie secrets"). One-click review/revoke workflow. Data already exists in DB — this is primarily a frontend + query task.
- [ ] **Rotation state inspector** — visual UI showing rotation in progress, last rotation timestamp, success/failure reason, dependency status. "Why did rotation fail?" answered in plain language in the UI. Market gap: no competitor has this. Aligns with §8b demo scenario "rotation failure" demo.
- [ ] **Secrets health score** — per-secret risk score based on: age since last rotation, access frequency, number of users with access, expiry status. Dashboard widget showing overall workspace health. Compliance-friendly — gives security teams something to show auditors.
- [ ] **Short-lived tokens with silent auto-refresh** — session tokens expire after 1 hour but CLI auto-refreshes silently before expiry. Developer never has to re-auth during a working session. Eliminates the 1Password-style "re-auth every 30 minutes" frustration. Already in backlog — raise to high priority.
- [ ] **Zombie secret detection** — automated detection of secrets not accessed in configurable threshold (default: 90 days). Weekly email/webhook report. "You have 3 secrets that haven't been accessed in 90 days — review them." First secrets manager to offer this proactively.

### 🔵 Innovation Roadmap — Near-term (2026)

Derived from market gap analysis and ICP validation. These address real buyer pain with buildable scope.

- [ ] **Cross-environment drift detection** — compare secrets across dev/staging/prod namespaces, surface mismatches in dashboard, alert on drift. Directly addresses the silent killer pain (deployment breaks because a secret exists in staging but not prod). No auto-healing in v1 — just visibility first.
- [ ] **Zero-touch developer onboarding** — `keyorix init` command that detects user role and auto-provisions access to the right secrets. Eliminates manual `.env` sharing and onboarding friction. Strong adoption driver for bottom-up enterprise sales.
- [ ] **Secrets observability dashboard** — real-time usage insights: which secrets are accessed most, by which services, at what frequency. Usage heatmap. Secrets that haven't been accessed in 90+ days flagged for review. Extension of existing audit layer.
- [ ] **Autonomous rotation triggers** — in addition to scheduled rotation, trigger rotation based on: secret age threshold, anomalous access pattern detected, external breach feed match. Removes manual scheduling burden.
- [ ] **Secret usage simulation** — before rotating or deleting a secret, show which services would be affected. "Safe to rotate?" answered with a single command. Preview mode before destructive operations.

### 🔵 CLI — Rewrite `keyorix system init` command

Current `system init` creates local config files — not useful for the target ICP (enterprise DevOps engineers installing on a server).

**Decision:** Repurpose `system init` as a proper server-side bootstrap command. Remove the interactive wizard concept — enterprise DevOps engineers prefer config files over terminal wizards.

**What `keyorix system init` should do (server-side, run once):**
- Connect to a running Keyorix server
- Verify server is fresh (no admin user exists)
- Create default admin user with a generated password
- Create default namespace, zone, and three environments: development, staging, production
- Print connection instructions for the CLI
- Refuse to run if system is already initialized (idempotent)

**What it should NOT do:**
- Ask interactive questions about gRPC vs HTTP
- Create local config files
- Replace the existing `keyorix.yaml` config approach

**Also build:** `keyorix connect --server http://... --token ...` — single command that replaces `keyorix config set-remote` + `keyorix auth login`. Reduces getting started from 3 commands to 1.

**Config file approach:** Ship a well-documented `keyorix.yaml.example` with comments explaining every option. Enterprise operators prefer documented config files over interactive wizards.

### 🔴 Frontend — Create Secret Modal Input Focus Bug

The "New Secret" modal closes when clicking any input field. Root cause: Headless UI v1.7 Dialog closes when it detects focus moving, even to elements inside the Dialog.Panel. Affects Create Secret, and potentially Edit Secret modals.

**Options to fix:**
1. Upgrade `@headlessui/react` from v1.7.13 to v2.x (breaking changes, requires refactor)
2. Add `initialFocus` ref pointing to the first input so Headless UI knows where focus should be
3. Replace Modal component with a custom portal-based modal that doesn't use Headless UI Dialog

**Workaround for demo:** Create secrets via CLI — `keyorix secret create <name> --value <value>`

### 🔴 Technical Debt — Frontend Rewrite

The current `keyorix-web` React frontend was generated by Claude Code and has significant structural issues:
- Inconsistent API response handling (ID vs id, pageSize vs page_size)
- Complex state management with 3 overlapping systems (Zustand + React Query + custom form store)
- Modal system half-implemented — Share, Edit modals fragile
- Type mismatches between backend JSON and TypeScript types
- Headless UI version conflicts causing crashes
- No error boundaries

**Recommendation:** Rewrite frontend with a simpler, more maintainable stack when technical co-founder joins. Suggested stack:
- React + TypeScript (keep)
- TanStack Query (keep)
- shadcn/ui — replaces custom UI components with battle-tested ones
- Simple useState for forms — remove custom formStore
- Zod for API response validation — catches type mismatches at runtime
- Single source of truth for API types — generate from OpenAPI spec

**Priority:** Medium — current frontend is demo-able for core flows (login, dashboard, secrets list, reveal, delete). Share and edit are fragile but functional enough for demos.

**Do not attempt to fix incrementally** — each fix breaks something else. Rewrite properly with co-founder.

### 🟢 Low / ongoing — ENISA three-year review preparation

- [ ] **Anomaly detection baseline** — statistical access pattern detection on `SecretAccessLog`. No ML required for v1. Target: end of 2026.
- [ ] **Anomaly detection ML** — upgrade baseline to ML-based detection (Isolation Forest or similar). Target: mid-2027.
- [ ] **Tests for InitializeSystem seeding** — unit tests confirming default namespace, zone, environment and admin role created on first init. Deferred from demo sprint.
- [ ] **ENISA progress narrative** — maintain a running log of: what AI features were originally planned, what was validated/invalidated through customer discovery, and what was built instead. This is the pivot story for the 3-year review. Update quarterly.

- [ ] **Verify support@keyorix.com mailbox** — email appears in OpenAPI spec (`support@keyorix.dev` — also confirm correct domain, .com vs .dev). Ensure mailbox exists and is monitored before any public traffic.
- [ ] **Design partner agreements** — written agreement template for early-access customers.
- [ ] **OSINT cadence** — formalise Perplexity + Claude research workflow, weekly competitor monitoring.
- [ ] **Russian-language market** — i18n is live in Russian. Deliberate? If yes, add to ICP section and go-to-market plan.

### Minor cleanup pending

- [ ] `keyorix/.gitignore` header still reads `# Secretly Project` — fix during next cleanup pass (cosmetic only, no functional impact)
- [ ] `security/gosec-report.json`, `semgrep-report.json`, `gitleaks-report.sarif` — contain old "secretly.proto" filename reference in scanned paths list. Historical only, no action needed.

### Known architectural decisions pending (write ADRs)

| Decision | Options | Status |
|---|---|---|
| KEK root for v1 | Passphrase / PBKDF2 — decided and implemented April 2026. See ADR-004. | Done |
| Soft delete restore mechanism | Via SecretVersion (recommended) vs separate recycle bin | Not decided |
| gRPC service registration | Which proto toolchain, when to expose to clients | Not decided |
| HA strategy | PgBouncer, Patroni, or managed PostgreSQL | Not decided |

---

## 12. Discovery Call Script

### Pre-call preparation (10 minutes)
- LinkedIn: who is the person, what is their background
- Company: industry, size, EU presence, any public security incidents or audit news
- Tech stack signals: job postings mentioning Vault, Kubernetes, secrets management
- Existing tool signals: GitHub repos, blog posts, conference talks

### Opening (2 minutes)
> *"Thanks for making time. Before I say anything about what we're building, I'd love to understand your world a bit. You're in [DevOps / Security] at a company with [N] people — can you tell me a bit about how your team handles secrets today? I mean passwords, API keys, certificates — the stuff that should never end up in a Git repo."*

**Listen for:**
- "We have Vault but..." → orphaned, over-complex, unmaintained
- "We use [Java tool / CyberArk]..." → hardware cost, operational burden
- "We don't really have anything formal..." → compliance gap, high urgency
- "We use Doppler / 1Password Secrets..." → may not be ICP (SaaS acceptable)

### Pain excavation (10 minutes)
Follow-on questions — use based on what you hear:

**On Vault:**
- "Who owns the Vault cluster day-to-day? What happens if they leave?"
- "Have you ever had a Vault seal that nobody knew how to fix?"
- "When did you last audit who has access to what?"

**On hardware / Java tools:**
- "What's your secrets manager running on today? Is that resource allocation justified?"
- "Have you priced what it would cost to right-size that infra?"

**On compliance:**
- "Are you in scope for NIS2 or DORA? Have auditors looked at your secrets management specifically?"
- "Can you produce an audit log of every secret access in the last 90 days?"

**On build/buy:**
- "Has anyone on the team suggested building something internal? What happened?"

### Qualification checkpoint (internal — do not say aloud)
Before continuing: Can they buy? Is SaaS disqualified? Is there a champion? Is there budget urgency?

If SaaS is acceptable → deprioritise, end call gracefully.
If on-prem required and there's pain → continue.

### Product positioning (5 minutes)
Only after you have heard their pain. Mirror their language back.

> *"What you're describing is exactly what we built Keyorix for. [Echo their specific pain]. Here's what we've built: a single binary, no JVM, no SaaS dependency. You deploy it on your infra, it runs on PostgreSQL, and your DevOps team can operate it without a dedicated secrets admin. Audit logs are append-only and signed — your compliance team will appreciate that."*

Show, don't tell: if possible, share screen and run through a 3-minute demo.

### Next steps (3 minutes)
- **If strong signal:** "Would you be open to a 30-day design partner engagement? You'd get early access, direct access to me, and your feedback shapes the roadmap. In return, I'd ask for a written reference if it works for you."
- **If warm but not urgent:** "Can I send you a one-pager? I'd like to follow up in 30 days once we have a design partner case study to share."
- **If weak signal:** "Thanks for your time. I'll keep you on our list — if your situation changes, especially around compliance reviews, reach out."

### Post-call (within 24 hours)
- Update CRM / Notion with: pain identified, qualification status, next step, follow-up date
- Send follow-up email with one-pager or next-step confirmation
- If design partner candidate: send design partner agreement template

---

## 13. Outreach Templates

### Template A — Cold outreach to DevOps lead (LinkedIn)

**Subject / Message:**
> Hi [Name], I noticed [Company] is running [Kubernetes / Vault / signal from job posting]. I'm building an on-premise secrets manager in Go — lightweight Vault alternative, single binary, no JVM, designed for teams that need air-gap or data sovereignty compliance.
>
> We're doing early-access design partner deployments. Happy to share what we've built — no pitch, just a 20-minute conversation to see if there's a fit.
>
> Worth a quick call?

---

### Template B — Warm intro follow-up (post-conference)

> Hi [Name], great to meet at [KubeCon / event]. You mentioned your team has been looking at alternatives to Vault — that's exactly the problem Keyorix is built for.
>
> We're a European-native, on-premise secrets manager — Go binary, PostgreSQL backend, built specifically for teams with data sovereignty or air-gap requirements. Five companies are already evaluating it.
>
> Would a 30-minute call make sense? I can show you what it looks like deployed.

---

### Template C — Vault health assessment intro (consulting-led funnel)

> Hi [Name], I specialise in Vault health assessments for mid-market security teams — I audit your cluster, flag upgrade risks, and give you a written report on operational posture.
>
> It's a fixed-fee engagement, typically 2-3 weeks, and the output is something you can show your CISO and your auditors.
>
> Is this something your team has had bandwidth to look at? Happy to share scope and pricing.

---

### Template E — Discovery Call Prep Sheet: Oil & Gas / Distributed Infrastructure

**Prospect profile:** Large enterprise with distributed physical infrastructure (gas stations, retail locations, factories). Uses Active Directory + HashiCorp Vault for auth. High RPS load. NIS2/DORA compliance concerns.

**Qualification score triggers:**
- 500+ locations → high secrets sprawl
- AD + Vault already in place → Keyorix is additive, not replacement
- NIS2/DORA mention → compliance budget exists
- "We don't know how many..." → immediate pain

---

**Call structure (20 minutes)**

**[0:00-2:00] Open with what you know**
> "You mentioned AD is under huge load from the stations — how long has this been a problem, and what has it cost in engineering time and incidents?"

Goal: get them emotional, not technical. Let them describe the pain.

---

**[2:00-8:00] Secrets sprawl discovery**

1. "Across those 5000 stations — how do the POS systems authenticate to your backend services? Are there API keys or service tokens involved?"

2. "When a station's credentials need to be rotated or revoked — say after a security incident or a station closing — how does that work today? How long does it take?"

3. "Do you have a way to know, right now, which station is using which credential? Or which service has access to what?"

4. "Have you ever had a situation where a secret leaked — contractor left, device compromised? What happened?"

5. "Your loyalty card system talks to your backend — are those API keys the same across all stations or per-station? How are they managed?"

---

**[8:00-12:00] Compliance and audit**

6. "Given you're in energy/oil — you're likely under NIS2. Does your current setup give you the audit trail showing who accessed what credential and when?"

7. "When your auditors ask about privileged access management — what do you show them today?"

---

**[12:00-16:00] Organizational and budget**

8. "Who else is involved in decisions about secrets and credential management — is it just you or do you have a security team?"

9. "Do you have budget allocated for infrastructure security tooling, or would this come from a different line?"

10. "What would a 30-day pilot look like for you — would you test it with one region of stations first?"

---

**[16:00-20:00] The pivot question**

> "If I could show you, in 20 minutes, how to know exactly which credential is used at which station, rotate it remotely in one command, and have a full audit log of every access — would that be worth a follow-up call?"

If yes: book the demo immediately before hanging up.

---

**What to listen for — signal decoder**

| What they say | What it means | Your response |
|---|---|---|
| "We had an incident where..." | Urgency — something broke | "Tell me more — that's exactly what Keyorix prevents" |
| "I don't actually know how many..." | Active secrets sprawl pain | "That's the most common thing we hear. Want to see how we map it?" |
| "Our auditors keep asking..." | Compliance budget exists | "We generate the audit report automatically. That's 10 minutes with Keyorix." |
| "We've been meaning to fix this..." | Low urgency, needs nurturing | Add to 30-day follow-up sequence |
| "We already have X for that" | Incumbent present | "Does X work across all 5000 stations with full audit logs?" |
| "Who are you again?" | No trust yet | Slow down, tell the story, don't pitch |

---

**The HRPS pivot (if they keep talking about AD load)**

If the conversation stays on AD/RPS performance and they're not engaging on secrets:

> "The AD offload problem you're describing is genuinely interesting — we're researching that space and I'd love to stay in close contact as we develop something. Separately, can I ask one question about the secrets side? Because that's where we can help you today."

Then pivot to secrets questions above. Don't get lost in the HRPS rabbit hole.

---

**Follow-up email template (send within 2 hours)**

Subject: Following up — secrets management across your stations

> Hi [Name],
>
> Really enjoyed our conversation about the AD bottleneck — the scale of what you're managing across 5000 stations is impressive.
>
> I want to follow up on something specific: the API keys, service tokens, and database credentials those stations use to talk to your backend. Based on what you described, I think you might have significant secrets sprawl that's invisible to you right now — and that's a compliance and security risk, especially under NIS2.
>
> Keyorix gives you a full inventory of every credential, who has access, when it was last used, and one-command rotation. Fully on-premise, no SaaS dependency.
>
> Would you have 20 minutes this week for me to show you what that looks like for a distributed infrastructure like yours?
>
> Best,
> Andrei

### Template D — Technical co-founder outreach (OpenBao community)

> Hi [Name], I've been following your contributions to OpenBao — your work on [specific area] is exactly the kind of engineering approach I'm looking for.
>
> I'm the founder of Keyorix — we're building a lightweight secrets manager for European enterprises that need on-prem / air-gap deployments. Go backend, SQLite + PostgreSQL, AGPL dual licence. Working prototype, 5 LOIs, no funding yet.
>
> I'm looking for a technical co-founder who understands this space deeply. If the BSL situation at HashiCorp frustrated you as much as it frustrated our customers, I think we'd have an interesting conversation.
>
> Up for a 30-minute call?

---

## 14. GitHub Project Board — Definitions of Done

### Board Columns

| Column | Meaning |
|---|---|
| **Backlog** | Identified, not yet scheduled |
| **Ready** | Scoped, has acceptance criteria, unblocked |
| **In Progress** | Actively being worked |
| **In Review** | PR open, awaiting review |
| **Done** | Merged to `main`, tested, changelog updated |

---

### Definitions of Done — by issue type

#### Feature
- [ ] Code written and passes `go test ./...`
- [ ] `go test -race` passes
- [ ] `govulncheck` passes (no new critical/high)
- [ ] `gosec` output reviewed and any findings addressed or explicitly accepted with comment
- [ ] Unit tests cover the happy path and at least two failure modes
- [ ] If storage layer: integration tests pass against both SQLite and PostgreSQL
- [ ] README or docs updated if user-facing behaviour changed
- [ ] PR reviewed by at least one other person (or founder self-review with explicit sign-off comment until co-founder hired)
- [ ] Merged to `main` via PR — no direct pushes

#### Bug fix
- [ ] Regression test added that reproduces the bug before the fix
- [ ] Fix makes the regression test pass
- [ ] No new `govulncheck` or `gosec` findings introduced
- [ ] PR merged with reference to issue number

#### Security finding
- [ ] CVE or finding documented in issue with severity rating
- [ ] Fix implemented and verified
- [ ] `govulncheck` clean after fix
- [ ] If customer-facing: disclosure note prepared (even if not sent)
- [ ] Merged — security fixes get priority review

#### Infrastructure / DevOps
- [ ] Change tested in local environment before PR
- [ ] Docker Compose / Helm changes validated with `docker compose up` or `helm lint`
- [ ] README updated if deployment steps changed

#### Documentation
- [ ] Content reviewed for accuracy against current codebase
- [ ] No references to unimplemented features stated as current
- [ ] Spell-checked
- [ ] Merged

---

### Current Milestone: M1 — First Paying Customer

**Definition of done for M1:**
- [x] **PostgreSQL integration tested** — ✅ Completed April 2026. 31 models migrated cleanly, auth flow working, secret CRUD confirmed, versioning confirmed (v1 and v2), AES-256-GCM encryption confirmed. Known minor issue: ListSecrets returns empty for owner — filter bug, not a blocker. Fixes made during test: storage factory wired to server (was hardcoded SQLite), GORM driver updated, auth middleware wired to database, Permission/RolePermission models added, admin role seeded on init, session token column name fixed.
- [ ] RBAC enforced (confirmed in schema and service layer — needs end-to-end test)
- [ ] Audit log persisted and retrievable via API
- [ ] Authentication mechanism documented and reviewed
- [ ] One design partner deployed and running in production
- [ ] Written LOI converted to signed contract
- [ ] Keyorix SL legally incorporated (bank account opening April 2026, entity submission follows)
- [ ] Pricing model defined and in writing

**Target date:** TBD — set after PostgreSQL integration test confirms production readiness

---

### Current Milestone: M2 — Co-founder + Seed Round Readiness

**Definition of done for M2:**
- [ ] Technical co-founder signed (equity, vesting, role defined)
- [ ] 3 paying customers
- [x] Security scan baseline complete — govulncheck clean, gosec 0 HIGH/MEDIUM, reports in security/scans/
- [ ] Encryption implementation externally reviewed
- [ ] OpenAPI spec published
- [ ] KubeCon EU talk submitted or attended with pipeline generated

---

*Document owner: Founder*
*Version 1.3 — last updated: April 19, 2026 (critical security fixes + §17 Implementation Reference added)*
*Next review: After next strategy session or co-founder onboarding*

---

> **A note on completeness.** Several sections contain placeholders and open questions — these are intentional. A bible with honest gaps is more useful than one with fabricated certainty. Fill them in as decisions are made. The gaps are the to-do list.

---

## 15. Demo Script — Customer-Facing Product Demo

> **Version:** 1.0 — April 2026
> **Duration:** 15-20 minutes
> **Format:** Screen share, web UI first, CLI second
> **Audience:** DevOps lead, Security engineer, or CISO
> **Prerequisite:** Backend running on PostgreSQL, 2-3 demo secrets pre-created

### Demo Philosophy

Doppler leads with web UI and projects/environments hierarchy. We lead with **the problem** — then show the solution is simpler than anything they've seen. Never open with features. Open with their pain.

**The demo story in one sentence:** *"Your team created a secret on Monday. On Thursday, someone accessed it at 3am from an IP you've never seen. Show me the log."* — Keyorix can answer that question. Vault takes 45 minutes. Doppler can't be deployed on your network.

---

### Pre-Demo Setup Checklist

- [ ] Backend running: `KEYORIX_DB_PASSWORD=xxx go run server/main.go`
- [ ] Frontend running: `npm run dev` in keyorix-web
- [ ] Browser at `localhost:3000`, logged out
- [ ] 3 demo secrets pre-created: `prod-db-password`, `stripe-api-key`, `jwt-signing-key`
- [ ] Demo user created with limited permissions (to show RBAC)
- [ ] Browser zoom at 110% — easier to read on a shared screen
- [ ] Close Slack, notifications off

---

### Chapter 1 — The Login (30 seconds)

Navigate to `localhost:3000`. Show the login screen.

> *"This is Keyorix. It's running on your infrastructure — in this case my local machine, but in a real deployment this would be your private network. Nothing leaves your perimeter."*

Log in as admin. Dashboard loads.

> *"First thing you see is your secrets health at a glance. [Point to stats] Two secrets, one user, system healthy, response time under 1ms. This is all real data from your PostgreSQL database."*

**What this demonstrates:** On-premise deployment, clean UI, real data.

---

### Chapter 2 — Secrets Management (4 minutes)

Click **Manage Secrets**.

> *"This is your secrets inventory. Every API key, database password, certificate — all in one place, all encrypted at rest with AES-256-GCM. Your Vault cluster has this. The difference is your DevOps team can understand this screen without a Vault certification."*

Point to the Location column (default / default / production).

> *"Secrets are organised by namespace, zone, and environment. So production database credentials live in a different namespace from your staging keys. Access controls are enforced at every level."*

Click the **eye icon** on `prod-db-password`.

> *"I can reveal the value — [click Reveal] — it fetches the latest version, decrypts it in memory, and shows it here. The access is logged. If I were an auditor asking who accessed this secret and when, I can show them that in seconds."*

Close the modal.

> *"Notice the version history is automatically maintained. Every change to a secret creates a new version. You can roll back to any previous value — this is how you survive a misconfiguration in production without an outage."*

**What this demonstrates:** Core secrets CRUD, reveal workflow, versioning, audit trail.

---

### Chapter 3 — Access Control (3 minutes)

> *"Let me show you how access is controlled."*

*(Currently requires CLI — web admin page is on the roadmap)*

Switch to terminal.

```bash
# Show existing roles
keyorix rbac list-roles

# Show who has access to what
keyorix rbac check-permission --user developer1 --permission secrets:read
```

> *"RBAC is enforced at the API level — not just in the UI. If a service account doesn't have permission to read a secret, the API returns 403. Period. Your audit team will appreciate that this is not discretionary."*

**What this demonstrates:** RBAC is real, API-level enforcement.

---

### Chapter 4 — Audit Log (3 minutes)

> *"This is the part that compliance teams love."*

```bash
# Show audit log
curl -s http://localhost:8080/api/v1/audit \
  -H "Authorization: Bearer $TOKEN" | jq '.data.events[:5]'
```

> *"Every action — login, secret access, permission change — generates an audit event with timestamp, user, IP, and action. This is append-only. You can export this to your SIEM."*

> *"In a NIS2 audit, the first thing they'll ask is: can you show me all access to your production credentials in the last 90 days? This answers that question in one query."*

**What this demonstrates:** Compliance readiness, audit log depth.

---

### Chapter 5 — Deployment Story (2 minutes)

> *"Let me show you what it takes to run this."*

```bash
# Show the single binary
ls -la keyorix
# Show startup
KEYORIX_DB_PASSWORD=xxx ./keyorix server --config keyorix.yaml
```

> *"One binary. No JVM. No Python runtime. No NPM. You copy this file to your server, point it at your PostgreSQL instance, and you're running. Your DevOps team does not need to understand Raft consensus or Vault unsealing to operate this."*

> *"We've had customers migrate from a Vault cluster that needed a dedicated admin to Keyorix in a weekend. The config file is 40 lines of YAML."*

**What this demonstrates:** Operational simplicity — the core differentiator vs Vault.

---

### Chapter 5b — AI Integration (MCP)

> "Keyorix also exposes a Model Context Protocol interface — this means Claude and other AI assistants can manage secrets via natural language. The MCP server is running here."

Show terminal:
```bash
keyorix-mcp --help
cat ~/Library/Logs/Claude/mcp-server-keyorix.log | grep "started\|tools"
```

> "You can see the server connected successfully and registered 8 tools — list_secrets, get_secret, create_secret, delete_secret, list_environments, get_stats, list_audit_events, list_users. This is the AI integration layer for the ENISA innovation requirement."

> "We also run anomaly detection continuously on access logs — here are the current alerts."

```bash
keyorix anomalies list
```

> "Any suspicious access pattern — off-hours access, unknown IP, new user — gets flagged automatically. No ML required for v1. Statistical baseline."

**What this demonstrates:** Real AI integration (not aspirational), anomaly detection, ENISA narrative.

---

### Chapter 5c — Migration Demo (most compelling for enterprise)

> "Let me show you what a real migration looks like. You have a legacy app with secrets scattered across .env files and config files. Here's how long it takes to move to Keyorix."

```bash
keyorix scan /legacy-app
```
Show output: secrets found, risk levels

```bash
keyorix import --from-scan
```
Show dashboard populated with real data

```bash
keyorix run --env production -- node app.js
```
App starts, reads from Keyorix

```bash
rm .env
```
Delete the old file

```bash
curl localhost:3000/health
```
App still works — zero code changes

```bash
keyorix audit --env production
```
Show access log — every secret access recorded

```bash
keyorix anomalies list
```
Monitoring active from minute one

> "That's the complete migration. Four commands, zero code changes, full audit trail. How long would that have taken with Vault?"

**What this demonstrates:** Instant value, zero friction migration, immediate compliance posture.

---

### Chapter 6 — Close (2 minutes)

> *"What you've seen is: on-premise deployment, encrypted secrets with version history, RBAC, and an audit log that satisfies your compliance team. No SaaS dependency, no data leaving your network."*

> *"We're doing early-access design partner deployments right now. That means you get direct access to me, your feedback shapes the roadmap, and you're running on production infrastructure before we charge anything. In return, I'd ask for a reference if it works for you."*

> *"What would make this a no-brainer for your team?"*

---

### Demo Objection Handling

| Objection | Response |
|---|---|
| "We already have Vault" | "Who maintains it today? What happens when that person leaves?" |
| "We use Doppler" | "Can you deploy Doppler in an air-gapped environment? Into a network that can't reach the internet?" |
| "This looks early" | "The core is production-ready. What you saw is running on PostgreSQL with real encryption. We're being selective about design partners so we can give each one direct attention." |
| "We need SSO" | "OIDC/SAML is on our Q3 roadmap. For the design partner phase, service account tokens and API keys cover the integration use cases." |
| "Why not just use AWS/Azure Secrets Manager?" | "Cloud-native tools create vendor lock-in and can't run in your datacenter or air-gapped environments. They also create separate silos per cloud. Keyorix gives you one system for all environments — on-prem, cloud, air-gapped — fully under your control." |
| "How is this different from Infisical?" | "Infisical has an EU Cloud option — your data is still on their servers in Frankfurt. With Keyorix, your data never leaves your building. There's no Infisical.com in the loop at all. Also: Infisical self-hosted still requires internet for auth flows. Keyorix works fully air-gapped." |
| "What about HA?" | "Single-node PostgreSQL handles most mid-market loads. HA with PgBouncer/Patroni is on the M2 roadmap. What's your current availability requirement?" |
| "But you still need a credential on the server to authenticate to Keyorix — isn't that the same problem?" | "Yes — this is the Secret Zero problem and every secrets manager has it. The difference is scope: instead of dozens of scattered credentials, you protect one token. It's like an SSH key — one well-protected credential gives structured access to everything. We support short-lived tokens today and Kubernetes service account auth is on our roadmap — in K8s environments you need zero credentials on disk at all." |

---

## 16. Product Roadmap — Prioritised for Demo Readiness and First Customer

### Current Demo State (April 18, 2026)

| Feature | Status | Demo-able? |
|---|---|---|
| Login / auth | ✅ Working | ✅ Yes |
| Dashboard with real stats | ✅ Working | ✅ Yes |
| Secrets list with location names | ✅ Working | ✅ Yes |
| Secret reveal (view decrypted value) | ✅ Working | ✅ Yes |
| Copy value to clipboard | ✅ Working | ✅ Yes |
| Edit secret | ✅ Working | ✅ Yes |
| Delete secret (soft delete) | ✅ Working | ✅ Yes |
| Share secret modal | ⚠️ Opens but submit broken | ❌ Not yet |
| Create secret via web UI | ✅ Fixed April 2026 — initialFocus ref | ✅ Yes |
| Audit log page | ✅ Working | ✅ Yes |
| `keyorix run` | ✅ Working | ✅ Yes |
| `keyorix secret import` | ✅ vault/dotenv/json + dry-run | ✅ Yes |
| `keyorix secret export` | ✅ vault/dotenv/json + file output | ✅ Yes |
| `keyorix secret create/list/get/delete` | ✅ Working | ✅ Yes |
| Docker Compose | ✅ Working with auto-seeding | ✅ Yes |
| `keyorix --version` | ✅ Working | ✅ Yes |
| `keyorix secret scan` | ✅ Working | ✅ Yes |
| `keyorix secret explain` | ✅ Working | ✅ Yes |
| `keyorix secret fix` | ✅ Working (dry-run) | ✅ Yes |

**The complete orphaned Vault demo works end to end:**
```bash
docker compose up -d
sleep 15
keyorix config set-remote --url http://localhost:8080
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login   -H "Content-Type: application/json"   -d '{"username":"admin","password":"Admin123!"}' | jq -r '.data.token')
keyorix auth login --api-key $TOKEN
keyorix secret import --file vault-export.yaml --format vault --env production
keyorix run --env production -- node app.js
# Open http://localhost:8080/audit — shows every access logged
```

**Known issues / next session:**
- ~~Create secret modal closes on input click~~ — ✅ Fixed April 2026: `initialFocus` ref added to `Modal.tsx`
- ~~Share secret submit returns error~~ — ✅ Fixed April 2026: payload mapped to backend field names (`recipient_id`, `is_group`)
- ~~Duplicate secrets in list after sharing~~ — ✅ Fixed April 2026: deduplication by ID in `secret_listing.go`
- ~~CORS blocking login from frontend~~ — ✅ Fixed April 2026: `keyorix.docker.yaml` set to `environment: development`
- ~~Environment selector on secrets page~~ — ✅ Fixed April 2026
- `keyorix system init` needs rewrite (currently creates local config, not server-side bootstrap)
- Frontend rewrite needed (see technical debt backlog)

### Current Demo State (April 2026)

| Feature | Status | Demo-able? |
|---|---|---|
| Login / auth | ✅ Working | ✅ Yes |
| Dashboard with real stats | ✅ Working | ✅ Yes |
| Secrets list with location, type, sharing | ✅ Working | ✅ Yes |
| Secret reveal (view encrypted value) | ✅ Working | ✅ Yes |
| Secret versioning (via CLI/API) | ✅ Working | ✅ Via CLI |
| RBAC (via CLI/API) | ✅ Working | ✅ Via CLI |
| Audit log (via API) | ✅ Working | ✅ Via API |
| Single binary deployment | ✅ Working | ✅ Yes |
| PostgreSQL backend | ✅ Working | ✅ Yes |
| Anomaly alerts on dashboard | ✅ Working | ✅ Yes |
| keyorix secret scan | ✅ Shipped April 2026 | ✅ Yes |

### Gap Analysis vs Doppler Demo Flow

| Doppler Feature | Keyorix Status | Priority | Notes |
|---|---|---|---|
| Projects / namespace hierarchy | ✅ Exists (namespace/zone/env) | — | Already built |
| Secret types with validation | ⚠️ Types stored, no validation enforcement | P2 | Nice to have |
| Branch configs (per-dev overrides) | ❌ Not built | P3 | Post-M1 |
| Secret rotation (manual) | ⚠️ Versions exist, no rotation trigger | P2 | ADR needed |
| Secret rotation (automatic) | ❌ Not built | P3 | Enterprise tier |
| Change request policies / approvals | ❌ Not built | P3 | Enterprise tier |
| OIDC service account auth | ❌ Not built | P2 | Needed for CI/CD adoption |
| SDK (Go) | ✅ v0.1.0 published | — | github.com/keyorixhq/keyorix-go — April 2026 |
| SDK (Python) | ❌ Not built | P1 | Next sprint — 1 day effort |
| SDK (Node.js) | ❌ Not built | P1 | Next sprint — 1 day effort |
| SDK (Java) | ✅ v0.1.0 published | — | github.com/keyorixhq/keyorix-java — April 2026 |
| SDK (Rust) | ❌ Deprioritised | P3 | Too niche for current ICP |
| SDK (.NET/C#) | ❌ Deprioritised | P3 | Revisit when Windows enterprise prospect appears |
| Example apps | ❌ Not built | **P1** | Critical for adoption |
| MCP Server | ❌ Not built | P3 | Doppler differentiator |
| Web admin — user management | ❌ Mock only | P2 | Required for customer handoff |
| Web admin — audit log viewer | ✅ Working | — | Fixed, wired to real API |
| Web — secret create/edit modal | ✅ Working | — | Fixed April 2026 — initialFocus ref |
| Web — secret delete confirm | ❌ Not wired | P2 | |
| Web — sharing management UI | ✅ Working | — | Wired April 2026 |
| Password expiry alerts | ✅ Working | — | Fixed April 2026 — real data from backend |
| Real trend percentages on dashboard | ✅ Working | — | Fixed April 2026 — StatsSnapshot model, daily snapshots |
| Environment selector on secrets page | ✅ Working | — | Fixed April 2026 — dropdown in primary filter row |
| SSO (LDAP/SAML/OIDC) | ❌ Not built | P2 | Enterprise tier |
| Kubernetes operator | ❌ Not built | P2 | M2 target |
| Audit log export (SIEM) | ❌ Not built | P2 | Enterprise tier |
| HA / clustering | ❌ Not built | P3 | M2 target |

### Immediate Priorities (before first customer demo)

**P1 — Must have for a credible demo:**

1. ~~**Web — Create secret modal**~~ — ✅ Fixed April 2026.
2. ~~**Web — Audit log page**~~ — ✅ Working (wired to real API).
3. ~~**Environment selector on secrets page**~~ — ✅ Fixed April 2026.
4. ~~**Dashboard trend percentages**~~ — ✅ Fixed April 2026.
5. ~~**Password expiry alerts**~~ — ✅ Fixed April 2026.
6. ~~**Go SDK v0.1**~~ — ✅ Published April 2026. github.com/keyorixhq/keyorix-go
7. ~~**Example app (one language)**~~ — ✅ Pet store shipped April 2026. github.com/keyorixhq/keyorix-go/examples/petstore

**P2 — Required before first paying customer:**

5. **Web — User management page** — Wire existing admin UI to real API
6. **Secret reveal shows name** — Modal currently missing the secret name in header (minor display bug)
7. **OIDC service account** — CI/CD integration story needs this
8. **Secret rotation trigger** — Manual rotation via UI button

**P3 — Post-M1:**

9. Branch configs
10. Change request approvals
11. Automatic rotation
12. MCP Server
13. Kubernetes operator


---

## 17. Implementation Reference

> **How to use this section.** This is the working reference for anyone sitting down to write code. It captures codebase state as of April 19, 2026. Read it before opening any file. Update it after each session that changes invariants, adds tests, or wires new endpoints.

---

### Session Context — last updated April 19, 2026 (Part 2)

**What was done this session:**
- All 4 critical security items completed (ADR-004, timing attack, encryption warning, SSL cert)
- Create Secret modal focus trap fixed (initialFocus ref in Modal.tsx)
- Share Secret payload mismatch fixed (recipient_id, is_group)
- Duplicate secrets after sharing fixed (deduplication in secret_listing.go)
- CORS fixed (keyorix.docker.yaml set to development)
- Full rebrand completed (Secretly → Keyorix, proto renamed)
- GitHub repo description + topics updated
- Environment selector added to secrets page (dynamic from API, passes environment_id)
- Location column renamed to Environment, shows pill badge only (namespace/zone hidden per ADR-001)
- Dashboard trend percentages — real data via StatsSnapshot model
- Password expiry alerts — real data from getExpiringSecrets() backend query

**Current build state:**
- `go build ./...` — ✅ Clean
- `go test ./internal/encryption/...` — ✅ All pass
- `go test ./internal/storage/local/...` — ✅ All pass
- `go test ./server/http/...` — ✅ All pass
- `go test ./server/middleware/...` — ❌ Pre-existing build failure (validateToken signature mismatch in test)
- `go test ./internal/cli/...` — ❌ Pre-existing runtime failure (TestRemoteCLIIntegration needs running server)
- `go test ./internal/core/...` — ❌ Pre-existing mock mismatch (TestListSecretsWithSharingInfo)
- `go test ./internal/storage/remote/...` — ❌ Pre-existing timeout

**Next session should start with:**
1. Build `keyorix explain` + `keyorix fix` (--dry-run default, --interactive mode)
2. Add `--staged`, `--commit`, `--severity` to existing scan command
3. Dashboard review — screenshot + discuss frontend rewrite scope
4. LOI follow-up — 5th prospect still pending
5. Olga onboarding — practice discovery calls before May 1

**New backend structures added this session:**
- `models.StatsSnapshot` — daily stats snapshot for trend calculation
- `models.ExpiringSecret` (core type) — secrets expiring within 30 days
- `core.StatTrend` — trend value + direction for dashboard cards
- `Storage.SaveStatsSnapshot` + `GetPreviousStatsSnapshot` — interface + local impl
- `core.getExpiringSecrets()` — queries owned secrets with Expiration < 30 days
- `core.computeTrend()` — % change helper, rounds to 1 decimal
- `stats_snapshots` table — created via raw SQL in factory.go (PostgreSQL safe)

---

### How to Run Locally

#### Backend — Docker Compose (recommended for full stack)

```bash
# First boot — builds image, starts postgres, seeds admin user
docker-compose up -d

# Check seed output
docker-compose logs keyorix

# Tear down and reset database
docker-compose down -v

# Force rebuild after code changes
docker-compose build --no-cache && docker-compose up -d
```

Config file used by Docker: `keyorix.docker.yaml` (mounted as `/app/keyorix.yaml`).
Default admin credentials after seed: `admin` / `Admin123!`

#### Backend — Local (embedded SQLite, no Docker)

```bash
# Install server binary
make build-server
./bin/keyorix-server
# Uses keyorix.yaml in working directory
# Storage type must be "postgres" or "sqlite" (default: postgres, change to sqlite for local)
```

For SQLite dev mode, edit `keyorix.yaml`:
```yaml
storage:
  type: sqlite
  database:
    path: ./keyorix.db
```

#### Frontend

```bash
# Assumes keyorix-web repo is adjacent to keyorix
cd ../keyorix-web
npm install
npm run dev
# Vite dev server: http://localhost:5173
# Proxies API calls to http://localhost:8080
```

#### CLI — connect to running server

```bash
# Build and install CLI
make install-cli   # requires sudo; or use ./bin/keyorix for local testing

# Option 1: env vars (best for CI/CD and testing)
export KEYORIX_SERVER=http://localhost:8080
export KEYORIX_TOKEN=<bearer-token-from-login>

# Option 2: persistent config file (~/.keyorix/cli.yaml)
keyorix connect --url http://localhost:8080 --api-key <token>

# Verify connection
keyorix secret list
keyorix status
```

#### Key Config Files

| File | Purpose | When to edit |
|---|---|---|
| `keyorix.yaml` | Local dev config (storage, server ports, encryption) | Changing storage backend, ports, or enabling encryption |
| `keyorix.docker.yaml` | Production Docker config | Changing Docker deployment settings |
| `server/Dockerfile` | Server container build | Changing Go version, runtime deps, build flags |
| `docker-compose.yml` | Full-stack local Docker | Changing postgres version, ports, env vars |
| `server/entrypoint.sh` | Container startup + seed | Changing seed credentials or startup sequence |
| `internal/config/config.go` | Config struct definition | Adding new config fields |
| `~/.keyorix/cli.yaml` | CLI connection config | Written by `keyorix connect`; edit to switch servers |

---

### Environment Variables

| Variable | Used by | Required | Description |
|---|---|---|---|
| `KEYORIX_MASTER_PASSWORD` | Server, CLI encryption commands | Yes (if encryption enabled) | Passphrase for KEK derivation via PBKDF2. Never stored. Empty value blocked at startup. |
| `KEYORIX_TOKEN` | CLI | No (falls back to `~/.keyorix/cli.yaml`) | Bearer token for API authentication. Overrides stored config. |
| `KEYORIX_SERVER` | CLI | No (falls back to `~/.keyorix/cli.yaml`) | Server base URL, e.g. `http://localhost:8080`. Overrides stored config. |
| `KEYORIX_DB_PASSWORD` | Server | No (falls back to `keyorix.yaml` `storage.database.password`) | PostgreSQL password. Prefer env var over config file. |
| `KEYORIX_REMOTE_API_KEY` | CLI (remote storage mode) | No | API key for remote storage client. |

Config resolution priority for `KEYORIX_TOKEN` and `KEYORIX_SERVER`: **env var → `~/.keyorix/cli.yaml` → `keyorix.yaml`**. Implemented in `internal/cli/common/remote_client.go` `ResolveRemote()`.

---

### Encryption Package — Key Files

All files live in `internal/encryption/`. Touch only the file that owns the layer you are changing.

| File | Owns | When to touch it |
|---|---|---|
| `encryption.go` | `EncryptionService` — raw AES-256-GCM encrypt/decrypt, `GenerateKEK()`, `GenerateRandomKey()`, chunked encryption | Changing cipher, nonce size, chunk strategy, or adding AAD binding (M2 backlog) |
| `keymanager.go` | `KeyManager` — ADR-004 envelope model: salt generation, PBKDF2 KEK derivation, DEK wrapping/unwrapping, KEK wipe after use | Changing KEK derivation parameters (iterations, salt size), adding TPM/KMS providers (v2), or rotating DEK |
| `service.go` | `Service` — high-level facade: `Initialize(passphrase)`, `EncryptSecret()`, `DecryptSecret()`, `RotateDEK()`. Startup warning when encryption disabled. | Adding new high-level encryption operations or changing startup behaviour |
| `auth_encryption.go` | `AuthEncryption` — session tokens, API tokens, client secrets, password reset tokens. Constant-time comparison fixed April 2026. | Touching auth token storage or adding new auth credential types |
| `integration.go` | `SecretEncryption` — bridges encryption layer to GORM: `StoreSecret()`, `RetrieveSecret()`, chunked large secret storage | Changing how secrets are written to / read from the database |

**Invariant:** `KeyManager` is the only place where KEK material exists in memory. It is created in `Initialize()` and wiped immediately after `unwrapDEK()`. Nothing else holds a reference to the KEK.

---

### API Endpoint Map

Base URL: `http://localhost:8080`. All `/api/v1/*` routes require `Authorization: Bearer <token>`.

#### Unauthenticated

| Method | Path | Status | Notes |
|---|---|---|---|
| `POST` | `/auth/login` | ✅ Working | Returns session token |
| `POST` | `/auth/logout` | ✅ Working | Invalidates token |
| `POST` | `/auth/refresh` | ✅ Working | |
| `POST` | `/auth/password-reset` | ✅ Working | Best-effort; no email sent yet |
| `POST` | `/system/init` | ✅ Working | Legacy; creates first user only, no RBAC seed |
| `POST` | `/api/v1/system/seed` | ✅ Working | **Preferred.** Creates admin user + roles + permissions + catalog. 409 if already seeded. |
| `GET` | `/health` | ✅ Working | Returns 200 + JSON |
| `GET` | `/status` | ✅ Working | HTML dashboard or JSON fallback |
| `GET` | `/openapi.yaml` | ✅ Working | OpenAPI spec |

#### Authenticated (`/api/v1`)

| Method | Path | Status | Notes |
|---|---|---|---|
| `GET` | `/auth/profile` | ✅ Working | |
| `GET` | `/dashboard/stats` | ✅ Working | Real data |
| `GET` | `/dashboard/activity` | ✅ Working | Real data |
| `GET` | `/namespaces` | ✅ Working | Requires `secrets.read` |
| `GET` | `/zones` | ✅ Working | Requires `secrets.read` |
| `GET` | `/environments` | ✅ Working | Requires `secrets.read` |
| `GET` | `/secrets` | ✅ Working | Requires `secrets.read` |
| `POST` | `/secrets` | ✅ Working | Requires `secrets.write` |
| `GET` | `/secrets/{id}` | ✅ Working | Requires `secrets.read` |
| `PUT` | `/secrets/{id}` | ✅ Working | Requires `secrets.write` |
| `DELETE` | `/secrets/{id}` | ✅ Working | Requires `secrets.delete` |
| `GET` | `/secrets/{id}/versions` | ✅ Working | Requires `secrets.read` |
| `GET` | `/secrets/{id}/shares` | ✅ Working | Requires `secrets.read` |
| `POST` | `/secrets/{id}/share` | ⚠️ Broken (frontend) | API works; web submit broken |
| `GET` | `/shares` | ✅ Working | Requires `secrets.read` |
| `PUT` | `/shares/{id}` | ✅ Working | Requires `secrets.write` |
| `DELETE` | `/shares/{id}` | ✅ Working | Requires `secrets.write` |
| `GET` | `/shared-secrets` | ✅ Working | Requires `secrets.read` |
| `GET` | `/users` | ✅ Working | Requires `users.read` |
| `POST` | `/users` | ✅ Working | Requires `users.read` |
| `GET` | `/users/search` | ✅ Working | Requires `users.read` |
| `GET` | `/users/{id}` | ✅ Working | Requires `users.read` |
| `PUT` | `/users/{id}` | ✅ Working | Requires `users.read` |
| `DELETE` | `/users/{id}` | ✅ Working | Requires `users.read` |
| `GET` | `/groups` | ✅ Working | Requires `users.read` |
| `POST` | `/groups` | ✅ Working | Requires `users.read` |
| `GET` | `/roles` | ✅ Working | Requires `roles.read` |
| `POST` | `/roles` | ✅ Working | Requires `roles.read` |
| `POST` | `/user-roles` | ✅ Working | Requires `roles.assign` |
| `DELETE` | `/user-roles` | ✅ Working | Requires `roles.assign` |
| `GET` | `/user-roles/user/{userId}` | ✅ Working | Requires `roles.assign` |
| `GET` | `/audit/logs` | ✅ Working | Requires `audit.read` |
| `GET` | `/audit/rbac-logs` | ✅ Working | Requires `audit.read` |
| `GET` | `/system/info` | ✅ Working | Requires `system.read` |
| `GET` | `/system/metrics` | ✅ Working | Requires `system.read` |

---

### Test Map

Run all tests: `go test ./...` from repo root.

#### Packages and current state

| Package | Tests | State | Notes |
|---|---|---|---|
| `internal/encryption` | 20+ | ✅ All pass | Core crypto, auth tokens, shared secrets, key rotation |
| `internal/core` | 30+ | ✅ All pass (excl. pre-existing) | Secret CRUD, sharing, RBAC, dashboard |
| `internal/storage/local` | 10+ | ✅ All pass | GORM operations, share storage |
| `internal/storage/remote` | 8 | ⚠️ 1 pre-existing failure | `TestRemoteStorage_Health` — see below |
| `internal/cli` | 5 | ⚠️ 1 pre-existing failure | `TestRemoteCLIIntegration` — requires live server |
| `server/middleware` | 10+ | ⚠️ Pre-existing build issue | See below |
| `internal/core` (sharing indicators) | 4 | ⚠️ 1 pre-existing failure | `TestListSecretsWithSharingInfo` |

Run only encryption tests: `go test ./internal/encryption/...`
Run only core tests: `go test ./internal/core/...`

#### Pre-existing failures (do not fix without investigation)

These failures existed before this session. Do not confuse them with regressions.

| Failure | Package | Root cause | Safe to ignore? |
|---|---|---|---|
| `server/middleware` build | `server/middleware` | Mock in test file does not implement full `storage.Storage` interface — fails to compile when new methods are added to the interface | Fix by updating the middleware test mock when you next touch the interface |
| `TestRemoteCLIIntegration` | `internal/cli` | Requires a live Keyorix server running at `localhost:8080`; passes only in full integration environment | Yes — skip in unit test runs with `-short` flag |
| `TestListSecretsWithSharingInfo` | `internal/core` | `MockStorage` in `sharing_indicators_test.go` uses build tag isolation; type assertion fails due to interface version mismatch at compile time | Yes — pre-dates current session; tracked for next RBAC refactor |
| `TestRemoteStorage_Health` | `internal/storage/remote` | Health check method calls `/health` on a non-existent test server; mock HTTP server not set up for this test case | Yes — needs a mock HTTP server fixture |

---

### Frontend Known Bugs

These are web UI (`keyorix-web` repo) bugs that affect the demo. Backend APIs are working correctly in all three cases.

| Bug | Symptom | Root cause | Priority |
|---|---|---|---|
| **Create Secret modal input focus** | Modal closes when user clicks into any input field | Headless UI focus trap conflict — the modal's `initialFocus` ref fires a blur event that triggers the dismiss handler | ✅ Fixed April 2026 |
| **Share secret submit** | Submit button returns API error | Endpoint mismatch — frontend sends to wrong path or missing required fields in body | ✅ Fixed April 2026 |
| **Environment selector** | Environment dropdown on Secrets page does nothing | Filter not wired to API query params — `environment_id` not passed in list request | ✅ Fixed April 2026 |
| **Dashboard trends hardcoded** | Trend percentages always show 0% | StatsSnapshot model not wired | ✅ Fixed April 2026 |
| **Password expiry alerts hardcoded** | Expiry panel shows placeholder data | getExpiringSecrets() not implemented | ✅ Fixed April 2026 |

---

### Key Architectural Constraints

These are invariants. Violating them breaks either security, the storage abstraction, or the deployment model. Read before adding a feature.

1. **All storage access goes through the `Storage` interface** (`internal/core/storage/interface.go`). Never call GORM directly from a handler or core service method. Add a method to the interface first.

2. **KEK never leaves `KeyManager`**. No other struct holds a reference to the KEK. It is derived in `Initialize()`, used to unwrap the DEK, then wiped. If you need to re-derive the KEK (e.g. for `RotateDEK`), the passphrase must be re-supplied.

3. **CLI is API-only**. The `keyorix` binary contains no database drivers, no encryption logic, no migration code. It talks to the server over HTTP. Never add a GORM import to a CLI-only package.

4. **Authentication middleware reads `userContextKey` from context**. All permission checks go through `RequirePermission(permission)` middleware → `GetUserFromContext()`. Never re-implement permission checks inline in a handler.

5. **`POST /api/v1/system/seed` is the canonical first-boot path**. `/system/init` exists for legacy compatibility. The seed endpoint creates RBAC (roles, permissions, role-permission assignments) that `init` does not. New Docker deployments must use `seed`.

6. **Session tokens are stored as plaintext `session_token` in the `sessions` table** (the `EncryptedSessionToken` column exists but is not yet used by the active login path). `GetSession()` queries `WHERE session_token = ?`. Do not switch to the encrypted column without updating both `Login()` and `GetSession()` together.

7. **AutoMigrate runs only on first boot** (`factory.go` checks `db.Migrator().HasTable("namespaces")` before running). If you add a new model, either add it to the AutoMigrate list (picked up on fresh deploys) or write a numbered SQL migration in `migrations/` for existing deployments.

---

### Naming Conventions

| Concept | What it maps to in code | Notes |
|---|---|---|
| **Project** (user-facing) | `Namespace` (DB / API) | "Project" is the marketing name; code uses Namespace everywhere |
| **Environment** | `Environment` | Same in code and UI |
| **Zone** | `Zone` | Rarely exposed in UI; defaults to "default" |
| **Secret** | `SecretNode` (GORM model) + `SecretVersion` for values | SecretNode = metadata; SecretVersion = encrypted value |
| **Role** | `Role` + `UserRole` (join) + `Permission` + `RolePermission` (join) | Four tables. Role → permission mapping via `role_permissions`. User → role via `user_roles`. |
| **Token** | `Session.SessionToken` (plain hex string, 64 chars) | Stored in `sessions.session_token`. Bearer token in Authorization header. |
| **Admin** | Role named exactly `"admin"` | The middleware's `validateToken()` checks `r == "admin"` to assign full permissions. Spelling matters. |

---

### How to Add a New Feature

Follow this checklist in order. Skipping steps causes interface compile errors or missing permission gates.

- [ ] **Define the storage operation** — add method signature to `internal/core/storage/interface.go`
- [ ] **Implement in LocalStorage** — add method to `internal/storage/local/local.go` using GORM
- [ ] **Add stub to RemoteStorage** — add method to `internal/storage/remote/remote.go` returning `fmt.Errorf("not supported in remote storage")` (or implement if remote support needed)
- [ ] **Add stub to mock** — add method to `internal/core/mock_storage_test.go` and `sharing_standalone_test.go`
- [ ] **Add to AutoMigrate if new model** — `internal/storage/factory.go`
- [ ] **Add core service method** — `internal/core/service.go` (business logic, validation, audit logging)
- [ ] **Add handler** — `server/http/handlers/` (one file per resource; use `sendSuccess` / `sendError` helpers)
- [ ] **Register route** — `server/http/router.go`; wrap with `r.With(customMiddleware.RequirePermission("resource.action"))`
- [ ] **Add CLI command** — `internal/cli/<resource>/` (new file per verb); register in the resource's root command
- [ ] **Write test** — at minimum one happy-path test in `internal/core/` and one in `internal/storage/local/`
- [ ] **Run `go build ./...`** — must be clean before committing

---

### Files Most Commonly Edited

| File | Why it gets edited |
|---|---|
| `internal/core/storage/interface.go` | Every new storage operation starts here |
| `internal/storage/local/local.go` | GORM implementation of every new storage method |
| `internal/storage/remote/remote.go` | Stub every new interface method |
| `internal/core/mock_storage_test.go` | Stub every new interface method for tests |
| `internal/core/service.go` | Business logic for every feature; also `SeedSystem`, `Login`, `ValidateSessionToken` |
| `server/http/router.go` | Register every new HTTP route |
| `server/http/handlers/` | One handler file per resource |
| `internal/cli/<resource>/` | One CLI file per verb (create, list, delete, import, export) |
| `internal/storage/factory.go` | AutoMigrate list; storage type routing |
| `internal/encryption/keymanager.go` | KEK/DEK lifecycle — touch only for key management changes |
| `internal/encryption/service.go` | High-level encryption facade — touch for new crypto operations |
| `server/entrypoint.sh` | Seed credentials, startup sequence |
| `keyorix.yaml` / `keyorix.docker.yaml` | Config for local / Docker deployments |
