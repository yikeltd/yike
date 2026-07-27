# Document 06 — UX Constitution

**Authority Level:** Highest Design & User Experience Authority  
**Governance Scope:** Design System (YDS), Layouts, Typography, Component Hierarchy, Micro-Animations, Mobile & Desktop Principles  
**Status:** Frozen Baseline (Yike V2 Phase 0)  

---

## 1. UX Mission & Design Mindset

Yike’s user interface is engineered to evoke calm, confidence, and absolute clarity. Buying or renting real estate and purchasing vehicles are among the largest financial decisions in a user's life. The interface must communicate luxury and precision through radical simplicity (Apple / Stripe / Linear design benchmark).

### Core UX Principles:
1. **Always Answer "What Should I Do Next?"**: No screen should leave a user confused about their immediate action.
2. **Trust-First UX**: Verification indicators, safety tips, and seller credibility metrics are seamlessly integrated into every component level.
3. **Progressive Disclosure**: Surface essential information first; reveal secondary details only when intent is expressed.
4. **Zero Noise**: Eliminate unnecessary borders, excessive text blocks, conflicting badges, and competing primary buttons.

---

## 2. Visual Architecture & Design System (YDS)

### A. Color Palette
- **Primary Navy (`#031B4E`)**: Represents trust, structural permanence, authority, and financial safety. Used for headings, primary text, and top headers.
- **Accent Gold (`#E4B547`)**: Represents luxury, premium verification, primary actions, and highlight states. Used for primary CTAs and gold verification badges.
- **Emerald Green (`#10B981`)**: Represents verified status, successful operations, and active availability.
- **Surface & Whitespace (`#F8FAFC` to `#FFFFFF`)**: Generous background padding to give UI elements breathing room.

### B. Typography Hierarchy
- **Primary Sans Font**: Modern font stack (Inter / Outfit / System Sans).
- **H1 Heading**: 28px – 36px, Bold, Navy (`#031B4E`), Tracking Tight (`-0.02em`).
- **H2 Heading**: 20px – 24px, Bold, Navy (`#031B4E`).
- **H3 Section Title**: 16px – 18px, Semi-Bold, Navy.
- **Body Text**: 14px – 15px, Regular/Medium, High Contrast Navy (`#031B4E` / 85%).
- **Caption & Meta**: 12px – 13px, Medium, Muted (`#64748B`).

### C. Spacing & Card System
- **Spacing Grid**: Strict 4px / 8px / 16px / 24px / 32px / 48px spatial system.
- **Border Radius**: Consistent `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inputs/buttons, `rounded-full` for badges/pills.
- **Card Styling**: Clean white backgrounds (`#FFFFFF`) with subtle 1px border (`border-navy/10`) and soft, natural shadows (`shadow-sm hover:shadow-md`). Avoid harsh outlines.

---

## 3. Component & Interactive Hierarchy

### A. Button Hierarchy
1. **Primary Action**: Solid Gold (`bg-gold text-navy font-bold rounded-full hover:bg-gold-light`). Maximum ONE primary button per viewport focus area.
2. **Secondary Action**: Solid Navy (`bg-navy text-white font-bold rounded-full hover:bg-navy/90`).
3. **Tertiary Action**: Soft Ghost Button (`bg-navy/5 text-navy font-bold rounded-full hover:bg-navy/10`).
4. **Destructive Action**: Muted Red (`bg-danger/10 text-danger font-bold rounded-full`).

### B. Motion, Animations & Skeletons
- **Transitions**: Smooth 200ms cubic-bezier transitions (`transition-all duration-200 ease-out`).
- **Micro-Animations**: Subtle press states (`active:scale-[0.98]`), hover lifts (`hover:-translate-y-0.5`).
- **Loading States**: Shimmer skeleton screens that match the exact component geometry. Never use raw spinners for page-level loading.

### C. Forms & Input UX
- **Input Fields**: Floating label / clean border fields with clear focus rings (`ring-2 ring-gold/40`).
- **Validation**: Inline, real-time field validation with helpful error messages. Never show generic failure alerts.

---

## 4. Mobile vs Desktop Responsiveness Philosophy

- **Mobile First Focus**: Single-column layout on mobile with thumb-friendly bottom sheets, floating bottom CTAs, and responsive touch targets ($minimum 44\times 44\text{px}$).
- **Desktop Grid Expansion**: Multi-column layouts utilizing sticky sidebar summaries, expanded inspection details, and split-screen preview drawers.
- **No Layout Shift (CLS = 0)**: Pre-allocated dimensions for images, maps, and dynamic lead forms to eliminate visual shifts during page load.
