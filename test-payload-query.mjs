// Quick test to see what Payload is actually returning
import { getPayload } from "payload";
import config from "@payload-config";

async function testPayloadQuery() {
  try {
    const payload = await getPayload({ config });
    
    console.log('🔍 Testing Payload query directly...');
    
    // Test 1: Override access completely
    console.log('\n1. Query with overrideAccess: true');
    const allTenants = await payload.find({
      collection: 'tenants',
      overrideAccess: true,
      limit: 100
    });
    console.log('Total found:', allTenants.totalDocs);
    console.log('Tenants:', allTenants.docs.map(t => ({ name: t.name, slug: t.slug })));
    
    // Test 2: Get admin user and query with that user
    console.log('\n2. Query as admin user');
    const adminUser = await payload.find({
      collection: 'users',
      where: { email: { equals: 'admin@toolboxx.rw' } },
      overrideAccess: true
    });
    
    if (adminUser.docs.length > 0) {
      const user = adminUser.docs[0];
      console.log('Admin user:', { id: user.id, email: user.email, roles: user.roles });
      
      const tenantsAsAdmin = await payload.find({
        collection: 'tenants',
        user: user, // Pass user directly
        limit: 100
      });
      console.log('Total found as admin:', tenantsAsAdmin.totalDocs);
      console.log('Tenants as admin:', tenantsAsAdmin.docs.map(t => ({ name: t.name, slug: t.slug })));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPayloadQuery();
