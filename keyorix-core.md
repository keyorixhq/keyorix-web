# Keyorix Core — L1 Reference
### Load this every session. ~50 lines. Points to L2 files for detail.

---

## Identity

| Field | Detail |
|---|---|
| **Product** | Keyorix — lightweight on-premise secrets manager |
| **One-liner** | Vault alternative for teams that can't use SaaS and won't maintain Vault |
| **Stage** | Working prototype, pre-revenue, 5 verbal LOIs |
| **Legal** | Keyorix SL — name approved, incorporation in progress (Valencia, Spain) |
| **Founder** | Solo — ex-Microsoft Security PM. Seeking technical co-founder (OpenBao/HashiCorp alumni target) |
| **Revenue** | €0 ARR. Bill-paying via Vault health assessment consulting |

## Repos

All repos are separate — cloned under `~/dev/keyorix/`. Each is an independent git repo at `github.com/keyorixhq/`.

| Repo | Local path | Purpose | Status |
|---|---|---|---|
| `keyorix` | `~/dev/keyorix/keyorix/` | Go backend — API, CLI, encryption, storage | Working |
| `keyorix-web` | `~/dev/keyorix/keyorix-web/` | React dashboard (TypeScript) | Partial (core flows work, admin = mock) |
| `keyorix-mcp` | `~/dev/keyorix/keyorix-mcp/` | MCP server (JavaScript) | Shipped |
| `keyorix-go` | `~/dev/keyorix/keyorix-go/` | Go SDK | Shipped with petstore examples |
| `keyorix-python` | `~/dev/keyorix/keyorix-python/` | Python SDK | Shipped with petstore examples |
| `keyorix-node` | `~/dev/keyorix/keyorix-node/` | Node.js SDK | Shipped with petstore examples |
| `keyorix-java` | `~/dev/keyorix/keyorix-java/` | Java SDK | Shipped |
| `keyorix-landing` | `~/dev/keyorix/keyorix-landing/` | Static marketing site (HTML) | Live on Netlify, bilingual EN/ES |

Bible + L2 files live at `~/dev/keyorix/` (parent directory, not inside any repo).

Separate product: `~/dev/dashdiag/`

## Dev Commands

```bash
# Backend
cd ~/dev/keyorix/keyorix
KEYORIX_DB_PASSWORD=xxx go run server/main.go

# Frontend
cd ~/dev/keyorix/keyorix-web
npm run dev  # port 3000

# Build both binaries
make build          # keyorix (CLI) + keyorix-server
make build-cli      # CLI only
make build-server   # server only

# Test
go test ./...
go test -race ./...
```

## Current Milestone: M1 — First Paying Customer (target: August 2026)

| Item | Status |
|---|---|
| PostgreSQL integration | ✅ Done |
| 5 verbal LOIs | ✅ Done (2 declined, 2 budget Q1'27, 1 pending) |
| Vault health assessment outreach (5 messages) | 🔴 CRITICAL — do this week |
| Consulting flywheel | Stalled — restart pipeline now |
| SL incorporation | In progress via gestoria |
| First signed contract | Pending |
| Frontend + backend working together | ✅ Confirmed May 2026 |
| Frontend build clean | ✅ Confirmed May 2026 (vite build, 647 modules) |
| L2 context system | ✅ Built May 2026 — 8 files in `/Users/andreibeshkov/dev/keyorix/` |

## Pre-existing Test Failures (not regressions — ignore)

- `server/middleware` build failure (`validateToken` signature mismatch)
- `TestRemoteCLIIntegration` (needs running server)
- `TestListSecretsWithSharingInfo` (mock mismatch)
- `TestRemoteStorage_Health` (timeout)

## L2 File Index — Load by Session Type

**Always load `keyorix-backlog.md` every session** — it has all open items.

| Session type | Load these files |
|---|---|
| **Coding / backend** | `keyorix-product.md` + `keyorix-security.md` |
| **Coding / frontend** | `keyorix-product.md` |
| **Sales / outreach** | `keyorix-gtm.md` |
| **Strategy / competitive** | `keyorix-strategy.md` |
| **Encryption / security** | `keyorix-security.md` |
| **Co-founder search** | `keyorix-strategy.md` |
| **ENISA / legal** | `keyorix-strategy.md` + `keyorix-security.md` |

## Session Workflow

1. Verify changes: `go build ./...` + relevant tests
2. `git stash` to isolate pre-existing failures from regressions
3. Commit and push after each logical group of changes
4. End-of-session Bible updates → batch as diff → hand to Claude Code

## Key Decisions (never relitigate without documented reason)

- **On-premise first** — SaaS is sequenced post 3 paying customers
- **Binary split** — `keyorix` (CLI) and `keyorix-server` (separate binaries)
- **AGPL dual licence** — community AGPL, commercial for enterprise features
- **User-facing hierarchy** — Project → Environment → Secret (namespace/zone hidden)
- **No NLP query interface** — deprioritised; anomaly detection is the AI investment
- **Multi-cloud** — reframed as Keyorix Connect (2027), not dropped
- **HRPS Identity Layer** — validated concept, DO NOT BUILD until 10+ customers
