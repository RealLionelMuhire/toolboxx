# Client (Buyer) Role Implementation

## Overview
This document describes the implementation of a dedicated **client (buyer)** role for users who only want to purchase products, without the ability to sell or access the PayloadCMS admin panel.

## Changes Made

### 1. **User Collection Updates** (`src/collections/Users.ts`)

#### Admin Panel Access Restriction
```typescript
admin: {
  useAsTitle: 'email',
  hidden: ({ user }) => {
    // Only super-admin and tenant users can access PayloadCMS admin
    // Client (buyer) users should not see or access the admin panel
    if (isSuperAdmin(user)) return false;
    if (user?.roles?.includes('tenant')) return false;
    return true; // Hide from clients and non-authenticated users
  },
}
```

#### Tenant Field Conditional Display
```typescript
{
  name: "tenants",
  type: "array",
  admin: {
    position: "sidebar",
    condition: (data) => {
      // Only show tenants field for super-admin and tenant users
      // Hide for client users
      return !data.roles || !data.roles.includes('client');
    },
  },
  // ... rest of config
}
```

#### Verification Section Conditional Display
```typescript
{
  name: "verificationSection",
  type: "ui",
  admin: {
    components: {
      Field: '@/components/admin/AccountVerificationSection',
    },
    condition: (data) => {
      // Only show for tenant users who need verification
      // Hide for clients and super-admins
      return data.roles?.includes('tenant') && !data.roles?.includes('super-admin');
    },
  },
}
```

---

### 2. **Middleware Access Control** (`src/middleware.ts` & `src/middleware-payload-access.ts`)

#### New Middleware Function
Created `checkPayloadAdminAccess()` to block client users from accessing `/admin` routes:

```typescript
export async function checkPayloadAdminAccess(req: NextRequest): Promise<NextResponse | null> {
  // Only check /admin routes
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return null;
  }

  // Get the payload auth cookie
  const cookiePrefix = process.env.PAYLOAD_COOKIE_PREFIX || 'payload';
  const authCookie = req.cookies.get(`${cookiePrefix}-token`);

  if (!authCookie) {
    return null; // Let Payload handle login redirect
  }

  // Decode JWT to check user roles (without full verification)
  // Real auth verification happens server-side in Payload
  const token = authCookie.value;
  const parts = token.split('.');
  
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  const payloadData = JSON.parse(
    Buffer.from(parts[1], 'base64').toString('utf-8')
  );

  const userRoles = payloadData.roles || [];
  
  // Allow super-admin and tenant users
  if (userRoles.includes('super-admin') || userRoles.includes('tenant')) {
    return null;
  }

  // Block client users from accessing admin
  if (userRoles.includes('client')) {
    return NextResponse.redirect(new URL('/my-account?error=access_denied', req.url));
  }

  return null;
}
```

**Key Implementation Details:**
- ✅ Runs in Next.js Edge Runtime (no Node.js dependencies)
- ✅ Decodes JWT cookie to extract user roles
- ✅ Does not verify JWT signature (that's done server-side by Payload)
- ✅ Lightweight and fast - just role checking
- ✅ Compatible with Next.js middleware constraints

#### Updated Main Middleware
```typescript
// Check PayloadCMS admin access for client users
const adminAccessCheck = await checkPayloadAdminAccess(req);
if (adminAccessCheck) {
  return adminAccessCheck;
}
```

---

### 3. **Dashboard View Updates** (`src/modules/dashboard/ui/views/dashboard-view.tsx`)

#### Account Settings Section
Updated to show different UI based on user role:

```typescript
{/* Only show admin link for tenants and super-admins, not for clients */}
{session?.user?.roles?.includes('tenant') || session?.user?.roles?.includes('super-admin') ? (
  <Button className="w-full" variant="outline" asChild>
    <Link href="/admin">
      <Settings className="h-4 w-4 mr-2" />
      Account Settings
    </Link>
  </Button>
) : (
  <div className="space-y-3 p-4 bg-muted rounded-md">
    <div className="flex items-start gap-2">
      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">Profile Information</p>
        <p className="text-xs text-muted-foreground mt-1">
          {session?.user?.email || 'Not available'}
        </p>
        {session?.user?.username && (
          <p className="text-xs text-muted-foreground">
            Username: {session.user.username}
          </p>
        )}
      </div>
    </div>
    <p className="text-xs text-muted-foreground">
      Your account is set up as a buyer. Contact support to update your profile.
    </p>
  </div>
)}
```

---

### 4. **Client Registration Schema** (`src/modules/auth/schemas-client.ts`)

Created a simplified registration schema for client (buyer) users:

```typescript
export const registerClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Username can only contain lowercase letters, numbers and hyphens"
    )
    .transform((val) => val.toLowerCase()),
  
  // Optional: client-specific fields
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  phone: z.string().regex(/^(?:\+?25)?[0-9]{9,10}$/, "Invalid phone number format").optional(),
});
```

**Key Differences from Tenant Registration:**
- ❌ No TIN Number
- ❌ No Store Manager ID
- ❌ No Payment Method
- ❌ No Bank/MoMo details
- ✅ Simple username, email, password
- ✅ Optional: firstName, lastName, phone

---

### 5. **Client Registration Procedure** (`src/modules/auth/server/procedures.ts`)

Added `registerClient` mutation:

```typescript
/**
 * Register a new client (buyer) account
 * No business information required - just basic account details
 */
registerClient: baseProcedure
  .input(registerClientSchema)
  .mutation(async ({ input, ctx }) => {
    // Check for existing user
    const existingData = await ctx.db.find({
      collection: "users",
      limit: 1,
      where: {
        or: [
          { username: { equals: input.username } },
          { email: { equals: input.email } },
        ],
      },
    });

    // Validate uniqueness
    // ...

    // Create client user (buyer) - no tenant association needed
    await ctx.db.create({
      collection: "users",
      data: {
        email: input.email,
        username: input.username,
        password: input.password,
        roles: ["client"], // Explicitly set client role
        tenants: [], // Client users don't have tenants
      },
    });

    // Auto-login after registration
    // ...
  }),
```

---

## User Role Comparison

| Feature | Super Admin | Tenant (Seller) | Client (Buyer) |
|---------|------------|-----------------|----------------|
| **Access PayloadCMS Admin** | ✅ Yes | ✅ Yes | ❌ No |
| **Create/Sell Products** | ✅ Yes | ✅ Yes (after verification) | ❌ No |
| **Browse Products** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Make Purchases** | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Orders** | ✅ All orders | ✅ Own orders | ✅ Own orders |
| **Tenant Association** | ✅ Optional | ✅ Required | ❌ None |
| **Verification Required** | ❌ No | ✅ Yes (RDB, documents) | ❌ No |
| **Business Information** | ❌ Not required | ✅ Required (TIN, etc.) | ❌ Not required |
| **Navbar Access** | All links | Tenant-specific | Customer-specific |

---

## Client User Journey

### Registration
1. User goes to `/sign-up` (can create separate `/sign-up/buyer` route)
2. Fills simple form (username, email, password)
3. Submits → creates user with `roles: ["client"]`
4. Auto-logged in
5. Redirected to home page

### Login
1. User logs in at `/sign-in`
2. System detects `client` role
3. Navbar shows: Home, My Account, My Orders, About, Contact

### Using the Platform
1. **Browse Products**: Can view all products
2. **Make Purchases**: Add to cart, checkout normally
3. **View Orders**: See their order history at `/orders`
4. **My Account** (`/my-account`):
   - Shows profile information
   - Shows order statistics
   - **No "Account Settings" link to admin**
   - Shows inline profile info instead

### Blocked Actions
- ❌ Cannot access `/admin` (redirected to `/my-account?error=access_denied`)
- ❌ Cannot create products
- ❌ Cannot manage tenants
- ❌ Cannot see verification UI
- ❌ Cannot access seller features

---

## Navbar Configuration

### Client (Buyer) Navbar Items
Already configured in `src/modules/home/ui/components/navbar.tsx`:

```typescript
const customerNavbarItems = [
  { href: "/", children: "Home" },
  { href: "/my-account", children: "My Account" },
  { href: "/orders", children: "My Orders" },
  { href: "/about", children: "About" },
  { href: "/contact", children: "Contact" },
];
```

This is automatically shown when user has `client` role (or any role that's not `tenant`).

---

## Testing Checklist

### ✅ Client User Registration
- [ ] Register new client account (use `registerClient` mutation)
- [ ] Verify user is created with `roles: ["client"]`
- [ ] Verify no tenant association
- [ ] Verify auto-login works

### ✅ Client User Login
- [ ] Login as client user
- [ ] Verify navbar shows: Home, My Account, My Orders, About, Contact
- [ ] Verify **no** Dashboard or My Products links

### ✅ Access Control
- [ ] Try accessing `/admin` as client → should redirect to `/my-account?error=access_denied`
- [ ] Try accessing `/dashboard` as client → should not be visible
- [ ] Verify PayloadCMS admin panel is not accessible

### ✅ My Account Page
- [ ] Visit `/my-account` as client
- [ ] Verify "Account Settings" button is **NOT** shown
- [ ] Verify inline profile information is displayed instead
- [ ] Verify order statistics are shown
- [ ] Verify recent orders are displayed

### ✅ Shopping Features
- [ ] Browse products
- [ ] Add to cart
- [ ] Checkout
- [ ] View order history at `/orders`

---

## Database Migration

### For Existing Users

If you have existing users who should be clients, run this script:

```javascript
// Convert existing users without tenants to client role
db.users.updateMany(
  { 
    roles: { $in: ["tenant"] },
    $or: [
      { tenants: { $exists: false } },
      { tenants: { $size: 0 } }
    ]
  },
  { 
    $set: { roles: ["client"] }
  }
);
```

---

## Next Steps (Optional Enhancements)

### 1. Separate Sign-Up Pages
Create dedicated routes:
- `/sign-up/seller` - For tenants (existing form)
- `/sign-up/buyer` - For clients (simplified form)
- `/sign-up` - Landing page to choose

### 2. Client Profile Page
Create a dedicated profile page for clients:
- Edit username, email
- Update password
- Manage shipping addresses
- Set notification preferences

### 3. Client Dashboard Enhancement
Add buyer-specific features:
- Wishlist
- Saved addresses
- Order tracking
- Review history
- Loyalty points

### 4. Email Verification
Add email verification for client accounts (optional)

### 5. Social Login
Allow clients to register/login with Google, Facebook, etc.

---

## Files Modified

### Core Changes
- ✅ `src/collections/Users.ts` - User collection updates
- ✅ `src/middleware.ts` - Added admin access check
- ✅ `src/modules/dashboard/ui/views/dashboard-view.tsx` - UI updates
- ✅ `src/modules/auth/server/procedures.ts` - Added registerClient mutation

### New Files
- ✅ `src/middleware-payload-access.ts` - Admin access middleware
- ✅ `src/modules/auth/schemas-client.ts` - Client registration schema
- ✅ `CLIENT_BUYER_ROLE_IMPLEMENTATION.md` - This documentation

---

## Environment Variables

No new environment variables required. All changes are code-based.

---

## Security Considerations

1. ✅ **Middleware-level protection** - Blocks client users before they reach admin routes
2. ✅ **Collection-level access control** - PayloadCMS admin hidden for clients
3. ✅ **UI-level protection** - No admin links shown to clients
4. ✅ **Field-level protection** - Tenant and verification fields hidden for clients

---

## Rollback Instructions

If you need to revert these changes:

```bash
# 1. Revert Git commits
git revert HEAD~5..HEAD  # Adjust number based on commits

# 2. Or manually restore files
git checkout main -- src/collections/Users.ts
git checkout main -- src/middleware.ts
git checkout main -- src/modules/dashboard/ui/views/dashboard-view.tsx
git checkout main -- src/modules/auth/server/procedures.ts

# 3. Delete new files
rm src/middleware-payload-access.ts
rm src/modules/auth/schemas-client.ts
rm CLIENT_BUYER_ROLE_IMPLEMENTATION.md
```

---

## Support

For questions or issues:
1. Check this documentation
2. Review the code comments
3. Test with the checklist above
4. Contact the development team

---

**Last Updated**: November 9, 2025  
**Author**: AI Development Team  
**Version**: 1.0.0
