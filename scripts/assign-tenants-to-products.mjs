import { getPayload } from "payload";
import config from "../src/payload.config.ts";

async function assignTenantsToProducts() {
  const payload = await getPayload({ config });
  
  console.log("🔧 Starting tenant assignment to products...");
  
  try {
    // Get all products without tenant
    const productsResult = await payload.find({
      collection: "products",
      where: {
        tenant: {
          exists: false,
        },
      },
    });
    
    console.log(`📊 Found ${productsResult.docs.length} products without tenant assignment`);
    
    if (productsResult.docs.length === 0) {
      console.log("✅ All products already have tenant assignments");
      return;
    }
    
    // Get all verified tenants
    const tenantsResult = await payload.find({
      collection: "tenants",
      where: {
        isVerified: {
          equals: true,
        },
      },
    });
    
    console.log(`🏢 Found ${tenantsResult.docs.length} verified tenants`);
    
    if (tenantsResult.docs.length === 0) {
      console.log("❌ No verified tenants found to assign products to");
      return;
    }
    
    // Assign first verified tenant to all unassigned products
    const firstTenant = tenantsResult.docs[0];
    console.log(`🎯 Assigning products to tenant: ${firstTenant.name}`);
    
    for (const product of productsResult.docs) {
      await payload.update({
        collection: "products",
        id: product.id,
        data: {
          tenant: firstTenant.id,
        },
      });
      
      console.log(`✅ Assigned product "${product.name}" to tenant "${firstTenant.name}"`);
    }
    
    console.log("🎉 Successfully assigned all products to tenants!");
    
  } catch (error) {
    console.error("❌ Error assigning tenants to products:", error);
  } finally {
    process.exit(0);
  }
}

assignTenantsToProducts();
