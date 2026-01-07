import { getPayload } from "payload";
import config from "../src/payload.config.ts";

async function testProductAccess() {
  const payload = await getPayload({ config });
  
  console.log("🧪 Testing Product Access Controls...\n");
  
  try {
    // Get all products as super admin (should see all)
    console.log("1️⃣ Testing Super Admin Access (should see all products):");
    const allProducts = await payload.find({
      collection: "products",
      user: {
        id: "super-admin-id",
        roles: ["super-admin"],
        collection: "users",
      },
    });
    console.log(`   Found ${allProducts.docs.length} products`);
    allProducts.docs.forEach(p => {
      console.log(`   - ${p.name} (tenant: ${p.tenant ? (typeof p.tenant === 'object' ? p.tenant.name : p.tenant) : 'none'})`);
    });
    
    // Get products as a specific tenant (should only see their own)
    console.log("\n2️⃣ Testing Tenant Access (should see only own products):");
    const tenantUser = await payload.find({
      collection: "users",
      where: {
        email: { equals: "yvescadiotgeno@gmail.com" }
      }
    });
    
    if (tenantUser.docs.length > 0) {
      const user = tenantUser.docs[0];
      console.log(`   Testing as user: ${user.email}`);
      console.log(`   User tenants: ${user.tenants?.map(t => typeof t.tenant === 'object' ? t.tenant.name : t.tenant).join(', ')}`);
      
      const tenantProducts = await payload.find({
        collection: "products",
        user: user,
      });
      console.log(`   Found ${tenantProducts.docs.length} products for this tenant`);
      tenantProducts.docs.forEach(p => {
        console.log(`   - ${p.name} (tenant: ${p.tenant ? (typeof p.tenant === 'object' ? p.tenant.name : p.tenant) : 'none'})`);
      });
    }
    
    // Test product creation with auto-tenant assignment
    console.log("\n3️⃣ Testing Product Creation with Auto-Tenant Assignment:");
    const testUser = await payload.find({
      collection: "users",
      where: {
        email: { equals: "leo@mail.com" }
      }
    });
    
    if (testUser.docs.length > 0) {
      const user = testUser.docs[0];
      console.log(`   Creating product as user: ${user.email}`);
      
      try {
        const newProduct = await payload.create({
          collection: "products",
          data: {
            name: "Test Product for Leo",
            price: 15000,
            description: "Test product created by Leo tenant",
          },
          user: user,
        });
        
        console.log(`   ✅ Created product: ${newProduct.name}`);
        console.log(`   🏢 Auto-assigned tenant: ${newProduct.tenant ? (typeof newProduct.tenant === 'object' ? newProduct.tenant.name : newProduct.tenant) : 'none'}`);
        
        // Clean up - delete the test product
        await payload.delete({
          collection: "products",
          id: newProduct.id,
          user: user,
        });
        console.log(`   🗑️  Cleaned up test product`);
        
      } catch (error) {
        console.log(`   ❌ Product creation failed: ${error.message}`);
      }
    }
    
    console.log("\n✅ Product access control test completed!");
    
  } catch (error) {
    console.error("❌ Error testing product access:", error);
  } finally {
    process.exit(0);
  }
}

testProductAccess();
