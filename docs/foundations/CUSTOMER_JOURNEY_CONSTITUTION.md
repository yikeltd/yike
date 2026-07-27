# Document 02 — Customer Journey Constitution

**Authority Level:** Highest Journey Authority  
**Governance Scope:** Product Flows, UX Routes, Lead Gateways, Trust Checkpoints  
**Status:** Frozen Baseline (Yike V2 Phase 0)  

---

## 1. Executive Summary & Canonical Flow

The customer journey on Yike is strictly defined. Every buyer, seller, agent, and tenant moves through eight linear, well-governed stages:

$$\text{Discover} \longrightarrow \text{Message} \longrightarrow \text{Connect} \longrightarrow \text{Trust} \longrightarrow \text{Inspect (Optional)} \longrightarrow \text{Meet} \longrightarrow \text{Deal} \longrightarrow \text{Review}$$

---

## 2. Stage Breakdown

### Stage 1: Discover

- **Purpose**: Enable buyers to find high-quality properties and vehicles quickly using location, intent, price, and category parameters.
- **User Mindset**: *"I am searching for a genuine option in my target location without being misled by fake photos or old prices."*
- **Platform Responsibility**: Present structured, clean listing cards with accurate location tags, verified pricing, high-resolution media, and instant filter responses.
- **Trust Opportunity**: Surface verification badges (`Verified Agent`, `Verified Business`, `Inspection Available`) directly on listing cards.
- **Revenue Opportunity**: Featured Listings, Category Boosts, Location Sponsorships.
- **Future Expansion**: AI-powered conversational search and automated market price matching.
- **Rules**:
  1. Unverified or expired listings MUST NOT appear in top organic discovery views.
  2. Pricing must be transparent with zero hidden mandatory fees.

---

### Stage 2: Message

- **Purpose**: Allow the buyer to initiate inquiry or request additional information regarding a specific asset.
- **User Mindset**: *"Is this property/vehicle still available? Is the price negotiable? Can I speak with the agent?"*
- **Platform Responsibility**: Capture inquiry intent, record lead attribution, and route the message via direct WhatsApp link or platform messaging.
- **Trust Opportunity**: Display seller response rate, typical response time, and identity verification level prior to message dispatch.
- **Revenue Opportunity**: Lead Insights Subscription, Premium Lead Delivery notifications for sellers.
- **Future Expansion**: Automated seller availability bot and instant brochure download.
- **Rules**:
  1. Buyer details are captured accurately before redirecting to WhatsApp.
  2. Every message creates a trackable lead record in seller management.

---

### Stage 3: Connect

- **Purpose**: Establish direct communication between buyer and seller to align on availability, requirements, and next steps.
- **User Mindset**: *"I want to confirm the seller is real, professional, and responsive before spending time visiting."*
- **Platform Responsibility**: Provide multi-channel communication options (WhatsApp, Direct Voice Call, Scheduled Callback).
- **Trust Opportunity**: Verification check of seller contact credentials; warning triggers if contact info changes abruptly.
- **Revenue Opportunity**: Dedicated Virtual Call Routing, Priority Seller Connect slots.
- **Future Expansion**: Integrated In-App Voice Calls with call quality monitoring and recording consent.
- **Rules**:
  1. All contact actions log an interaction event for safety auditing.
  2. Unverified agents must complete phone verification before receiving direct calls.

---

### Stage 4: Trust

- **Purpose**: Validate asset title, physical state, and seller authorization before any monetary commitment.
- **User Mindset**: *"How do I know this property has a clean title, or this car has a good engine?"*
- **Platform Responsibility**: Display complete trust breakdown (NIN verification, CAC company registration, verified location, past reviews).
- **Trust Opportunity**: Offer 1-click order triggers for official Property Verification / Title Search and Field Inspection.
- **Revenue Opportunity**: Paid Title Search, Paid Vehicle History Check, Paid Legal Verification.
- **Future Expansion**: Blockchain title registry integration and instant collateral verification.
- **Rules**:
  1. Sellers cannot falsify verification badges.
  2. Verification statuses must update in real time when modified by staff.

---

### Stage 5: Inspect (Optional)

- **Purpose**: Perform physical site inspection or virtual live walkthrough of the asset.
- **User Mindset**: *"I need to physically see the building/car, or have an independent certified professional inspect it for me."*
- **Platform Responsibility**: Schedule physical inspection appointments or assign a certified Yike Field Inspector.
- **Trust Opportunity**: Detailed Inspection Report generation with timestamped photos, video proof, and structural/mechanical grading.
- **Revenue Opportunity**: Independent Inspection Fees, Express 24-Hour Inspection Service.
- **Future Expansion**: Interactive Live 360 Video Walkthroughs guided by certified inspectors.
- **Rules**:
  1. Inspection reports are immutable once uploaded by certified inspectors.
  2. Inspection status must be linked directly to the listing detail view.

---

### Stage 6: Meet

- **Purpose**: Facilitate safe, structured in-person meeting between buyer, seller, and legal representative.
- **User Mindset**: *"I am meeting the seller to finalize terms and review physical documents."*
- **Platform Responsibility**: Provide meeting safety guidelines, recommended meeting protocols, and verified location confirmation.
- **Trust Opportunity**: Buyer Assistance notification; safety check-in prompts on mobile app.
- **Revenue Opportunity**: Escrow Deposit Service, Legal Assistance Fee.
- **Future Expansion**: Verified Meeting Location Network (partnered bank hubs / legal chambers).
- **Rules**:
  1. Platform provides safety alerts for high-value cash transactions.

---

### Stage 7: Deal

- **Purpose**: Finalize transaction agreement, payment execution, and asset handover.
- **User Mindset**: *"I am making payment and taking legal ownership of the property/vehicle."*
- **Platform Responsibility**: Record transaction outcome, issue digital proof of transaction agreement, and update listing status to `Sold` or `Rented`.
- **Trust Opportunity**: Verified Payment Gateway integration and document storage.
- **Revenue Opportunity**: Transaction Commission / Closing Fee, Escrow Service Fee.
- **Future Expansion**: Digital Contract Signing and Automated Title Transfer.
- **Rules**:
  1. Listing must be updated to `Sold` or `Rented` immediately upon deal confirmation to prevent phantom inventory.

---

### Stage 8: Review

- **Purpose**: Capture mutual feedback between buyer and seller to strengthen platform reputation metrics.
- **User Mindset**: *"I want to rate my experience with this seller to help future buyers."*
- **Platform Responsibility**: Prompt buyer and seller for rating (1–5 stars), detailed feedback, and verified deal badge.
- **Trust Opportunity**: Verified Buyer Reviews displayed permanently on seller profile and future listings.
- **Revenue Opportunity**: Seller Reputation Analytics, Showcase Verified Reviews in Marketing.
- **Future Expansion**: AI sentiment analysis for automated seller trust score updates.
- **Rules**:
  1. Only buyers who initiated a lead/connect flow can submit verified reviews.
  2. Fake or paid reviews result in permanent trust badge revocation.
