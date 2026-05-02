# Keyorix — Session Starter Prompts
### Claude Desktop + filesystem MCP — files are read automatically, no attachment needed.

---

## HOW TO START ANY SESSION

1. Open a new chat in Claude Desktop
2. Paste the relevant starter prompt below
3. Claude reads all files directly from `/Users/andreibeshkov/dev/keyorix/`

---

## 🔧 BACKEND SESSION

**When to use:** Go code, CLI, API, encryption, storage, server, tests, Docker

**Starter prompt:**
```
Session type: Backend

Please read these files before we start:
- /Users/andreibeshkov/dev/keyorix/keyorix-core.md
- /Users/andreibeshkov/dev/keyorix/keyorix-product.md
- /Users/andreibeshkov/dev/keyorix/keyorix-security.md
- /Users/andreibeshkov/dev/keyorix/keyorix-backlog.md

Rules:
- Always use absolute paths starting with /Users/andreibeshkov/dev/keyorix/
- Verify changes: cd /Users/andreibeshkov/dev/keyorix/keyorix && go build ./...
- Run tests: cd /Users/andreibeshkov/dev/keyorix/keyorix && go test ./...
- Use git stash to isolate pre-existing test failures from regressions
- Commit after each logical group of changes

Today's task:
[describe what you're working on]
```

---

## 🖥️ FRONTEND SESSION

**When to use:** React, keyorix-web, TypeScript, UI fixes, component work

**Starter prompt:**
```
Session type: Frontend

Please read these files before we start:
- /Users/andreibeshkov/dev/keyorix/keyorix-core.md
- /Users/andreibeshkov/dev/keyorix/keyorix-product.md
- /Users/andreibeshkov/dev/keyorix/keyorix-backlog.md

Rules:
- Always use absolute paths starting with /Users/andreibeshkov/dev/keyorix/
- Frontend repo is at /Users/andreibeshkov/dev/keyorix/keyorix-web/
- Env files: /Users/andreibeshkov/dev/keyorix/keyorix-web/.env.development and .env.production
- Verify: cd /Users/andreibeshkov/dev/keyorix/keyorix-web && npm run build

Today's task:
[describe what you're working on]
```

---

## 📣 GTM SESSION

**When to use:** Outreach drafts, discovery call prep, LOI follow-up, demo prep, consulting funnel, co-founder outreach

**Starter prompt:**
```
Session type: GTM

Please read these files before we start:
- /Users/andreibeshkov/dev/keyorix/keyorix-core.md
- /Users/andreibeshkov/dev/keyorix/keyorix-gtm.md
- /Users/andreibeshkov/dev/keyorix/keyorix-backlog.md

Rules:
- No code in this chat
- ICP: European enterprises 200-1000 employees, on-prem required
- Anti-ICP: solo devs, US-first startups, greenfield companies with no urgency
- Tone: direct, peer-to-peer, no startup buzzwords
- Challenge assumptions — reasoning before conclusions

Today's task:
[describe what you're working on — e.g. "draft 5 Vault health assessment outreach messages"]
```

---

## 🧭 STRATEGY SESSION

**When to use:** Competitive analysis, positioning, ENISA prep, co-founder search, investor narrative, pricing, market research

**Starter prompt:**
```
Session type: Strategy

Please read these files before we start:
- /Users/andreibeshkov/dev/keyorix/keyorix-core.md
- /Users/andreibeshkov/dev/keyorix/keyorix-strategy.md
- /Users/andreibeshkov/dev/keyorix/keyorix-backlog.md

Rules:
- No code in this chat
- Challenge my assumptions — I push back when I disagree, give reasoning before conclusions
- Flag if a decision conflicts with anything already decided in the context files
- Capture new decisions as a diff at end of session

Today's task:
[describe what you're working on — e.g. "prepare for LOI 5 follow-up call"]
```

---

## 🔐 SECURITY SESSION

**When to use:** Encryption work, key provider implementation, security review, ENISA deliverables, gosec triage

**Starter prompt:**
```
Session type: Security

Please read these files before we start:
- /Users/andreibeshkov/dev/keyorix/keyorix-core.md
- /Users/andreibeshkov/dev/keyorix/keyorix-security.md
- /Users/andreibeshkov/dev/keyorix/keyorix-backlog.md

Rules:
- Always use absolute paths starting with /Users/andreibeshkov/dev/keyorix/
- Write ADR before implementing any security change
- Secret values NEVER touch any AI model — metadata only
- Verify: cd /Users/andreibeshkov/dev/keyorix/keyorix && go build ./... && go test ./...

Today's task:
[describe what you're working on — e.g. "implement AAD binding in GCM"]
```

---

## 📝 END-OF-SESSION RITUAL (all session types)

Before closing any chat, paste this:

```
Session closing. Please summarise:
1. What was completed this session — tick off items in keyorix-backlog.md
2. What new open items were discovered — add to appropriate section in keyorix-backlog.md
3. Any decisions made that need updating in the relevant L2 file (keyorix-product.md, keyorix-security.md, keyorix-gtm.md, or keyorix-strategy.md)

Write all changes directly to the files on disk.
```

---

## 📅 WEEKLY RHYTHM (suggested)

| Day | Session type | Typical task |
|---|---|---|
| Monday | GTM | 5 Vault health assessment outreach messages |
| Tuesday | Backend | One focused coding task from backlog |
| Wednesday | GTM | Follow up on replies, LOI prep |
| Thursday | Backend or Security | One focused task from backlog |
| Friday | Strategy | Weekly review, pipeline update, next week planning |

**Rules:**
- One chat per session. One session per topic. Never mix GTM and Backend in the same chat.
- Fresh chat = fresh context. Don't let a chat run beyond ~15 messages.
- End every session with the closing ritual — this keeps the backlog current.
