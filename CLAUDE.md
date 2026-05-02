# CLAUDE.md — Keyorix Project Instructions

## Session Start Protocol

**Always load at session start:**
- `keyorix-core.md` — orientation, dev commands, milestone, key decisions

**Load additionally based on session type:**

| Session type | Additional files |
|---|---|
| Backend coding | `keyorix-product.md` + `keyorix-security.md` |
| Frontend coding | `keyorix-product.md` |
| Sales / outreach | `keyorix-gtm.md` |
| Strategy / competitive | `keyorix-strategy.md` |
| Encryption / key provider | `keyorix-security.md` |
| Co-founder search | `keyorix-strategy.md` |
| ENISA / legal / visa | `keyorix-strategy.md` + `keyorix-security.md` |

Always also load `keyorix-backlog.md` — it contains all open items across every session type.

Do NOT load the full `keyorix-bible.md` unless explicitly asked. It exists as the canonical source but is too large to load every session.

---

## Project Layout

All repos are **separate git repos** cloned under the parent `~/dev/keyorix/` directory. The parent itself is NOT a git repo.

```
~/dev/keyorix/                   ← parent directory (not a repo)
  keyorix-bible.md               ← canonical archive
  keyorix-core.md                ← L1, load every session
  keyorix-product.md             ← L2, coding sessions
  keyorix-gtm.md                 ← L2, sales sessions
  keyorix-strategy.md            ← L2, strategy sessions
  keyorix-security.md            ← L2, security sessions
  CLAUDE.md                      ← this file
  keyorix/                       ← github.com/keyorixhq/keyorix (Go backend)
  keyorix-web/                   ← github.com/keyorixhq/keyorix-web (React, TypeScript)
  keyorix-mcp/                   ← github.com/keyorixhq/keyorix-mcp (MCP server, JavaScript)
  keyorix-go/                    ← github.com/keyorixhq/keyorix-go (Go SDK)
  keyorix-python/                ← github.com/keyorixhq/keyorix-python (Python SDK)
  keyorix-node/                  ← github.com/keyorixhq/keyorix-node (Node SDK)
  keyorix-java/                  ← github.com/keyorixhq/keyorix-java (Java SDK)
  keyorix-landing/               ← github.com/keyorixhq/keyorix-landing (marketing site, HTML)

~/dev/dashdiag/                  ← separate product — separate context
```

---

## Session Workflow

1. Read `keyorix-core.md` first (always)
2. Read L2 files relevant to today's task
3. Verify changes: `go build ./...` + relevant test suite
4. Use `git stash` to distinguish pre-existing failures from regressions
5. Commit and push after each logical group of changes
6. End-of-session: batch Bible updates as a complete diff → hand to Claude Code for filesystem write

---

## Known Pre-existing Test Failures (not regressions — do not fix unless specifically tasked)

- `server/middleware` build failure (`validateToken` signature mismatch)
- `TestRemoteCLIIntegration` (needs running server)
- `TestListSecretsWithSharingInfo` (mock mismatch)
- `TestRemoteStorage_Health` (timeout)

---

## Key Constraints

- **File upload caching:** Re-uploading a file with the same filename serves the cached version. Workaround: paste updated sections directly into chat.
- **Claude Code vs browser chat:** Claude Code handles larger refactoring and filesystem writes. Browser chat handles strategy, architecture, targeted fixes.
- **Bible updates:** Do not update L2 files piecemeal mid-session. Batch at session end as a diff.
- **DashDiag is a separate product.** Do not mix context with Keyorix sessions.

---

## Hard Rules (never relitigate without documented reason)

- **Always use absolute paths** in every command, task, or file reference. Never use relative paths. Example: `~/dev/keyorix/keyorix/internal/encryption/` not `internal/encryption/`.

- On-premise first. SaaS is sequenced post-3 paying customers.
- Binary split: `keyorix` (CLI) and `keyorix-server` (separate binaries, separate Makefile targets).
- AGPL dual licence. No MIT, no Apache, no BSL.
- User-facing hierarchy: Project → Environment → Secret. Never expose "namespace" or "zone" to users.
- No NLP query interface. Anomaly detection is the AI investment.
- HRPS Identity Layer: validated, DO NOT BUILD until 10+ paying customers + technical co-founder.
- Secret values NEVER touch any AI model. Metadata only.
