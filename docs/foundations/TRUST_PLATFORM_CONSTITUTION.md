# Document 04 — Trust Platform Constitution

**Authority Level:** Highest Trust & Security Authority  
**Governance Scope:** Identity, Physical Asset Inspection, Legal Title Search, Verification Badges, Fraud Prevention  
**Status:** Frozen Baseline (Yike V2 Phase 0)  

---

## 1. Trust Philosophy & Core Governance

In emerging real estate and vehicle markets, transaction friction is driven by asymmetric information and fear of financial loss. Yike Trust is designed as an uncompromised verification protocol that verifies people, assets, and documentation before money changes hands.

### Core Governance Principles:
1. **Verification is Objective**: Badges and scores are computed from verifiable evidence (government ID, CAC documents, physical inspection logs), never purchased or manually overwritten without audit trails.
2. **Multi-Layer Shield**: Trust is established across three distinct layers:
   - **Identity Layer**: Who is the seller/agent? (NIN, Phone OTP, Video Selfie, CAC).
   - **Asset Layer**: Is the property/vehicle real, available, and accurately described? (Field Inspection, GPS Tagging).
   - **Document Layer**: Is the title/registration clean and legally transferrable? (Government Registry Verification).

---

## 2. The Trust Lifecycle

$$\text{Identity Verification} \longrightarrow \text{Business Validation} \longrightarrow \text{Listing Submission} \longrightarrow \text{Physical / Video Verification} \longrightarrow \text{Trust Score Computation} \longrightarrow \text{Monitored Reputation}$$

---

## 3. Verification Service Modules

### A. Identity Verification
- **NIN / Tax ID Match**: Verification of National Identification Number (NIN) or Driver’s License against official databases.
- **Biometric Liveness Check**: Selfie matching with liveness detection to prevent identity theft and ghost profiles.

### B. Business Verification
- **CAC Registration Check**: Corporate Affairs Commission (CAC) filing verification for agencies, developers, and car dealerships.
- **Office Physical Audit**: Verification Officers verify physical commercial office addresses in key metro areas (Lagos, Abuja, Port Harcourt).

### C. Video Verification & Buyer Live Walkthrough
- **Video Verification**: Sellers upload continuous 30-second video walkthroughs with timestamp and location tags.
- **Buyer Live Walkthrough**: Live 1-on-1 virtual walkthrough conducted between buyer and seller via Yike platform.

### D. Independent Inspection Network
- **Certified Field Inspectors**: On-demand network of trained property surveyors and automotive technicians.
- **Standardized Inspection Report**: 50-point inspection covering structural integrity, plumbing, electrical, engine condition, chassis integrity, and original VIN match.

### E. Document Verification & Title Search
- **Legal Document Audit**: Verification of Certificate of Occupancy (C of O), Governor’s Consent, Deed of Assignment, or Vehicle Custom Papers.

---

## 4. Trust Score Algorithm & Badge Governance

### Trust Score Formula (0 to 100 Range)

$$\text{Trust Score} = w_1 S_{\text{Identity}} + w_2 S_{\text{Business}} + w_3 S_{\text{Asset}} + w_4 S_{\text{Reputation}} - P_{\text{Risk}}$$

Where:
- $S_{\text{Identity}}$ (25% Weight): Phone (5%), Email (5%), NIN/ID Match (15%).
- $S_{\text{Business}}$ (25% Weight): CAC Filing (15%), Office Physical Audit (10%).
- $S_{\text{Asset}}$ (30% Weight): Verified Listings Ratio (15%), Physical Inspection Pass Rate (15%).
- $S_{\text{Reputation}}$ (20% Weight): Verified Buyer Ratings (10%), Zero Dispute History (10%).
- $P_{\text{Risk}}$ (Penalty Points): Deducted for moderation flags, expired listing violations, or delayed response rates.

### Badge Taxonomy

| Badge Name | Color & Style | Requirement | Visible Location |
|------------|---------------|-------------|------------------|
| **Verified Individual** | Blue Shield | NIN + Phone + Email Verified | Profile & Listing Cards |
| **Verified Business** | Gold Shield | CAC Document + Office Verified | Profile, Search & Listing Headers |
| **Yike Inspected** | Emerald Badge | Physical Field Inspection Passed | Listing Card Hero Image |
| **Legal Verified** | Navy Badge | Title / Registry Audit Complete | Listing Header & Document Drawer |

---

## 5. Dispute Resolution & Inspector Network Governance

1. **Dispute Workflow**:
   - Stage 1: Automated hold on transaction status if reported within 48 hours of inspection.
   - Stage 2: Staff Operations Officer reviews inspection log and buyer/seller communication transcript.
   - Stage 3: Binding resolution within 72 hours.
2. **Inspector Network SLAs**:
   - Inspection Request Assignment: $< 2$ hours.
   - Field Visit Execution: $< 24$ hours.
   - Digital Report Submission: $< 4$ hours post-visit.
