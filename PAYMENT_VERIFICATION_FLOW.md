# Payment Verification & Order Delivery Flow

## Complete System Overview

This document explains the entire payment verification, order creation, and delivery confirmation process in the ToolBoxx e-commerce platform.

---

## 🔄 Complete Flow Diagram

```
Customer Checkout → Payment → Verification → Order Creation → Fulfillment → Delivery → Confirmation → Completion
```

---

## 📋 Detailed Step-by-Step Process

### 1. **Customer Checkout & Payment** (Customer-side)

**Location**: `/checkout` page (Next.js)

**What happens**:
- Customer adds products to cart
- Fills in shipping address
- Clicks "Checkout"
- System creates a **Transaction** with status: `pending`
- Customer receives MTN MoMo payment instructions

**Transaction Fields Created**:
```typescript
{
  id: "auto-generated",
  paymentReference: "PAY-12345678-ABCD",
  status: "pending",
  customer: userId,
  customerName: "John Doe",
  customerPhone: "+250788123456",
  totalAmount: 100000,
  products: [...],
  shippingAddress: {...},
  expiresAt: "24 hours from now",
  tenant: tenantId
}
```

---

### 2. **Customer Submits MTN Transaction ID** (Customer-side)

**Location**: `/checkout/status/[transactionId]` page (Next.js)

**What happens**:
- Customer makes payment via MTN Mobile Money
- Customer enters the MTN Transaction ID they received
- Clicks "Submit Transaction ID"
- Transaction status changes: `pending` → `awaiting_verification`

**Code**: `transactions.submitTransactionId` procedure

**Transaction Updated**:
```typescript
{
  status: "awaiting_verification",
  mtnTransactionId: "MP241123.1234.A12345"  // Added by customer
}
```

---

### 3. **Seller Verifies Payment** (Seller-side - Next.js)

**Location**: `/verify-payments` page (Next.js) - **"Verify Payments" tab**

**Who can access**: Only verified tenants (sellers)

**What seller sees**:
- List of all transactions awaiting verification
- MTN Transaction ID prominently displayed
- Customer details (name, phone, address)
- Products ordered
- Total amount to be received
- Grid/List view toggle for better organization

**What seller must do**:
1. Check their **MTN MoMo account/dashboard**
2. Verify the MTN Transaction ID exists and matches
3. Verify the amount received matches the total
4. Click **"Approve Payment"** or **"Reject Payment"**

**Grid View**: 2 columns on desktop, 1 on mobile
**List View**: Full-width cards, better for mobile

---

### 4. **Payment Approval Process** (Automated)

**What happens when seller clicks "Approve Payment"**:

**Code**: `transactions.verifyTransaction` procedure

**Step-by-step automatic actions**:

1. **Transaction updated**:
   ```typescript
   {
     status: "verified",
     verifiedAt: "2024-11-23T15:30:00Z",
     verifiedBy: sellerUserId
   }
   ```

2. **Orders created** (one per product):
   ```typescript
   {
     orderNumber: "ORD-04558089-ZU2L",
     status: "pending",
     user: customerId,
     product: productId,
     products: [{product, quantity, priceAtPurchase}],
     totalAmount: 100000,
     transaction: transactionId,
     transactionId: "MP241123.1234.A12345",
     paymentMethod: "mobile_money"
   }
   ```

3. **Sales records auto-created** (via Order `afterChange` hook):
   ```typescript
   {
     saleNumber: "SALE-04560051-7S7B",
     tenant: tenantId,
     product: productId,
     order: orderId,
     customer: customerId,
     customerName: "John Doe",
     status: "pending",
     totalAmount: 100000,
     platformFee: 0,          // No platform fees!
     netAmount: 100000        // Seller receives 100%
   }
   ```

4. **Customer notified** (via toast/UI):
   - "Payment verified! Your order is being processed."

5. **Seller sees** (in Sales Dashboard):
   - New sale appears in "My Sales" tab
   - Ready for fulfillment

---

### 5. **Order Fulfillment** (Seller-side)

**Location**: `/dashboard/my-sales` page (Next.js) - **"My Sales" tab**

**Status Flow**:
```
pending → shipped → delivered → completed
```

**Seller Actions**:

1. **View Sale Details**:
   - Product image displayed (fixed with depth: 2)
   - Customer information
   - Shipping address
   - Grid/List view toggle

2. **Update Status** (via Payload CMS Admin):
   - Mark as `shipped` when package sent
   - Mark as `delivered` when package arrives
   - System auto-syncs status to Order and Sale

3. **Message Customer**:
   - "Message Customer" button in both grid and list views
   - Opens chat conversation
   - Can provide tracking info, updates, etc.

---

### 6. **Customer Receives Order** (Customer-side)

**Location**: `/orders` page (Next.js) - **"My Orders" tab**

**Customer Views**:
- Order number
- Product name (now shows correctly, not "Unknown Product")
- Order status with timeline
- Shipping address
- Total amount paid

**Status Display**:
```
✓ Order Placed    - Nov 23, 15:29
✓ Shipped         - Nov 24, 10:00
✓ Delivered       - Nov 25, 14:30
○ Receipt Confirmed - (pending)
```

---

### 7. **Customer Confirms Receipt** (Customer-side)

**When**: Order status is `delivered`

**What customer sees**:
- "Confirm Receipt" button appears
- Prompt: "Have you received your order?"

**What happens when clicked**:

**Code**: `orders.confirmReceipt` procedure

**Automatic updates**:
1. Order updated:
   ```typescript
   {
     status: "completed",
     received: true,
     updatedAt: timestamp
   }
   ```

2. Sale auto-synced (via hook):
   ```typescript
   {
     status: "completed"
   }
   ```

3. **Transaction complete** ✅

---

## 🔐 Access Control & Security

### Who Can Do What:

| Action | Customer | Seller (Tenant) | Super Admin |
|--------|----------|-----------------|-------------|
| Submit MTN TX ID | ✅ Own transactions | ❌ | ✅ |
| Verify Payment | ❌ | ✅ Own transactions | ✅ |
| View Orders | ✅ Own orders | ❌ | ✅ |
| View Sales | ❌ | ✅ Own sales | ✅ |
| Update Order Status | ❌ | ✅ Own products | ✅ |
| Confirm Receipt | ✅ Own orders | ❌ | ✅ |
| Edit Transaction ID | ❌ | ❌ (Read-only) | ✅ |

### Security Features:

1. **Read-Only Transaction ID**: Sellers can see but not edit MTN Transaction ID
2. **Tenant Verification**: Only verified tenants can access verification page
3. **Ownership Checks**: All procedures verify tenant/customer ownership
4. **Expiry System**: Transactions expire after 24 hours if not submitted
5. **No Platform Fees**: Sellers receive 100% of payment (platformFee = 0)

---

## 📊 Database Collections & Relationships

### Collections Involved:

1. **Transactions** - Payment submissions
2. **Orders** - Customer fulfillment tracking
3. **Sales** - Seller revenue tracking
4. **Products** - Items being sold
5. **Users** - Customers and sellers
6. **Tenants** - Seller accounts
7. **Conversations** - Customer-seller messaging

### Relationships:

```
Transaction → Orders (1:many)
Order → Sale (1:1, auto-created)
Order → Product (many:1)
Sale → Product (many:1)
Sale → Tenant (many:1)
Order → User/Customer (many:1)
```

---

## 🎯 Key Features Summary

### ✅ What Works Now:

1. **Payment Verification** (Next.js "Verify Payments" tab):
   - ✅ Grid/List view toggle
   - ✅ List default on mobile, Grid on desktop
   - ✅ MTN Transaction ID prominently displayed
   - ✅ Customer details visible
   - ✅ Product list with quantities
   - ✅ Approve/Reject with confirmation dialogs
   - ✅ Auto-refresh every 30 seconds
   - ✅ Creates Orders & Sales automatically

2. **Sales Management** (Next.js "My Sales" tab):
   - ✅ Grid/List view toggle
   - ✅ Product images displayed (depth: 2)
   - ✅ Status badges
   - ✅ Message Customer button
   - ✅ No platform fees (100% to seller)

3. **Order Tracking** (Customer "My Orders" tab):
   - ✅ Product names show correctly
   - ✅ Status timeline
   - ✅ Confirm receipt functionality
   - ✅ Message Seller button
   - ✅ Shipping address display

4. **Auto-Sync System**:
   - ✅ Order status changes sync to Sales
   - ✅ Sales auto-created when Orders created
   - ✅ Customer receipt confirmation updates both

---

## 🔄 Status Synchronization

### Order Status Changes Trigger:

```javascript
// In Orders collection afterChange hook:
Order status changes → Automatically updates Sale status
```

### Supported Statuses:
- `pending` - Payment verified, awaiting shipment
- `shipped` - Package sent to customer
- `delivered` - Package arrived
- `completed` - Customer confirmed receipt
- `refunded` - Payment refunded
- `cancelled` - Order cancelled

All status changes sync in real-time between Orders and Sales collections.

---

## 💡 For Sellers (Quick Reference)

### Daily Workflow:

1. **Check "Verify Payments" tab**
   - Review pending transactions
   - Verify MTN Transaction IDs
   - Approve valid payments

2. **Check "My Sales" tab**
   - See new sales (auto-created from approved payments)
   - View product images and customer details
   - Message customers if needed

3. **Update Order Status** (in Payload Admin)
   - Mark as shipped when sent
   - Mark as delivered when arrived

4. **Wait for Customer Confirmation**
   - Customer confirms receipt
   - Status auto-updates to "completed"

---

## 💡 For Customers (Quick Reference)

### Purchase Workflow:

1. **Shop & Checkout**
   - Browse products
   - Add to cart
   - Enter shipping address
   - Receive payment instructions

2. **Pay via MTN MoMo**
   - Use provided phone number
   - Make payment
   - Get MTN Transaction ID

3. **Submit Transaction ID**
   - Enter MTN TX ID on checkout status page
   - Wait for seller verification

4. **Track Your Order**
   - View in "My Orders" tab
   - See status updates
   - Message seller if needed

5. **Confirm Receipt**
   - Click "Confirm Receipt" when delivered
   - Order marked as complete

---

## 🎨 UI/UX Features

### Grid View (Default on Desktop):
- 2 columns for transactions (desktop)
- 3 columns for sales (desktop)
- Square product images
- Compact card layout

### List View (Default on Mobile):
- Full-width cards
- Horizontal layout with image on left
- More detailed information visible
- Better for scrolling on phones

### Responsive Design:
- Mobile: List view recommended
- Tablet: Either view works
- Desktop: Grid view recommended
- Toggle persists during session

---

## 🔧 Technical Implementation Files

### Key Files:

1. **Transaction Verification**:
   - `/src/modules/transactions/ui/views/tenant-transactions-view.tsx`
   - `/src/modules/transactions/ui/components/transaction-verification-card.tsx`
   - `/src/modules/transactions/server/procedures.ts`

2. **Sales Management**:
   - `/src/modules/sales/ui/components/my-sales-list.tsx`
   - `/src/modules/sales/server/procedures.ts`

3. **Order Tracking**:
   - `/src/modules/orders/ui/views/orders-view.tsx`
   - `/src/components/orders/OrderCard.tsx`
   - `/src/modules/orders/server/procedures.ts`

4. **Collections**:
   - `/src/collections/Transactions.ts`
   - `/src/collections/Orders.ts`
   - `/src/collections/Sales.ts`

---

## 🎉 Summary

The entire flow is **fully automated** once the seller approves payment:

1. Customer pays → Submits TX ID
2. Seller verifies → Clicks "Approve"
3. System auto-creates → Orders + Sales
4. Seller ships → Updates status
5. Customer receives → Confirms receipt
6. Everyone happy! 🎊

**No manual order creation needed!**
**No platform fees charged!**
**Everything syncs automatically!**
