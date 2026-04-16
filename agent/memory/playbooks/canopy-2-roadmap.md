# Canopy 2.0 — Org-Wide Platform Roadmap

> **Purpose:** Transform Canopy from a Fund Admin–only toolkit into JSQ's unified intelligence and operating layer across all seven org personas. This playbook synthesizes competitive research across RevOps, Marketing, People/HR, Finance/FP&A, Product/Engineering, SLT, and BI/Analytics into a phased feature roadmap.

---

## Strategic Premise

JSQ is at $70M+ GPX ARR, 2,000+ software clients, 480+ FA clients, 3,000 entities under service, and on track for 500+ FA headcount. The current stack is fragmented: Salesforce for RevOps, Greenhouse for recruiting, Lattice for performance, Anaplan for FP&A, Linear for eng, Tableau/Looker for BI — all siloed. Canopy 2.0 collapses these into a single agentic operating layer where every business action leaves an audit trail, every insight is generated from live data, and every workflow can be delegated to an agent.

**Canopy 2.0 is the "front-back-middle-anything CRM and BI layer for JSQ."**

---

## Domain 1 — Revenue Operations (Quote-to-Cash)

### Top Vendor Capabilities Being Disrupted
| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Salesforce Revenue Cloud | CPQ, dynamic pricing, order management, ARR waterfall | Einstein Copilot — opportunity scoring, forecast assist |
| HubSpot Sales Hub | Deal pipeline, sequences, predictive lead scoring | Breeze AI — meeting prep, email drafts, churn signals |
| Gong.io | Call intelligence, deal risk scoring, rep coaching | AI deal summaries, objection pattern detection |
| Clari | Revenue intelligence, forecast roll-ups, NRR attribution | AI "call" on deal outcome, pipeline gap detection |
| Ironclad | Contract lifecycle, redline tracking, e-sign | AI contract review, clause extraction |
| Stripe Revenue Recognition | ASC 606 waterfall, rev rec schedules, MRR/ARR analytics | Automated journal entry suggestion |

### Canopy 2.0 RevOps Module
**Core features:**
- **Prospect & Pipeline CRM**: GP prospect profiles linked directly to entity type, AUA target, fund strategy — not generic contacts. Deal stage = `Prospecting → Due Diligence → Proposal Sent → SOW Signed → Onboarding → Live`.
- **Proposal Intelligence**: Agent auto-generates draft FA Proposal (like the JSQ template) from a GP profile — fund count, entity structure, domicile, accounting system, headcount. Human reviews and approves.
- **Quote-to-Contract**: BPS-based fee model builder. Per-entity pricing, setup fees, and annual minimums. Contract auto-drafted, redlines tracked, countersigned.
- **ARR Waterfall**: Live ARR/AUA dashboard per client: software ARR, FA services ARR, loan admin ARR. Expansion, contraction, churn all surfaced in one view.
- **Revenue Recognition**: ASC 606 schedules auto-generated per contract line item. Integration hooks to NetSuite/Sage for journal entries.
- **Forecast Agent**: Rolls up pipeline-weighted forecast by close quarter. Surfaces at-risk deals (>30 days stale, no activity). Weekly digest pushed to SLT.

**Agentic patterns:**
- Prospect brief agent: Before a sales call, agent reads the GP's Form ADV, website, known fund history, and returns a 1-page brief.
- Renewal risk agent: 90 days before contract anniversary, surfaces NPS trend, open tickets, headcount change, AUA change.
- Churn prediction: Flag clients where AUA dropped >15% YoY or key contact departed.

---

## Domain 2 — Marketing

### Top Vendor Capabilities Being Disrupted
| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Marketo / HubSpot Marketing | Campaign automation, lead nurture, MQL scoring | AI content generation, send-time optimization |
| Drift / Intercom | Conversational marketing, chatbot, product tours | AI chatbot with RAG over docs |
| Demandbase | ABM targeting, intent signals, company-level scoring | AI audience selection, intent-based alerting |
| Contentful / Sanity | Headless CMS, content modeling | AI content suggestions, SEO metadata gen |
| Mutiny | Website personalization by visitor segment | AI headline testing, segment-aware copy |
| Vidyard | Video prospecting, view analytics | AI script generation, voiceover |

### Canopy 2.0 Marketing Module
**Core features:**
- **Content Hub**: Single place to draft, approve, and publish thought leadership (whitepapers, webinar decks, fund admin guides). Agent surfaces which topics drive GP inbound by cross-referencing pipeline origination source.
- **ABM Campaign Engine**: Target list = GP prospects segmented by fund type (PE, VC, RE, Credit), AUA band, domicile, current accounting system. Agent auto-personalizes outreach copy per segment.
- **Event & Webinar Pipeline**: Track conferences (iConnections, GAIM, SuperReturn, Pepper Hamilton, ILPA events) → leads → demos → pipeline.
- **Marketing-to-Sales Handoff**: MQL definition = engaged with 2+ content pieces + viewed pricing page + fund type matches ICP. Agent surfaces warm MQLs to the AE with context.
- **Competitive Intelligence Agent**: Agent monitors competitor pricing/feature changes (Allvue, Juniper Square competitors, Carta, iCapital) and updates a live competitive positioning doc.

**Agentic patterns:**
- Content brief agent: Given a target persona (RE GP, CFO of $500M PE fund), generate a full whitepaper brief with key themes, data points to pull from JSQ datasets, and an outline.
- Campaign ROI agent: Attribute pipeline and closed-won ARR back to originating campaign. Surfaces cost-per-opportunity by channel.

---

## Domain 3 — People / HR

### Top Vendor Capabilities Being Disrupted
| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Workday HCM | Org structure, HRIS, time/attendance, skills ontology | Workday Illuminate — job description generation, attrition prediction |
| Greenhouse | ATS, structured interviews, offer management | AI interview question gen, bias detection |
| Lattice | OKRs, 360 reviews, engagement surveys, career ladders | AI review summary, goal alignment scoring |
| Rippling | Onboarding automation, device management, payroll | AI policy lookup, workflow automation |
| Leapsome | Learning paths, skills assessment, 1:1 agendas | AI coaching nudges, skill gap detection |
| Eightfold AI | Talent intelligence, internal mobility, workforce planning | AI talent matching, succession risk |

### Canopy 2.0 People Module
**Core features:**
- **Org Chart & Pod Directory**: Live org chart reflecting JSQ's pod-based FA delivery model. Each pod (POD-FA-01 through POD-FA-06, POD-TAX-01, POD-SF-03, etc.) shows team lead, analysts, client assignments, capacity utilization.
- **Capacity Planning**: For each FA pod: clients assigned vs. capacity (AUA per analyst benchmark). Surfaces over/under-loaded pods. Feeds into hiring plan.
- **Hiring Pipeline**: Req → JD draft → Interview stages → Offer → Onboarding checklist. Agent generates JD from pod gap analysis and JSQ comp bands.
- **Performance & OKRs**: Quarterly OKRs per team (FA accuracy rate, NAV delivery SLA, client NPS). 360 reviews with structured competency ratings (Fund Accounting, LP Communications, Tech Fluency, etc.).
- **Skills & Certification Tracker**: For each FA staff member: CPA status, fund strategy specializations (PE, VC, RE, Credit), systems certifications (Investran, Allvue, eFront, Geneva). Surfaces gaps ahead of new client onboarding.
- **Onboarding Agent**: New hire joins FA pod. Agent generates a 90-day onboarding plan: shadow fund close, take systems certification, complete compliance training, own first solo entity by day 60.
- **Attrition Risk Agent**: Flags staff with >18 months tenure, no promotion signal, 2+ critical survey scores. Escalates to pod lead.

**Agentic patterns:**
- Succession agent: For each senior FA staff member, identify 1–2 successors from lower levels. Surface training gaps.
- Headcount forecast agent: Given AUA pipeline for next 2 quarters, projects required pod capacity and generates a hiring plan with timeline.

---

## Domain 4 — Finance / FP&A / Corporate Accounting

### Top Vendor Capabilities Being Disrupted
| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Anaplan | Connected planning, driver-based models, scenario planning | AI forecast assist, anomaly detection |
| Pigment | Revenue & headcount planning, P&L modeling | AI plan generation, natural language querying |
| NetSuite ERP | GL, AP/AR, multi-entity consolidation, revenue recognition | SuiteAnalytics AI, AI journal entry suggestion |
| Sage Intacct | Fund accounting, multi-entity, project accounting | AI GL coding, anomaly flagging |
| Mosaic Tech | Strategic finance, real-time GAAP, SaaS metrics | AI CFO assistant, metric alerts |
| Cube HQ | Spreadsheet-native FP&A, version control | AI variance commentary |

### Canopy 2.0 Finance Module
**Core features:**
- **Corporate P&L Dashboard**: JSQ's own P&L — software ARR, FA services revenue, loan admin revenue, COGS (FA headcount cost per entity), gross margin by service line. Updated monthly from GL.
- **Unit Economics per FA Client**: Revenue per client (BPS × AUA), cost to serve (pod hours × blended rate), margin per client. Identifies unprofitable clients below BPS floor.
- **ARR Cohort Analysis**: Net Revenue Retention (NRR), gross retention, expansion ARR by fund type. Compares software vs. services ARR retention curves.
- **Budget vs. Actual Agent**: Every month close, agent compares actuals to budget across all cost centers, surfaces >5% variances with explanation prompts, drafts variance commentary for the CFO deck.
- **Scenario Planning**: "What if FA headcount grows 20%?" → agent models P&L impact, capacity coverage, margin compression. Shows break-even AUA per new hire.
- **Billing & Collections Agent**: Monitors AR aging per client. Flags >45-day invoices. Drafts follow-up emails. Escalates to CSM if >90 days.

**Agentic patterns:**
- Board prep agent: 10 days before board meeting, agent assembles KPI report: ARR waterfall, headcount plan vs. actuals, pipeline coverage, FA efficiency metrics. Presents as Canopy board deck.
- Cash flow forecast agent: Projects 13-week cash flow from contracted ARR, expected collections, scheduled vendor payments, payroll cadence.

---

## Domain 5 — Product / Engineering

### Top Vendor Capabilities Being Disrupted
| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Linear | Issue tracking, sprints, cycles, roadmaps | AI issue triage, PR link detection |
| Notion | Docs, wikis, databases, project planning | AI writer, Q&A over knowledge base |
| GitHub / GitLab | Code, PRs, CI/CD, security scanning | Copilot — code completion, PR review |
| Productboard | Feature prioritization, customer feedback aggregation | AI insight clustering, effort/impact scoring |
| Amplitude | Product analytics, funnel analysis, retention | AI anomaly detection, cohort comparison |
| LaunchDarkly | Feature flags, gradual rollouts, A/B testing | AI flag cleanup, stale flag detection |
| Sentry | Error monitoring, performance, session replay | AI root cause grouping |

### Canopy 2.0 Eng/Product Module
**Core features:**
- **Feature Backlog**: JSQ product roadmap with items linked to customer requests (from FA clients, LP portal, software clients), effort estimates, and launch targets. Agent auto-links Salesforce tickets to backlog items.
- **Release Tracker**: Every sprint/cycle has expected deliverables. Status auto-updated from GitHub PR merge status. Release notes auto-drafted by agent from merged PRs.
- **Incident Dashboard**: P0/P1 incidents with blast radius (# clients affected, AUA at risk), RCA linked, SLA clock visible. Agent drafts customer-facing incident update every 30 minutes.
- **Technical Debt Heatmap**: Surfaces oldest/most-touched files, highest churn modules, test coverage gaps. Agent generates prioritized refactor plan.
- **Client Feedback Loop**: Feature requests from FA clients (via CSM) and LP portal users auto-parsed and clustered. Agent surfaces top 3 most-requested improvements weekly.
- **Infrastructure Cost Agent**: Monitors cloud spend by service. Surfaces idle resources, overprovisioned RDS, expensive Lambda patterns. Estimates savings per optimization.

**Agentic patterns:**
- Architecture review agent: Before a major design decision, agent reads recent ADRs, surfaces related prior decisions, flags consistency risks.
- QA triage agent: Reads failing CI tests, groups by root cause, assigns to the right team, drafts fix hypotheses.

---

## Domain 6 — SLT (Senior Leadership Team)

### Top Vendor Capabilities Being Disrupted
| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Viva Goals (Microsoft) | OKR cascade, alignment visualization | AI goal suggestion, check-in nudges |
| Asana Goals / Portfolio | Strategic portfolio view, goal-to-task linkage | AI status rollup |
| Klipfolio / Geckoboard | Real-time KPI dashboards for exec TV displays | Alert thresholds, anomaly alerts |
| Tableau / Looker | Ad-hoc analytics, exec dashboards, data storytelling | AI narrative generation, natural language query |
| Qualtrics XM | Employee, client, and market experience measurement | AI sentiment analysis, theme clustering |
| Peakon / Glint | Continuous employee listening | AI manager coaching, eNPS drivers |

### Canopy 2.0 SLT Module
**Core features:**
- **Executive Command Center**: Single-screen view of company health: ARR, pipeline, FA utilization, NPS, headcount plan vs. actuals, incident status. Red/amber/green for each domain. Drills into any domain in one click.
- **OKR Cascade**: Company OKRs → department OKRs → pod/team OKRs. Each OKR has a health indicator updated weekly by the owning team lead.
- **Board Pack Agent**: CEO/CFO enter the board meeting date. Agent assembles the pack from live data: ARR waterfall, headcount, pipeline, FA delivery metrics, risk register. Outputs as structured Canopy doc.
- **Risk Register**: Live risk register with likelihood/impact ratings, owner, and mitigation. Agent flags newly materialized risks (client churn signal, regulatory change, key person departure).
- **M&A/Partnership Pipeline**: Track strategic conversations (potential acquisitions, partnerships with Investran, Allvue, eFront, iCapital, HarbourVest). Each target has a thesis, data room status, integration readiness score.
- **Competitive Positioning**: Live SWOT matrix. Agent ingests new competitor press releases, fundraises, and product launches and flags SLT within 24 hours.

---

## Domain 7 — BI / Analytics

### Top Vendor Capabilities Being Disrupted
| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Tableau | Visual analytics, calculated fields, Story Points | Einstein Discover, Ask Data NL query |
| Looker (Google) | LookML semantic layer, embedded analytics | Duet AI — NL query, chart generation |
| Sigma Computing | Spreadsheet-style BI on cloud warehouse | AI formula assist, anomaly detection |
| Hex | Collaborative notebooks, SQL + Python + BI | AI cell generation, narrative text |
| ThoughtSpot | Natural language search over data, Liveboards | Spotter AI — conversational analytics |
| Fivetran / dbt | ELT pipelines, data transformation, lineage | AI-generated dbt models |

### Canopy 2.0 BI Module
**Core features:**
- **Semantic Layer**: All Canopy entities (Client, Entity, InternalUser, WfFund, Investor, TaskAssignment, Document, CashFlow) exposed as a typed semantic layer queryable in plain English.
- **Natural Language Query**: "Which FA pods have the highest task overdue rate this quarter?" → agent writes the query, returns the table, offers to chart it. No SQL required.
- **Custom Dashboards**: Drag-and-drop dashboard builder. Charts auto-suggest based on selected metrics. Saved dashboards shared across team.
- **LP Analytics**: Per-investor view: total AUA committed across entities, distribution history, K-1 delivery status, document access patterns.
- **Benchmark Engine**: For a given entity, compare NAV growth rate, DPI, TVPI against anonymized peer set (PE funds of similar vintage and strategy in the Canopy dataset).
- **Anomaly Detection Agent**: Monitors KPIs for unusual movements. If Walker III NAV drops >5% month-over-month unexpectedly, agent flags it, pulls the NAV snapshot notes, and routes to the pod lead.
- **Scheduled Reports**: Pod leads subscribe to weekly FA metrics digest (tasks overdue, entities behind on NAV, open investor queries). Agent runs the query, formats the email, delivers at 8am Monday.

---

## Phased Roadmap

### Phase 1 — Foundation (Q2–Q3 2026)
**Goal:** Wire all 7 org personas into Canopy's data model. No new external systems needed.

| Feature | Domain | Effort |
|---|---|---|
| Executive Command Center (live KPI roll-up) | SLT | M |
| ARR Waterfall + client P&L | Finance | M |
| Org chart + pod directory with capacity | People | S |
| Pipeline CRM (GP prospects → live clients) | RevOps | L |
| Natural language query (semantic layer) | BI | L |
| Feature backlog + release tracker | Prod/Eng | M |

### Phase 2 — Agents (Q3–Q4 2026)
**Goal:** Replace manual weekly reporting and recurring prep work with agents.

| Agent | Domain | Trigger |
|---|---|---|
| Board pack agent | SLT/Finance | 10 days before board date |
| Prospect brief agent | RevOps | New prospect added |
| Budget vs. actual commentary | Finance | Monthly close complete |
| Headcount forecast agent | People | Quarterly planning cycle |
| Anomaly detection agent | BI | Real-time, continuous |
| Renewal risk agent | RevOps | 90 days pre-anniversary |
| Content brief agent | Marketing | Campaign request |

### Phase 3 — Embedded Intelligence (Q1 2027+)
**Goal:** Make every Canopy page self-explaining. Any metric surfaces its own AI narrative. Any workflow surfaces its own agent assist.

- Every table has a "Why is this?" explain button powered by an agent with full context
- Every entity page has a health score with agent-generated rationale
- Every client page has a relationship timeline (calls, docs, NAV events, incidents) with AI summary
- LP portal embedded: LPs can ask "What is my current IRR?" and get an audited answer from Canopy's waterfall engine

---

## Data Integration Map

For Canopy 2.0 to serve all personas, it needs live data from:

| Source System | Data | Integration Method |
|---|---|---|
| Salesforce | Pipeline, contacts, ARR, renewal dates | REST API / webhooks |
| NetSuite / Sage | GL actuals, AP/AR, journal entries | REST API (read-only) |
| HRIS (Workday / Rippling) | Org chart, headcount, roles | SCIM + REST API |
| GitHub | PRs, releases, CI status | GitHub Actions webhooks |
| Investran / Allvue / eFront | Client-side fund accounting data | SFTP + API (per-client) |
| Custodian feeds | Security prices, position data | SWIFT MT / ISO 20022 |
| LP communications (email) | Inbox monitoring for investor queries | Gmail / Outlook API |

---

## Success Metrics for Canopy 2.0

| Metric | Target |
|---|---|
| Avg weekly active users (all JSQ) | >85% of headcount |
| Manual report hours replaced per week | >40 hrs |
| ARR accuracy vs. ERP actuals | <0.5% variance |
| Agent-drafted deliverables accepted without major edit | >70% acceptance rate |
| Time from fund close trigger to board pack delivery | <4 hours (from current ~2 days) |
| Client NPS after Canopy 2.0 launch | +8 points vs. baseline |

---

## Domain 8 — IT Infrastructure & Security

### Top Vendor Capabilities Being Disrupted

| Vendor | Key Features | Agentic AI Maturity |
|---|---|---|
| Okta / Okta Workforce | SSO, SCIM provisioning, MFA policies, lifecycle management | AI threat detection, anomalous login flagging |
| Microsoft Entra ID (Azure AD) | SSO, Conditional Access, External Identities (B2B/B2C), Privileged Identity Management | Copilot for Security — threat analysis, policy recommendations |
| CrowdStrike Falcon | EDR, identity threat protection, SIEM | AI threat graph, autonomous response |
| Vanta | SOC2/ISO 27001 automation, control evidence collection, vendor risk | AI evidence mapping, continuous compliance monitoring |
| Jamf / Microsoft Intune | Apple/Windows device management, MDM compliance | AI device risk scoring, auto-remediation |
| 1Password Teams | Secrets management, SSH key management, team vaults | AI secret rotation suggestions, breach exposure detection |
| Cloudflare Zero Trust | ZTNA (replace VPN), DLP, browser isolation, access policies | AI traffic anomaly detection |
| SailPoint / Saviynt | Identity governance, access reviews, birthright provisioning | AI access certification, outlier detection (over-provisioned users) |

### Canopy 2.0 IT Infrastructure & Security Module

**Core features:**

**Identity & Access Management (IAM)**
- Microsoft Entra ID as the single identity provider. All Canopy users authenticate via Entra SSO (OIDC). External users (GPs, LPs) via Entra External Identities.
- SCIM provisioning: new hire in HRIS → auto-provisioned in Entra → auto-created in Canopy with department-derived `CanopyRole`. Offboarding: account deactivated across all systems within 1 hour of HRIS termination.
- MFA enforcement by role: SYSTEM_ADMIN and COMPLIANCE require hardware-key or authenticator-app MFA (FIDO2). All other roles: authenticator app minimum.
- Conditional Access policies: block access from non-compliant devices, require step-up MFA for sensitive modules (Waterfall editing, financial exports).
- Privileged Identity Management (PIM): SYSTEM_ADMIN role is time-limited — activated on demand, logged, auto-expires after 4 hours.

**Canopy Security Center (`/settings/security`)**
- RBAC matrix: all users, derived Canopy roles, module access chips, MFA status, VPN access, account lock status.
- Inline account lock/unlock (SYSTEM_ADMIN only).
- Role Definitions accordion: each role's permission scopes documented and machine-readable (from `lib/permissions.ts`).
- Audit Log: permission changes, account locks, access grants/revocations — append-only, sourced from `agent/governance/audit-log/`.
- Department filter + user search across the full user matrix.

**Device Compliance**
- Agent reads Jamf/Intune MDM compliance state per user device. Canopy access blocked for devices with `compliance: false`.
- `deviceInventory` and `laptopModel`/`laptopSerial` fields already on `InternalUser` — surfaced in Security Center expanded row.

**Secrets & API Key Management**
- Per-user API keys managed in Canopy Security Center. Each key has an expiry date, scope (read/write), and issuing admin.
- `apiAccess: true` on `InternalUser` gates API key issuance.
- Agent alerts 14 days before API key expiry. Auto-revoke at expiry.
- `ipWhitelist` field on `InternalUser` enforced at API gateway level.

**Compliance Automation**
- SOC2 Type II evidence collection: Canopy audit log feeds directly into Vanta evidence requests. Security Center generates control evidence exports on demand.
- Quarterly access reviews: agent generates a report of all users with elevated permissions (admin, API access, data warehouse), routes to SYSTEM_ADMIN for certification. Uncertified access auto-revoked after 14 days.
- Vendor risk registry: tracks all third-party integrations (Investran, Allvue, eFront, Custodians), their data access scope, security certifications (SOC2 report date, ISO 27001), and contract expiry.

**Incident Response**
- Security incident log in Security Center: P1 (credential compromise) through P3 (policy violation). Each incident linked to affected users/clients and a blast-radius estimate.
- Auto-revoke playbook: on P1 incident, agent locks the affected user account, revokes API keys, flags the pod lead, and routes to SYSTEM_ADMIN within 60 seconds.
- Post-incident review: 5-business-day RCA required, linked to incident record.

**Agentic patterns:**
- Access review agent: quarterly, generates the full access certification report, sends to SYSTEM_ADMIN for approval, tracks sign-off, auto-revokes uncertified access.
- Anomaly detection agent: flags users with login patterns deviating from baseline (off-hours, new country, burst of failed attempts). Routes to Security Center audit log.
- Offboarding agent: triggered by HRIS termination event. Deactivates Entra account, revokes API keys, archives user's documents, notifies pod lead to reassign clients.

### Permission Hierarchy (implemented in `lib/permissions.ts`)

```
SYSTEM_ADMIN  (adminPanelAccess: true)
  └── Unrestricted. All data, all modules, Security Center edit rights.
      Billy Wayne bwayne@junipersquare.com is SYSTEM_ADMIN.

SLT  (seniorityLevel M5/M6 or department SLT/Executive)
  └── Read access all KPIs, financials, pipeline. Cannot edit permissions.

FA_POD_LEAD  (department Fund Accounting, seniorityLevel M3/M4)
  └── Own pod's clients, entities, investors, team. No cross-pod visibility.

FA_STAFF  (department Fund Accounting)
  └── Assigned clients and entities only. Read-only most fields.

TAX  (department Tax / Tax Services)
  └── All entities (tax fields only), tax allocations, K-1 delivery.

COMPLIANCE  (department Compliance / Legal)
  └── Audit-mode read on all data, governance logs, KYC/AML fields.

FINANCE  (department Finance / Corp Accounting / Billing / FP&A)
  └── Full financials, ARR, treasury, billing. No client/entity write access.

REVOPS  (department Rev Ops / Client Success / Sales)
  └── Pipeline CRM, client health, proposals, ARR read.

ENGINEERING  (department Engineering / Product / Data / Technology / IT)
  └── Prod/eng module, incident dashboard. No fund data.

READ_ONLY  (all others)
  └── Self-profile only. View non-sensitive dashboards.
```

Auth provider: **Microsoft Entra ID** (Azure AD). NextAuth.js v5 integration scaffolded in `lib/auth.ts`. Activate by setting `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `NEXTAUTH_SECRET` in `.env.local`.

---

*Last updated: 2026-04-15. Source: org-wide competitive research across RevOps, Marketing, People/HR, Finance/FP&A, Prod/Eng, SLT, BI/Analytics, and IT Infrastructure & Security.*
