# Production Database Seeding Guide

## Overview
This guide explains how to seed the production database with initial admin user and categories.

## ⚠️ CRITICAL WARNINGS

1. **Run ONLY ONCE** on a fresh database
2. **DO NOT run** on a database with existing data
3. **Change admin password** immediately after seeding
4. **Backup database** before running if it contains any data

---

## What Gets Created

### 1. Admin User
- **Email:** `admin@toolbay.net`
- **Password:** `demo` (⚠️ CHANGE THIS!)
- **Role:** `super-admin`
- **Status:** Email verified
- **Username:** `admin`

### 2. Admin Tenant
- **Name:** Toolbay Admin
- **Slug:** `toolbay-admin`
- **TIN Number:** 999000001
- **Location:** Kigali, Rwanda
- **Phone:** +250788888888
- **Currency:** RWF
- **Status:** Verified & Document Verified
- **Bank:** Bank of Kigali

### 3. Categories
All product categories with subcategories:

1. **All** (for "all products" view)
2. **Building Materials** (7 subcategories)
   - Cement & Concrete, Bricks & Blocks, Sand & Gravel, Steel & Rebar, Roofing Materials, Insulation, Waterproofing
3. **Tools & Equipment** (6 subcategories)
   - Hand Tools, Power Tools, Heavy Machinery, Safety Equipment, Measuring Tools, Ladders & Scaffolding
4. **Electrical & Lighting** (6 subcategories)
   - Cables & Wires, Switches & Sockets, Circuit Breakers, LED Lights, Solar Equipment, Electrical Tools
5. **Plumbing & Water** (6 subcategories)
   - Pipes & Fittings, Valves & Taps, Water Pumps, Water Tanks, Bathroom Fixtures, Drainage Systems
6. **Finishing Materials** (6 subcategories)
   - Paint & Coatings, Tiles & Ceramics, Flooring, Doors & Windows, Hardware & Fittings, Glass & Mirrors
7. **HVAC & Ventilation** (4 subcategories)
   - Air Conditioners, Fans & Ventilators, Ductwork, Heating Systems
8. **Garden & Landscaping** (5 subcategories)
   - Lawn & Garden Tools, Irrigation Systems, Outdoor Lighting, Paving Stones, Fencing Materials
9. **Furniture & Fixtures** (4 subcategories)
   - Kitchen Cabinets, Built-in Wardrobes, Office Furniture, Outdoor Furniture
10. **Other** (miscellaneous)

**Total:** 10 main categories + 44 subcategories

---

## Production Database Details

**Database:** `toolbayproductioncluste.aq3gvoz.mongodb.net`  
**Connection String:** `mongodb+srv://toolbay01_db_user:DbDKPVyf0Kikfhi2@toolbayproductioncluste.aq3gvoz.mongodb.net/?appName=ToolbayProductionCluster`

---

## How to Run

### Option 1: Using the Safe Interactive Script (Recommended)

```bash
cd ~/HomeLTD/toolboxx
node scripts/seed-production.mjs
```

This script will:
1. Show you exactly what will be created
2. Ask for double confirmation
3. Require you to type "SEED PRODUCTION" to proceed
4. Display progress as it creates each item
5. Show final credentials and next steps

### Option 2: Direct Seeding (Advanced)

```bash
cd ~/HomeLTD/toolboxx
DATABASE_URI="mongodb+srv://toolbay01_db_user:DbDKPVyf0Kikfhi2@toolbayproductioncluste.aq3gvoz.mongodb.net/?appName=ToolbayProductionCluster" bun run src/seed.ts
```

---

## Expected Output

```
🌱 Seeding database...
✅ Admin tenant created: [tenant-id]
✅ Admin user created: admin@toolbay.net
✅ Admin tenant updated with verifiedBy
📦 Creating categories...
  ✅ Created category: All
  ✅ Created category: Building Materials
    ✅ Created subcategory: Cement & Concrete
    ✅ Created subcategory: Bricks & Blocks
    ...
  ✅ Created category: Tools & Equipment
    ...
✅ All categories created successfully

🎉 Seeding completed successfully!

📋 Admin Credentials:
   Email: admin@toolbay.net
   Password: demo

⚠️  IMPORTANT: Change the admin password immediately after first login!
```

---

## Post-Seeding Steps

### 1. Test Login
```
URL: https://toolbay.net/sign-in
Email: admin@toolbay.net
Password: demo
```

### 2. Change Admin Password
1. Login with default credentials
2. Go to: **My Account** → **Security**
3. Change password to a strong one
4. Logout and login again with new password

### 3. Update Admin Profile
1. Update contact information
2. Add profile picture
3. Configure notification preferences

### 4. Verify Categories
1. Go to: **Admin Panel** → **Categories**
2. Verify all 10 categories are created
3. Check subcategories are linked correctly

### 5. Configure Tenant Settings
1. Update TIN number if needed
2. Update bank details
3. Verify contact information
4. Upload business documents

---

## Verification Checklist

- [ ] Seeding completed without errors
- [ ] Can login with admin@toolbay.net
- [ ] Admin has super-admin role
- [ ] All 10 main categories exist
- [ ] All 44 subcategories exist
- [ ] Admin tenant is verified
- [ ] Changed default password
- [ ] Updated admin profile
- [ ] Tested creating a product
- [ ] Tested creating a new user

---

## Troubleshooting

### Error: "Connection timeout"
**Cause:** Network connectivity to MongoDB Atlas  
**Solution:** 
- Check internet connection
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas

### Error: "Duplicate key error"
**Cause:** Data already exists in database  
**Solution:** 
- Seeding script has already been run
- Check if admin user exists
- DO NOT run again unless you want duplicate data

### Error: "Authentication failed"
**Cause:** Database credentials incorrect  
**Solution:** 
- Verify database URI
- Check username: `toolbay01_db_user`
- Check password: `DbDKPVyf0Kikfhi2`

### Error: "Cannot connect to database"
**Cause:** Database URI malformed or cluster unavailable  
**Solution:** 
- Verify connection string format
- Check MongoDB Atlas cluster status
- Ensure cluster name is correct: `toolbayproductioncluste`

---

## Database Schema

### Users Collection
```typescript
{
  email: string,
  password: string (hashed),
  roles: ["super-admin"],
  username: string,
  emailVerified: boolean,
  tenants: [{ tenant: ObjectId }]
}
```

### Tenants Collection
```typescript
{
  name: string,
  slug: string,
  tinNumber: string,
  storeManagerId: string,
  category: "retailer",
  location: string,
  contactPhone: string,
  currency: "RWF",
  paymentMethod: "bank_transfer",
  bankName: string,
  bankAccountNumber: string,
  isVerified: boolean,
  verificationStatus: "document_verified",
  canAddMerchants: boolean,
  verifiedAt: Date,
  verifiedBy: ObjectId
}
```

### Categories Collection
```typescript
{
  name: string,
  slug: string,
  color?: string,
  parent?: ObjectId | null
}
```

---

## Security Considerations

1. **Password Security**
   - Default password is `demo` - extremely weak
   - Must be changed immediately after first login
   - Use strong password: min 12 chars, mix of upper/lower/numbers/symbols

2. **Database Access**
   - Connection string contains credentials
   - Keep this documentation secure
   - Rotate database credentials periodically
   - Use IP whitelist in MongoDB Atlas

3. **Admin Account**
   - Has full system access (super-admin)
   - Can create/modify/delete all data
   - Can verify tenants
   - Can manage all users

4. **Production Environment**
   - Never commit database credentials to Git
   - Use environment variables in production
   - Enable MongoDB Atlas audit logging
   - Set up backup schedule

---

## Backup Before Seeding

If your database already has data, create a backup first:

```bash
# Using MongoDB Atlas
# 1. Go to MongoDB Atlas dashboard
# 2. Select your cluster
# 3. Click "..." → "Back Up"
# 4. Create on-demand snapshot

# Or using mongodump
mongodump --uri="mongodb+srv://toolbay01_db_user:DbDKPVyf0Kikfhi2@toolbayproductioncluste.aq3gvoz.mongodb.net/?appName=ToolbayProductionCluster" --out=backup-$(date +%Y%m%d)
```

---

## Files Modified

1. **src/seed.ts**
   - Updated admin email to `admin@toolbay.net`
   - Changed password to `demo`
   - Added `emailVerified: true` for admin
   - Added progress logging
   - Updated tenant name to "Toolbay Admin"

2. **scripts/seed-production.mjs** (NEW)
   - Interactive confirmation script
   - Double-checks before seeding
   - Uses production database URI
   - Shows progress and final credentials

3. **PRODUCTION_SEEDING_GUIDE.md** (NEW)
   - This documentation file

---

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review MongoDB Atlas logs
3. Check application logs: `railway logs` or `vercel logs`
4. Verify database connection string
5. Ensure cluster is in same region for lower latency

---

**Last Updated:** January 5, 2026  
**Database:** toolbayproductioncluste.aq3gvoz.mongodb.net  
**Admin Email:** admin@toolbay.net  
**Default Password:** demo (⚠️ CHANGE THIS!)
