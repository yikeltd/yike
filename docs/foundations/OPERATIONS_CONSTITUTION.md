# Document 07 — Operations Constitution

**Authority Level:** Highest Operational & Administrative Authority  
**Governance Scope:** Operational Workflows, Content Moderation, Field Operations, Verification Approvals, SLAs, Admin Console (`/lex`)  
**Status:** Frozen Baseline (Yike V2 Phase 0)  

---

## 1. Operational Mission & Excellence

Platform operational integrity is the backbone of Yike’s trust framework. Operational teams—Moderators, Verification Officers, Field Inspectors, and Support Specialists—operate under strict SLAs, standard operating procedures, and automated quality controls to keep the marketplace safe and responsive.

---

## 2. Core Operational Workflows

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 1. Moderation   │───>│ 2. Verification │───>│ 3. Inspection   │───>│ 4. Support &    │
│ Queue (<15m)    │    │ Audit (<2h)     │    │ Field Ops (<24h)│    │ Resolution      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### A. Content Moderation Workflow
1. **Automated Submission Ingestion**: Every new or edited listing passes through automated filters (duplicate image detection, price anomaly check, banned contact patterns).
2. **Manual Review Queue**: Flagged listings enter the `/lex/auth/listings/review` queue.
3. **Decision & SLA**: Review completed within 15 minutes. Listings are either `Approved`, `Rejected` (with specific policy reasons), or `Flagged for Verification`.

### B. Identity & Business Verification Workflow
1. **Document Submission**: Agent uploads NIN, CAC filing, or proof of address.
2. **Verification Audit**: Verification Officer validates documents against government databases or CAC registry via `/lex/auth/verification-requests`.
3. **Status Update**: Upon approval, the seller's profile receives the `Verified Agent` or `Verified Business` badge automatically. SLA: $< 2$ hours.

### C. Physical Asset Inspection Workflow
1. **Request Dispatch**: Buyer orders an inspection; the `/lex/auth/property-verifications` engine assigns the nearest certified Field Inspector.
2. **Field Visit & Data Capture**: Inspector conducts on-site 50-point inspection using the Yike Inspector Mobile App, uploading geotagged photos and video.
3. **QA Audit & Release**: Operational Lead reviews report quality before publishing to buyer. SLA: Total turnaround $< 24$ hours.

### D. Buyer Assistance & Dispute Workflow
1. **Issue Logging**: Buyer files report via `/lex/support/reports` regarding listing inaccuracy, uncommunicative seller, or deposit dispute.
2. **Investigation**: Support Officer reviews chat transcripts, inspection logs, and listing revisions.
3. **Resolution**: Binding action (warning, trust score deduction, listing removal, or account suspension) executed within 24 hours.

---

## 3. Operational Service Level Agreements (SLAs)

| Operational Task | Standard SLA | Fast-Track SLA (`PRO`/`PRIME`) | Enterprise SLA (`PINNACLE`) |
|------------------|--------------|--------------------------------|-----------------------------|
| **Listing Moderation** | $< 2$ hours | $< 15$ minutes | Instant / Auto-Approve |
| **Identity Verification** | $< 12$ hours | $< 2$ hours | $< 30$ minutes |
| **Inspection Dispatch** | $< 48$ hours | $< 24$ hours | Same-Day Priority |
| **Support Escalation** | $< 24$ hours | $< 4$ hours | $< 1$ hour Dedicated |
| **Dispute Resolution** | $< 72$ hours | $< 24$ hours | $< 12$ hours |

---

## 4. Field Inspector Onboarding & QA Standards

- **Onboarding Requirements**: Field Inspectors must hold certified degrees in Building Construction, Estate Surveying, or Automotive Engineering, complete background verification, and pass a 3-day Yike Inspection Standard Training Course.
- **Random QA Audits**: 10% of all submitted inspection reports undergo blind re-audits by Senior Operational Managers to maintain inspection accuracy.
- **Zero Tolerance Policy**: Any inspector found colluding with sellers or faking inspection reports is immediately terminated, barred, and reported to law enforcement.

---

## 5. Administrative Console Architecture (`/lex`)

All administrative and operational workflows are managed strictly through the secure `/lex` command center:
- `/lex/auth/overview`: Real-time operational velocity metrics.
- `/lex/auth/listings/review`: High-speed listing moderation drawer.
- `/lex/auth/verification-requests`: Identity & business document audit portal.
- `/lex/auth/property-verifications`: Inspector dispatch & report review center.
- `/lex/support`: Customer service, lead assistance, and dispute resolution hub.
