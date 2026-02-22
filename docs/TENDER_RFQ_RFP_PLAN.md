# Tender (RFQ/RFP) System — Implementation Plan

**Scope:** Add a Tender system with **no platform payments**. Buyers and tenants can create tenders; any authenticated user can submit bids. Payments and contracting happen off-platform (direct contact).

**Stack alignment:** Payload CMS collections + tRPC (Next.js 15, MongoDB). Reuse existing roles: `super-admin`, `tenant`, `client` — no new "vendor" role (bidders are any authenticated user).

---

## 1. Data Models

### 1.1 Collection: `tenders`

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `tenderNumber` | text | yes | Auto-generated, e.g. `TND-{timestamp}-{shortId}` (hook on create) |
| `title` | text | yes | Short title |
| `description` | richText (Lexical) | yes | Scope, requirements |
| `type` | select | yes | `rfq` \| `rfp` (Request for Quotation / Request for Proposal) |
| `status` | select | yes | See §5 Tender lifecycle |
| `createdBy` | relationship → users | yes | User who created the tender |
| `tenant` | relationship → tenants | no | Set when created by a tenant (store); null when created by client (buyer) |
| `documents` | upload (relationship to media) or array of uploads | no | Attachments (specs, terms) |
| `responseDeadline` | date | no | Optional deadline for bids |
| `contactPreference` | text | no | e.g. "Email", "Phone", "In-app message" — for off-platform contact |
| `metadata` | group (json) or key-value | no | Optional category/tags for filtering (e.g. product category) |
| `createdAt` / `updatedAt` | date | — | Payload defaults |

**Indexes:** `createdBy`, `tenant`, `status`, `createdAt` (for listing/filters).

---

### 1.2 Collection: `tender-bids` (or `bids`)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `tender` | relationship → tenders | yes | Parent tender |
| `submittedBy` | relationship → users | yes | User (vendor) who submitted the bid |
| `status` | select | yes | `submitted` \| `shortlisted` \| `rejected` \| `withdrawn` |
| `message` | text or richText | no | Cover message / proposal summary |
| `documents` | upload(s) | no | Quote PDF, specs, etc. |
| `amount` | number | no | Optional quoted amount (informational only; no payment) |
| `currency` | text | no | Optional, e.g. from tenant or fixed |
| `validUntil` | date | no | Optional quote validity |
| `createdAt` / `updatedAt` | date | — | Payload defaults |

**Indexes:** `tender`, `submittedBy`, `status`.

**Constraint:** One bid per (tender, submittedBy) — enforce in `beforeValidate` or `beforeChange` (and in tRPC when creating).

---

### 1.3 Reuse

- **Media:** Use existing `media` collection for `tenders.documents` and `tender-bids.documents` (relationship or array of relationships). No new upload collection.
- **Users / Tenants:** No schema changes. "Vendor" = any authenticated user submitting a bid.

---

## 2. API Endpoints (tRPC)

Namespace: **`tenders`** (new router in `src/trpc/routers/_app.ts`).

All procedures below use **`protectedProcedure`** unless noted; optionally add a public `listPublished` with no auth for discovery (if you want public tender list).

| Procedure | Input | Description |
|-----------|--------|-------------|
| `list` | `{ status?, type?, tenantId?, limit, page }` | List tenders; filter by status/type/tenant; caller sees only allowed (own, tenant’s, or public). |
| `getById` | `{ id }` | Single tender by ID; access by createdBy, tenant member, or super-admin. |
| `create` | `{ title, description, type, tenant?, documents?, responseDeadline?, contactPreference?, ... }` | Create tender; set `createdBy` from session; if user has tenant, can set `tenant`. |
| `update` | `{ id, ...patch }` | Update own/tenant’s tender; only in draft/open states (see §5). |
| `updateStatus` | `{ id, status }` | Transition status (e.g. draft → open → closed); enforce lifecycle rules. |
| `listBids` | `{ tenderId }` | List bids for a tender; only tender creator (or tenant member) or super-admin. |
| `getBidById` | `{ id }` | Single bid; bidder (own), tender creator, or super-admin. |
| `submitBid` | `{ tenderId, message?, documents?, amount?, currency?, validUntil? }` | Create bid; `submittedBy` from session; enforce one bid per user per tender. |
| `updateBidStatus` | `{ id, status }` | Shortlist/reject/withdraw; only tender owner or super-admin (withdraw only by bidder). |
| `withdrawBid` | `{ id }` | Set bid status to `withdrawn`; only bidder. |

**Optional:** `listMyTenders`, `listMyBids` for dashboard widgets (convenience wrappers over `list` + `listBids` with filters).

---

## 3. Permissions & Roles

- **super-admin:** Full access to all tenders and bids (read/update/delete); can change any status.
- **tenant (store owner):**
  - Create tenders (with `tenant` set to own store).
  - Read/update/close own tenant’s tenders; list bids; shortlist/reject bids.
  - Submit bids on other users’ tenders (as vendor).
- **client (buyer):**
  - Create tenders (`tenant` = null).
  - Read/update/close own tenders; list bids; shortlist/reject bids.
  - Submit bids on others’ tenders (as vendor).

**Payload `access` (summary):**

- **tenders**
  - **read:** super-admin all; else tenders where `createdBy` = user or user’s tenant = `tenant`.
  - **create:** authenticated (client or tenant).
  - **update/delete:** same as read (optionally restrict delete to draft/cancelled only).
- **tender-bids**
  - **read:** super-admin; or tender’s `createdBy`/tenant owner; or `submittedBy` = user.
  - **create:** authenticated; enforce “one bid per user per tender” in hook or API.
  - **update:** tender owner (status shortlist/reject); bidder (withdraw, or edit only in `submitted`).

No new roles. “Vendor” is a **context** (user submitting a bid), not a role.

---

## 4. UI Pages / Components

- **Routes (suggested):**
  - `/tenders` — List tenders (tabs: All / My tenders / Open for bids).
  - `/tenders/new` — Create tender (form: title, type, description, documents, deadline, contact preference).
  - `/tenders/[id]` — Tender detail (view + actions: edit if draft/open, close, view bids).
  - `/tenders/[id]/bids` — List bids for tender (tender owner); shortlist/reject actions.
  - `/tenders/[id]/bid` — Submit bid (form: message, documents, optional amount/validUntil).
  - `/my-bids` (or under `/tenders?tab=my-bids`) — User’s submitted bids with status and link to tender.

- **Components (minimal set):**
  - `TenderCard` — Summary for list (title, type, status, deadline, creator/tenant).
  - `TenderForm` — Create/edit (reuse form patterns from products/orders).
  - `TenderDetail` — Full view + status badge + document list + “Submit bid” / “View bids” CTA.
  - `BidForm` — Submit/edit bid (message, uploads, optional amount).
  - `BidList` / `BidRow` — Table or list of bids with status and actions (shortlist/reject/withdraw).
  - `TenderStatusBadge` — Map status to label/color (align with §5).

- **Navigation:** Add “Tenders” to main nav (and optionally to tenant dashboard and buyer dashboard).

---

## 5. Tender Lifecycle States

Suggested **tender** status flow:

| Status | Description | Allowed next |
|--------|-------------|--------------|
| `draft` | Not visible to bidders; editable | `open`, `cancelled` |
| `open` | Visible; accepts bids | `closed`, `cancelled` |
| `closed` | No new bids; evaluation only | — (optional: `awarded` if you track winner later) |
| `cancelled` | Tender abandoned | — |

Optional: `awarded` (winner chosen; still no payment on platform).

**Bid** statuses:

| Status | Description |
|--------|-------------|
| `submitted` | New bid |
| `shortlisted` | Tender owner shortlisted |
| `rejected` | Tender owner rejected |
| `withdrawn` | Bidder withdrew |

No “accepted/winner” payment flow — only shortlist/reject; contact happens off-platform.

---

## 6. What NOT to Implement

- **Payments:** No payment collection, no gateway, no “pay now” for tenders/bids.
- **Escrow:** No escrow or hold of funds.
- **Invoicing:** No invoice generation or payment tracking on-platform.
- **Contract signing:** No e-sign or contract workflow; only “contact preference” and documents for reference.
- **Vendor role:** No new role; bidders are existing users (client or tenant).
- **Automated awards:** No automatic “award to lowest bid” or payment trigger; selection is manual, contact off-platform.

---

## 7. Implementation Order (Minimal)

1. **Collections:** Add `Tenders` and `TenderBids` in Payload; register in `payload.config.ts`; add access and `tenderNumber` hook.
2. **tRPC:** Add `tenders` router with procedures above; enforce one-bid-per-user in `submitBid` and status transitions in `updateStatus` / `updateBidStatus`.
3. **Permissions:** Implement Payload `access` for tenders and tender-bids as in §3.
4. **UI:** List → Detail → Create tender → Submit bid → List bids + shortlist/reject (and withdraw). Reuse existing layout, forms, and media upload patterns.

This keeps the feature minimal, aligned with the existing multitenant e-commerce stack, and explicitly excludes payments, escrow, and invoicing.
