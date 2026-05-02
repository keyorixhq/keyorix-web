# Keyorix Strategy — L2 Reference
### Load for: competitive analysis, positioning, ENISA/legal, co-founder search, investor prep
### Covers: competitive landscape, market positioning, regulatory angle, business context, vision

---

## Strategic Positioning

**Core differentiation:** Only purpose-built on-prem-first secrets manager from a European company.

**Two-layer positioning:**
- **For customers:** "Vault without complexity, fully on-prem, European company. Single binary, one command to run, audit logs your compliance team can use."
- **For investors/analysts:** "We're building the Secrets Runtime Platform — think Datadog, but for secrets behavior."

**Rule:** Never lead with investor framing in a customer call. Win the deal first.

**The opening hook:**
> *"Most teams think secrets are a security problem. In reality, they're a reliability and debugging problem."*

---

## Key Strategic Decisions (log — do not relitigate)

| Decision | Rationale |
|---|---|
| On-premise first | SaaS is crowded, trust-building is faster on-prem, customer controls data from day one |
| SaaS sequenced post-3 customers | Not ruled out — correctly sequenced |
| Multi-cloud reframed as Keyorix Connect (2027) | Anti-Microsoft pitch: keep sensitive secrets on-prem, federate visibility over Azure/AWS |
| HRPS Identity Layer deferred | Validated concept, wrong timing. Revisit at 10+ customers + technical co-founder |
| AGPL dual licence | Closes SaaS loophole (vs MIT/Apache), avoids BSL backlash |
| No NLP query interface | Validated learning — anomaly detection solves the real pain |

---

## Competitive Landscape (quick reference)

| Competitor | Their weakness | Our angle |
|---|---|---|
| HashiCorp Vault | Operational complexity, BSL licence, needs dedicated admin | "Replace it when the person who set it up leaves" |
| CyberArk Conjur | Java runtime, resource-heavy, expensive, full ecosystem buy-in required | "Single binary, no JVM, mid-market team can operate this" |
| Doppler | SaaS only | "Doppler is great if you can use SaaS. You can't." |
| Infisical | SaaS-first, self-hosted is afterthought, US company, no air-gap | "No Infisical.com in the loop at all" |
| Akeyless | Gateway still phones home for DFC key reconstruction | "Keyorix runs entirely within your perimeter. No cloud dependency, ever." |
| 1Password Secrets | Password manager extension, not enterprise-grade, SaaS-only, US/Canada | Wrong buyer — rarely in same deal |
| AWS/Azure/GCP | Cloud-locked, no on-prem, separate silos per cloud | "Works until you have a second cloud or a compliance requirement" |

**Akeyless — worth understanding deeply (fastest growing enterprise competitor):**
Architecture: SaaS + stateless gateway on-prem. DFC (Distributed Fragments Cryptography) — key split across AWS/Azure/GCP + customer fragment. Features: dynamic secrets, JIT PAM, cert lifecycle, session recording, multi-vault governance. Weakness: still SaaS, gateway requires internet for DFC. US/Israel company — GDPR exposure. Complex platform.

**What to steal from Akeyless:** "Crawl, walk, run" adoption framing. Multi-vault governance angle for Keyorix Connect narrative.

**Infisical — best CLI UX in category:** `infisical run -- npm run dev`. Self-hosted requires `INFISICAL_API_URL` workaround. No air-gap. EU Cloud option exists but data is still on their servers.

---

## Regulatory Hooks

| Regulation | Relevance | Keyorix angle |
|---|---|---|
| **NIS2** | Mandates security controls for mid-market in critical sectors. Spain draft law Jan 2025 | Audit logs + access controls = compliance artefact, not just a feature |
| **DORA** | Financial services operational resilience. In force Jan 2025 | Anomaly detection maps directly to DORA operational monitoring |
| **ENS** | Spain national security scheme — mandatory for public sector suppliers | M3 certification target — architecture already aligned |
| **EU AI Act** | Phased enforcement 2025-2026 | Keyorix audit logs + explainability angle for customers deploying AI |

---

## ENISA and Startup Visa Context

Spanish startup visa (Ley de Startups 2023) requires innovative product classification. Five annexes submitted.

**Important:** ENISA annexes were written to satisfy the innovation criterion, not binding product commitments. SaaS model in Annex 5 was initial hypothesis — pivoted to on-prem. AI features described are 2027+ roadmap.

**Three-year renewal deliverables (what to build before review):**

1. **Anomaly detection** — statistical baseline on `SecretAccessLog` (end of 2026), ML-based detection (mid-2027). Maps to NIS2 Article 21 + DORA operational monitoring.

2. **MCP server** — AI assistants manage secrets via natural language. Demonstrably real AI integration. If ENISA reviewer asks "where's the AI?" — demonstrate Claude creating secrets and querying audit logs via MCP. ~1 week to build.

**ENISA pivot narrative:** Initial hypothesis: NLP reduces cognitive load for access management. Customer validation showed: real cognitive load problem is knowing when access has been misused, not querying access. Anomaly detection addresses the validated pain. Document this quarterly as the pivot story.

**GitHub description — fix immediately:** Currently "AI powered secrets management solution" — misleading. Change to: *"Lightweight on-premise secrets management. AGPL. No SaaS dependency. Vault alternative for teams that need air-gap or data sovereignty."*

---

## Market Pain — Five Validated Points

1. **Credential usage blind spot** — "Vault's job ends when it hands over the credential. What happens after is a blind spot." → Surface `secret_access_logs` as usage analytics dashboard.

2. **Rotation failures are silent** — "AWS showed rotation successful — 3+ hours downtime because it actually failed silently." → Rotation state inspector.

3. **Non-Human Identity crisis** — NHIs outnumber humans 45:1 in DevOps. 23.7M secrets leaked on GitHub in 2024. → Kubernetes service account auth.

4. **Zombie secrets** — 70% of secrets leaked in 2022 still active. → Flag secrets unused for 30/60/90 days.

5. **Re-auth friction** — "1Password CLI requires re-unlock every 30 minutes." → Short-lived tokens with silent auto-refresh.

---

## Long-term Vision — Secrets Runtime Platform

**Category reframe:** from passive storage → active lifecycle control.

**Investor one-liner:** *"We're building the Datadog for secrets — not just storing them, but making them observable, debuggable, and self-healing."*

**Killer differentiator (long-term):** *"We don't just store secrets. We understand and control how they behave."*

**Demo scenarios no competitor runs:**
- Why a pipeline failed due to a secret
- Blast radius — what breaks if this secret changes
- Cross-environment drift detection
- Rotation failure root cause

---

## HRPS Identity Layer (validated, deferred)

Origin: conversation with CTO of large oil company (~5000 gas stations). Each station authenticates via AD + Vault proxy — still bottlenecked.

**The gap:** No product removes AD from the authentication hot path. In-memory identity graph: 100k+ RPS per node, <1ms p99, >95% cache hit, zero AD dependency in hot path.

**Do not build until:** 10+ paying customers + technical co-founder with distributed systems background + seed round closed + 3+ enterprise CTOs independently describe the same pain.

**Use now:** Go back to that CTO and mine for Keyorix deal. "How do you manage the actual secrets and credentials across those 5000 stations?"

---

## Co-founder Profile (target)

- **Technical background:** Go, distributed systems, security. OpenBao contributor or HashiCorp alumni ideal.
- **Why they join:** BSL frustration, EU market conviction, equity upside, meaningful problem.
- **What to offer:** Co-founder equity (not employee), vesting schedule TBD, Ley de Startups stock option improvements.
- **Search channels:** OpenBao GitHub contributors, HashiCorp alumni LinkedIn, KubeCon hallways.
- **Template D** in `keyorix-gtm.md` for outreach.

---

## Business Context

**Legal:** Keyorix SL, Valencia Spain. Name approved, bank account opening (post-Easter), incorporation pending. Autónomo invoicing can begin before incorporation is complete.

**Funding:** Bootstrapped. Target: seed round after 3-5 paying customers.

**GitHub org:** `github.com/keyorixhq`
- `keyorix` — public (AGPL ✅)
- `keyorix-web` — private
- `keyorix-landing` — private

**Licence strategy:**
- Community: AGPL-3.0 (closes SaaS loophole, OSI-approved, battle-tested)
- Enterprise: proprietary commercial licence (SSO, audit export, HA, SLA, FIPS future)
- CLA required for external contributions (CLA Assistant GitHub App)

**Why not BSL:** HashiCorp backlash is our recruiting and community strategy. BSL not OSI-approved — enterprise legal teams sometimes reject it.
