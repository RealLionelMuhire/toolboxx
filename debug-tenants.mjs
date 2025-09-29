import { getPayload } from "payload";
import config from "@payload-config";

async function debugTenants() {
  try {
    console.log('🔍 Debugging tenant access...');
    
    const payload = await getPayload({ config });
    
    // First, let's check the admin user
    console.log('\n1. Checking admin user...');
    const adminUser = await payload.find({
      collection: 'users',
      where: {
        email: { equals: 'admin@toolboxx.rw' }
      }
    });
    
    console.log('Admin user found:', adminUser.docs.length > 0);
    if (adminUser.docs.length > 0) {
      const user = adminUser.docs[0];
      console.log('   Email:', user.email);
      console.log('   Roles:', user.roles);
      console.log('   Tenants:', user.tenants?.length || 0);
    }
    
    // Now let's try to fetch tenants as super admin
    console.log('\n2. Fetching tenants with super admin context...');
    
    // Simulate the request with admin user
    const mockReq = {
      user: adminUser.docs[0]
    };
    
    const tenants = await payload.find({
      collection: 'tenants',
      req: mockReq,
      limit: 100
    });
    
    console.log('Tenants found:', tenants.totalDocs);
    console.log('Tenants returned:', tenants.docs.length);
    
    tenants.docs.forEach((tenant, index) => {
      console.log(`   ${index + 1}. ${tenant.name} (${tenant.slug}) - ${tenant.verificationStatus}`);
    });
    
    // Let's also try without any user context (should show all for super admin)
    console.log('\n3. Direct database query (no access control)...');
    const allTenants = await payload.find({
      collection: 'tenants',
      limit: 100,
      overrideAccess: true // Bypass access control
    });
    
    console.log('All tenants in DB:', allTenants.totalDocs);
    allTenants.docs.forEach((tenant, index) => {
      console.log(`   ${index + 1}. ${tenant.name} (${tenant.slug}) - ${tenant.verificationStatus}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugTenants();
