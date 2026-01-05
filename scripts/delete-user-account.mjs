#!/usr/bin/env node

/**
 * Delete User Account Script
 * Deletes a user account and all associated data from MongoDB
 */

import { MongoClient } from 'mongodb';

// MongoDB connection string
const MONGODB_URI = "mongodb+srv://Leo:H4ckGeJLJANoaT6O@ticoai.wwfr4.mongodb.net/toolboxx?retryWrites=true&w=majority&appName=TicoAI";

// Email to delete
const EMAIL_TO_DELETE = "leomuhire8@gmail.com";

async function deleteUserAccount() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db('toolboxx');
    
    // Find the user first
    console.log(`\n🔍 Searching for user with email: ${EMAIL_TO_DELETE}`);
    const user = await db.collection('users').findOne({ email: EMAIL_TO_DELETE });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`✅ User found:`, {
      id: user._id,
      email: user.email,
      name: user.name || 'N/A',
      roles: user.roles || [],
    });

    // Confirm deletion
    console.log('\n⚠️  This will delete:');
    console.log('   - User account');
    console.log('   - All user sessions');
    console.log('   - All user notifications');
    console.log('   - All user reviews');
    console.log('   - All user orders');
    console.log('   - All user sales');
    console.log('   - All user conversations');
    console.log('   - All user messages');
    console.log('   - Related tenant data (if any)');

    // Delete user and related data
    console.log('\n🗑️  Starting deletion process...\n');

    // 1. Delete user sessions
    const sessionsResult = await db.collection('payload-preferences').deleteMany({ 
      user: user._id.toString() 
    });
    console.log(`✅ Deleted ${sessionsResult.deletedCount} session(s)`);

    // 2. Delete user notifications
    const notificationsResult = await db.collection('notifications').deleteMany({ 
      user: user._id.toString() 
    });
    console.log(`✅ Deleted ${notificationsResult.deletedCount} notification(s)`);

    // 3. Delete user reviews
    const reviewsResult = await db.collection('reviews').deleteMany({ 
      user: user._id.toString() 
    });
    console.log(`✅ Deleted ${reviewsResult.deletedCount} review(s)`);

    // 4. Delete user orders
    const ordersResult = await db.collection('orders').deleteMany({ 
      user: user._id.toString() 
    });
    console.log(`✅ Deleted ${ordersResult.deletedCount} order(s)`);

    // 5. Delete user sales
    const salesResult = await db.collection('sales').deleteMany({ 
      buyer: user._id.toString() 
    });
    console.log(`✅ Deleted ${salesResult.deletedCount} sale(s) as buyer`);

    // 6. Delete conversations where user is participant
    const conversationsResult = await db.collection('conversations').deleteMany({
      $or: [
        { buyer: user._id.toString() },
        { seller: user._id.toString() }
      ]
    });
    console.log(`✅ Deleted ${conversationsResult.deletedCount} conversation(s)`);

    // 7. Delete messages from user
    const messagesResult = await db.collection('messages').deleteMany({ 
      sender: user._id.toString() 
    });
    console.log(`✅ Deleted ${messagesResult.deletedCount} message(s)`);

    // 8. Delete user's tenants (if any)
    const tenantsResult = await db.collection('tenants').deleteMany({ 
      owner: user._id.toString() 
    });
    console.log(`✅ Deleted ${tenantsResult.deletedCount} tenant(s)`);

    // 9. Delete user's products (if any)
    const productsResult = await db.collection('products').deleteMany({ 
      createdBy: user._id.toString() 
    });
    console.log(`✅ Deleted ${productsResult.deletedCount} product(s)`);

    // 10. Finally, delete the user account
    const userResult = await db.collection('users').deleteOne({ 
      _id: user._id 
    });
    console.log(`✅ Deleted user account`);

    console.log('\n✨ Account deletion completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Sessions: ${sessionsResult.deletedCount}`);
    console.log(`   - Notifications: ${notificationsResult.deletedCount}`);
    console.log(`   - Reviews: ${reviewsResult.deletedCount}`);
    console.log(`   - Orders: ${ordersResult.deletedCount}`);
    console.log(`   - Sales: ${salesResult.deletedCount}`);
    console.log(`   - Conversations: ${conversationsResult.deletedCount}`);
    console.log(`   - Messages: ${messagesResult.deletedCount}`);
    console.log(`   - Tenants: ${tenantsResult.deletedCount}`);
    console.log(`   - Products: ${productsResult.deletedCount}`);
    console.log(`   - User: ${userResult.deletedCount}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
console.log('🚀 User Account Deletion Script');
console.log('================================\n');

deleteUserAccount()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
