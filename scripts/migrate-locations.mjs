#!/usr/bin/env node

/**
 * Migration script to add default location fields to existing tenants and products
 * Default location: Rwanda, Kigali, Gasabo
 * 
 * Usage: node scripts/migrate-locations.mjs <DATABASE_URI>
 * Example: node scripts/migrate-locations.mjs "mongodb+srv://user:pass@cluster.mongodb.net/dbname"
 */

import { MongoClient } from 'mongodb';

// Default location values for Rwanda/Kigali/Gasabo
const DEFAULT_LOCATION = {
  locationCountry: 'RW',
  locationProvince: 'KIGALI',
  locationDistrict: 'GASABO',
  locationCityOrArea: 'Kigali',
  location: 'Kigali, Gasabo, Kigali, Rwanda', // Format: City, District, Province, Country
};

async function migrateLocations() {
  // Get database URI from command line argument
  const databaseUri = process.argv[2];

  if (!databaseUri) {
    console.error('❌ Error: Database URI is required');
    console.error('Usage: node scripts/migrate-locations.mjs <DATABASE_URI>');
    console.error('Example: node scripts/migrate-locations.mjs "mongodb+srv://..."');
    process.exit(1);
  }

  console.log('🚀 Starting location migration...');
  console.log('📍 Default location: Rwanda, Kigali Province, Gasabo District, Kigali City');
  console.log('');

  let client;

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to database...');
    client = new MongoClient(databaseUri);
    await client.connect();
    console.log('✅ Connected to database\n');

    const db = client.db();

    // Migrate Tenants
    console.log('👥 Migrating tenants...');
    const tenantsCollection = db.collection('tenants');
    
    const tenantsWithoutLocation = await tenantsCollection.countDocuments({
      $or: [
        { locationCountry: { $exists: false } },
        { locationCountry: null },
        { locationCountry: '' },
      ],
    });

    if (tenantsWithoutLocation > 0) {
      const tenantResult = await tenantsCollection.updateMany(
        {
          $or: [
            { locationCountry: { $exists: false } },
            { locationCountry: null },
            { locationCountry: '' },
          ],
        },
        {
          $set: DEFAULT_LOCATION,
        }
      );

      console.log(`✅ Updated ${tenantResult.modifiedCount} tenants with default location`);
    } else {
      console.log('ℹ️  All tenants already have location data');
    }

    // Migrate Products
    console.log('\n📦 Migrating products...');
    const productsCollection = db.collection('products');
    
    const productsWithoutLocation = await productsCollection.countDocuments({
      $or: [
        { locationCountry: { $exists: false } },
        { locationCountry: null },
        { locationCountry: '' },
      ],
    });

    if (productsWithoutLocation > 0) {
      const productResult = await productsCollection.updateMany(
        {
          $or: [
            { locationCountry: { $exists: false } },
            { locationCountry: null },
            { locationCountry: '' },
          ],
        },
        {
          $set: {
            ...DEFAULT_LOCATION,
            useDefaultLocation: true, // Set flag for products
          },
        }
      );

      console.log(`✅ Updated ${productResult.modifiedCount} products with default location`);
    } else {
      console.log('ℹ️  All products already have location data');
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalTenants = await tenantsCollection.countDocuments();
    const tenantsWithRwanda = await tenantsCollection.countDocuments({ locationCountry: 'RW' });
    
    const totalProducts = await productsCollection.countDocuments();
    const productsWithRwanda = await productsCollection.countDocuments({ locationCountry: 'RW' });
    
    console.log(`Tenants: ${tenantsWithRwanda}/${totalTenants} with Rwanda location`);
    console.log(`Products: ${productsWithRwanda}/${totalProducts} with Rwanda location`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Database connection closed');
    }
  }
}

// Run migration
migrateLocations();
