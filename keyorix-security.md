# Keyorix Security — L2 Reference
### Load for: encryption work, security reviews, ENISA deliverables, key provider implementation
### Covers: encryption model, known issues, key provider vision, AI roadmap (anomaly detection)

---

## Encryption Model (verified April 2026 audit)

**What works correctly:**

| Property | Implementation | Status |
|---|---|---|
| Cipher | AES-256-GCM | ✅ Authenticated encryption |
| Randomness | `crypto/rand` (Go stdlib) | ✅ Uses `/dev/urandom` on Linux |
| Nonce | Fresh random nonce per operation | ✅ No nonce reuse |
| Thread safety | `sync.RWMutex` throughout, keys copied on return | ✅ |
| Memory wiping | `Wipe()` overwrites key bytes with random data on shutdown | ✅ |
| File permissions | Key files at `0600`, validated + auto-fixable | ✅ |
| Key rotation | `RotateKEK()`, `RotateDEK()`, `RotateAuthEncryption()` exist | ✅ |
| Auth token encryption | Session tokens, API tokens, client secrets all encrypted at rest | ✅ |
| Chunked encryption | Large secrets split into chunks, each encrypted independently | ✅ |

---

## Known Issues — Ranked by Severity

### ✅ Fixed: Envelope encryption — DEK wrapped by KEK (ADR-004, April 2026)

Passphrase → PBKDF2-SHA256 (600k iterations + 32-byte random salt) → KEK (memory only) → unwraps wrapped DEK → DEK used for all encryption. KEK never written to disk.

- `KEYORIX_MASTER_PASSWORD` env var required at startup. Empty passphrase blocked.
- On-disk files: `keys/kek.salt` (random salt) + `keys/dek.key` (wrapped DEK). No raw KEK ever on disk.
- Files changed: `internal/encryption/keymanager.go`, `service.go`, `auth_encryption.go`, `integration.go`
- v2 path: `KeyProvider` interface (see below) abstracts KEK source — passphrase becomes one provider.

### ✅ Fixed: Token comparison — constant-time (April 2026)

`subtle.ConstantTimeCompare([]byte(storedToken), []byte(plainToken)) == 1` in `auth_encryption.go`. `crypto/subtle` imported.

### ✅ Fixed: Encryption-disabled silent mode (April 2026)

Loud banner printed to stderr in `NewService()` when `cfg.Enabled == false`.

---

### 🟡 High: KEK rotation does not re-encrypt existing secrets

`RotateKEK()` generates new KEK, backs up old one to `kek.backup.{timestamp}`. Secrets encrypted with old KEK are NOT re-encrypted. Old backup files accumulate indefinitely. This is key proliferation, not key rotation.

Fix: re-encryption sweep of all secrets, atomically. Write ADR before implementing. M2 item.

---

### 🟡 High: No Additional Authenticated Data (AAD)

```go
gcm.Seal(nil, nonce, plaintext, nil)  // no AAD
```

Without AAD, ciphertext could theoretically be transplanted between secrets (same key, different secret ID).

Fix: pass `secretID + namespaceID + versionNumber` as AAD. Medium effort, significant improvement.

---

## What to Say to a Security-Conscious Prospect

> *"Keyorix uses AES-256-GCM for all secrets at rest with proper envelope encryption. The data encryption key is wrapped by a master key derived from an operator passphrase — no plaintext key ever touches disk. Key material is wiped from memory on shutdown. Key material lives on your infrastructure, under your control. We have a documented roadmap to add KMS passthrough and HSM support."*

**Do NOT claim:** FIPS 140-2 compliance. Envelope encryption IS implemented (ADR-004, April 2026) — you may claim it.

---

## Key Provider Architecture (build in 2026)

**Core insight:** Security is defined by KEK lifecycle management, not encryption itself.

**Interface to build now:**
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

**Critical rule:** Never expose the KEK directly. Only expose wrap/unwrap operations.

**Three operational modes:**

| Mode | Storage | KEK Location |
|---|---|---|
| Dev | SQLite | File (acceptable for dev only) |
| Edge | SQLite | OS Keychain or TPM |
| Production | PostgreSQL | OS Keychain, KMS, or wrapped |

**Tier 1 — Build in 2026:**
- [ ] Define `KeyProvider` interface in `internal/crypto/`
- [ ] File provider (current behavior, explicit + documented as dev-only)
- [ ] Environment variable provider (containers/CI)
- [ ] Wrapped KEK provider (operator passphrase at startup — production on-prem v1)
- [ ] Provider resolver (dynamic selection based on config)
- [ ] Key migration tooling (unwrap with old provider, re-wrap with new)

**Tier 2 — 2027 (requires co-founder):**
- [ ] OS Keychain provider (macOS Keychain, Linux libsecret, Windows DPAPI)
- [ ] AWS KMS, GCP KMS, Azure Key Vault providers
- [ ] Kubernetes ServiceAccount provider (OIDC)
- [ ] TPM provider (air-gapped bare metal)

**Secret Zero per provider:**
- OS Keychain: no Secret Zero — OS handles auth via logged-in user session
- AWS/GCP/Azure KMS: ambient platform identity (EC2 IAM role, GKE ServiceAccount, Azure Managed Identity)
- Air-gapped: operator passphrase at boot (v1), TPM (v2), or Shamir's Secret Sharing (enterprise compliance)

**Anti-patterns:**
- ❌ Exposing KEK directly anywhere in codebase
- ❌ Storing KEK in env vars in production
- ❌ Hardcoding provider logic instead of using the interface
- ❌ Treating all providers as equal security (file ≠ TPM)

---

## AI Roadmap (ENISA deliverables)

### Primary: Access anomaly detection on `SecretAccessLog`

Every secret access already recorded. AI/ML establishes normal access baselines per secret/service/user and alerts on deviation.

**Example detectable anomalies:**
- DB credential accessed at 3am from unrecognised IP
- API key accessed 10x normal frequency
- Secret accessed by user who's never accessed it before, outside business hours
- Sudden access from new geographic region

**Why this is real:**
- No human reviews access logs at scale — genuinely automated detection
- Data infrastructure already exists (`SecretAccessLog` model, `AuditEvent`)
- Maps to NIS2 Article 21 incident detection + DORA operational monitoring
- Air-gap compatible — runs entirely on-premise
- Lightweight models work (Isolation Forest, statistical baseline) — no frontier LLM needed

**Roadmap:**
- ✅ Statistical baseline shipped April 2026 — 3 rules: `off_hours`, `new_ip`, `new_user`. CLI: `keyorix anomalies list`
- ML-based detection (Isolation Forest): mid-2027

### Secondary: Automated rotation planning

"This certificate expires in 14 days and is used in 3 services — here is the proposed rotation sequence, confirm to execute."

Requires: secret usage tracking infrastructure (doesn't exist yet). M3 item.

### AI architecture principles (decided)

1. **Secret values NEVER touch any AI model.** AI layer operates on metadata only: names, timestamps, user identities, access counts, IP ranges. Hard constraint.
2. **Local-first for air-gapped.** Any AI feature must work without external API calls.
3. **No AI feature ships without a non-AI fallback.** Product remains fully functional without AI.

### MCP Server (secondary ENISA deliverable)

Allow Claude and MCP-compatible assistants to manage secrets via natural language. ~1 week to build.

**v1 tools to expose:**
`create_secret`, `get_secret`, `list_secrets`, `delete_secret`, `list_audit_events`, `list_users`, `create_user`, `get_stats`, `list_environments`

**ENISA angle:** If a reviewer asks "where's the AI?" — demonstrate Claude creating secrets, querying audit logs, detecting anomalies via MCP. Stronger and more honest than NLP query parsing.

---

## Security Checklist (before enterprise POC)

- [x] `security/ssl/key.pem` — not tracked by git (verified May 2026 via `git ls-files security/ssl/`)
- [x] Constant-time token comparison — fixed April 2026 (`crypto/subtle`)
- [x] DEK wrapped by KEK — fixed April 2026 (ADR-004, PBKDF2 passphrase-derived KEK)
- [x] Encryption-disabled startup warning — fixed April 2026 (loud banner in `NewService()`)
- [ ] AAD binding in GCM 🟡
- [ ] KEK rotation re-encryption sweep (ADR first) 🟡
- [x] `gosec` baseline run — `security/scans/gosec-2026-04.txt` exists. Triage findings.
- [x] `govulncheck` baseline run — `security/scans/govulncheck-2026-04.txt` exists. Triage findings.
- [ ] Triage `gosec` + `govulncheck` findings — review reports, document accepted risks
- [ ] Test coverage report (`go test -coverprofile`)
- [ ] Threat model document
- [ ] CSP `unsafe-eval` inconsistency resolved
- [ ] `security/compliance/` — create data flow diagram, NIS2/DORA controls statement, security FAQ
- [ ] Rebrand: files may still reference "Secretly" — verify before public launch

**Note on `security/` directory (verified May 2026):**
- `security/scans/` — ✅ has `gosec-2026-04.txt`, `govulncheck-2026-04.txt`, plus `gosec-report.json`, `osv-report.json`, `semgrep-report.json`, `trivy-config.json`, `trivy-fs.json`, `trufflehog.json`, `gitleaks-report.sarif` at root
- `security/compliance/` — ❌ still empty
- `security/policies/` — present (nginx headers, CSP)
- `security/ssl/` — present (check if private key still committed)
