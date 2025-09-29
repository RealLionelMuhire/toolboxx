// Check and potentially fix admin user tenant associations
import { getPayload } from "payload";
import config from "@payload-config";

async function checkAdminUser() {
  try {
    const payload = await getPayload({ config });
    
    console.log('🔍 Checking admin user tenant associations...');
    
    const adminUser = await payload.find({
      collection: 'users',
      where: { email: { equals: 'admin@toolboxx.rw' } },
      overrideAccess: true
    });
    
    if (adminUser.docs.length > 0) {
      const user = adminUser.docs[0];
      console.log('Admin user details:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Roles:', user.roles);
      console.log('  Tenants:', user.tenants);
      
      // Try creating a new super admin user with NO tenant associations
      console.log('\n🔧 Creating a clean super admin user...');
      
      try {
        const cleanAdmin = await payload.create({
          collection: 'users',
          data: {
            email: 'superadmin@toolboxx.rw',
            password: 'demo',
            username: 'superadmin',
            roles: ['super-admin'],
            // NO tenants array - completely unassociated
          },
          overrideAccess: true
        });
        
        console.log('✅ Created clean super admin:', cleanAdmin.email);
        console.log('   Roles:', cleanAdmin.roles);
        console.log('   Tenants:', cleanAdmin.tenants || 'None');
        
      } catch (error) {
        if (error.message?.includes('duplicate')) {
          console.log('ℹ️ Clean super admin already exists');
        } else {
          console.error('Error creating clean admin:', error.message);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdminUser();
