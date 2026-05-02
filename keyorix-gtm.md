# Keyorix GTM — L2 Reference
### Load for: sales calls, outreach, LOI follow-up, demo prep, consulting funnel
### Covers: LOI status, outreach templates, discovery script, demo script, objection handling

---

## Pipeline Status (April 2026)

| Prospect | Status | Next action |
|---|---|---|
| LOI 1 | Courtesy decline — no real pain | Archive |
| LOI 2 | Courtesy decline — no real pain | Archive |
| LOI 3 | Budget constrained | Re-engage September 2026 for Q1 2027 budget |
| LOI 4 | Budget constrained | Re-engage September 2026 for Q1 2027 budget |
| LOI 5 | **Pending** | Follow up now |

**🔴 CRITICAL THIS WEEK:** Send 5 Vault health assessment outreach messages to restart pipeline. Without this, first customer (August 2026) slips.

**September 2026 calendar reminder:** Re-engage LOIs 3+4 for Q1 2027 budget cycle.

---

## Consulting Flywheel

**Product:** Vault health assessment — audit cluster health, upgrade risk, maintenance burden.
**Price:** €3–8K for mid-market engagement.
**Buyer:** Same as Keyorix ICP — security/DevOps teams stuck with Vault.
**Strategic value:** Every assessment is a discovery call. Do not let consulting exceed 40% of weekly time.

**Template C — Vault health assessment intro:**
> Hi [Name], I specialise in Vault health assessments for mid-market security teams — I audit your cluster, flag upgrade risks, and give you a written report on operational posture. Fixed-fee engagement, typically 2-3 weeks, output is something you can show your CISO and auditors. Is this something your team has had bandwidth to look at? Happy to share scope and pricing.

---

## ICP

**Who:** European companies, 200–1,000 employees, existing secrets management problem.

**Sectors (priority):** Financial services (DORA) → Healthcare/MedTech (NIS2) → Defence/gov-adjacent (air-gap) → Manufacturing/industrial (OT) → SaaS with enterprise on-prem customers.

**Buying roles:** CISO (economic buyer) / DevOps lead or Security engineer (champion) / Enterprise architect (blocker).

**Top 5 pain points:**
1. Vault adopted, maintainer left, nobody can run it
2. Java-based tool consuming 4x hardware it should
3. Can't use SaaS (air-gap or data residency requirement)
4. Compliance audit flagged secrets management as gap
5. Secrets hardcoded in `.env` files

**Anti-ICP:** Solo devs, US-first startups without EU presence, greenfield companies with no urgency.

**Qualification (MEDDIC-lite):**
- On-premise required? Yes → qualify. SaaS acceptable? → deprioritise.
- Can we reach CISO within two meetings?
- Who maintains secrets today? What if they leave?

---

## Outreach Templates

### Template A — Cold outreach to DevOps lead (LinkedIn)
> Hi [Name], I noticed [Company] is running [Kubernetes / Vault / signal]. I'm building an on-premise secrets manager in Go — lightweight Vault alternative, single binary, no JVM, designed for teams that need air-gap or data sovereignty compliance. We're doing early-access design partner deployments. Happy to share what we've built — no pitch, just a 20-minute conversation to see if there's a fit. Worth a quick call?

### Template B — Warm intro follow-up (post-conference)
> Hi [Name], great to meet at [event]. You mentioned your team has been looking at alternatives to Vault — that's exactly the problem Keyorix is built for. We're a European-native, on-premise secrets manager — Go binary, PostgreSQL backend, built specifically for teams with data sovereignty or air-gap requirements. Five companies are already evaluating it. Would a 30-minute call make sense? I can show you what it looks like deployed.

### Template D — Technical co-founder outreach (OpenBao community)
> Hi [Name], I've been following your contributions to OpenBao — your work on [specific area] is exactly the kind of engineering approach I'm looking for. I'm the founder of Keyorix — lightweight secrets manager for European enterprises needing on-prem/air-gap. Go backend, SQLite + PostgreSQL, AGPL dual licence. Working prototype, 5 LOIs, no funding yet. I'm looking for a technical co-founder who understands this space deeply. If the BSL situation at HashiCorp frustrated you as much as it frustrated our customers, I think we'd have an interesting conversation. Up for a 30-minute call?

---

## Discovery Call Script (20 minutes)

**Opening:**
> "Before I say anything about what we're building — can you tell me how your team handles secrets today? Passwords, API keys, certificates — the stuff that should never end up in a Git repo."

**Listen for:** "We have Vault but..." / "We use [Java tool]..." / "We don't have anything formal..." / "We use Doppler" (may not be ICP).

**Pain excavation (Vault):**
- "Who owns the Vault cluster day-to-day? What happens if they leave?"
- "Have you ever had a Vault seal nobody knew how to fix?"
- "When did you last audit who has access to what?"

**Pain excavation (compliance):**
- "Are you in scope for NIS2 or DORA? Have auditors looked at your secrets management?"
- "Can you produce an audit log of every secret access in the last 90 days?"

**Qualification checkpoint (internal):** Can they buy? Is SaaS disqualified? Champion present? Budget urgency? If SaaS acceptable → end call gracefully.

**Positioning (only after hearing their pain):**
> "What you're describing is exactly what we built Keyorix for. [Echo their pain]. Single binary, no JVM, no SaaS dependency. PostgreSQL backend. Your DevOps team can operate it without a dedicated secrets admin. Audit logs are append-only and signed."

**Close:**
- Strong signal: "Would you be open to a 30-day design partner engagement?"
- Warm but not urgent: "Can I send a one-pager? Follow up in 30 days."
- Weak signal: "I'll keep you on our list — if your situation changes, especially around compliance reviews, reach out."

---

## Demo Script (15-20 minutes)

**Setup checklist:**
- Backend running: `KEYORIX_DB_PASSWORD=xxx go run server/main.go`
- Frontend running: `npm run dev` (port 3000)
- 3 demo secrets pre-created: `prod-db-password`, `stripe-api-key`, `jwt-signing-key`
- Demo user with limited permissions (shows RBAC)
- Browser zoom 110%, notifications off

**Chapter 1 — Login (30s):** Show login, dashboard with real stats. *"Running on your infrastructure. Nothing leaves your perimeter."*

**Chapter 2 — Secrets (4min):** Show secrets list, reveal a value, point to version history. *"Every change creates a version. Roll back without an outage."*

**Chapter 3 — RBAC (3min, via CLI):** `keyorix rbac list-roles` + `check-permission`. *"Enforced at the API level, not just the UI."*

**Chapter 4 — Audit log (3min):** Show `GET /api/v1/audit`. *"Every action logged with timestamp, user, IP. One query answers a NIS2 audit."*

**Chapter 5 — Deployment (2min):** `ls -la keyorix` + startup. *"One binary. No JVM. Copy to your server, point at PostgreSQL, done."*

**Chapter 6 — Close (2min):**
> "What would make this a no-brainer for your team?"

**Objection handling:**

| Objection | Response |
|---|---|
| "We already have Vault" | "Who maintains it today? What happens when that person leaves?" |
| "We use Doppler" | "Can you deploy Doppler in an air-gapped environment?" |
| "This looks early" | "The core is production-ready on PostgreSQL with real encryption. We're selective about design partners." |
| "We need SSO" | "OIDC/SAML is on our Q3 roadmap. Service tokens cover CI/CD for design partner phase." |
| "Why not AWS/Azure Secrets Manager?" | "Cloud-locked, no on-prem, separate silos per cloud. Keyorix gives you one system for all environments under your control." |
| "How is this different from Infisical?" | "Infisical's EU Cloud option still puts your data on their servers. With Keyorix, there's no Infisical.com in the loop at all." |
| "What about HA?" | "Single-node PostgreSQL handles most mid-market loads. HA is M2 roadmap. What's your availability requirement?" |
| "Secret Zero problem?" | "Same trade-off as an SSH key — one well-protected credential instead of dozens scattered around. Kubernetes service account auth is on roadmap for zero credentials." |

---

## Key Stats for Sales Conversations

- **$17,200/developer/year** — estimated secrets management toil (3hrs/week × fully-loaded dev cost)
- **23.7M secrets leaked on GitHub in 2024** — 25% YoY increase
- **70% of leaked secrets from 2022 are still active and unrotated**
- **35% of private repos contain hardcoded secrets**
- **45-to-1** — non-human identities to human users in DevOps environments
- **38% of secrets in Slack/Jira are classified as critical**

---

## Positioning One-Liners (for sales calls)

- **vs Vault:** *"Vault is great for storing secrets. We help you operate them without a dedicated Vault admin."*
- **vs Doppler:** *"Doppler simplifies access. We run in your datacenter."*
- **vs AWS SM:** *"Cloud tools manage secrets inside one platform. We give you visibility across all of them, including on-prem."*
- **vs Akeyless:** *"Akeyless gateway still phones home for key reconstruction. Keyorix runs entirely within your perimeter, no cloud dependency, ever."*
- **vs Infisical:** *"Infisical has an EU Cloud option — your data is still on their servers. With Keyorix, there's no Infisical.com in the loop at all."*

---

## Co-founder Pipeline

| Person | Role | Status | ETA |
|---|---|---|---|
| Yuri | Ops/deployments | ENISA visa submitted | ~6-9 months |
| Olga | Research/marketing/compliance | Submitting ENISA now | ~4-5 months |
| Yliya | Informal CTO/technical advisor | Based in Germany, Docker/K8s | Joins officially post-seed |

**Rule: sell the first 1-2 deals alone. Do not wait for co-founders.**

---

## Clearway CA Partnership (open item)

ex-Microsoft colleague building x.509 cert management (on-premise, few existing deployments).

Next steps:
- [ ] Technical call: REST API surface? Pricing? Joint customer intro?
- [ ] Referral arrangement: 15-20% revenue share on referred deals
- [ ] Joint pitch: "Complete secrets + certificate stack, fully on-premise, European, GDPR-native"
- [ ] Ask for warm intro to one of his existing enterprise customers
