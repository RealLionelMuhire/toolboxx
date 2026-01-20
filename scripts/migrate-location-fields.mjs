#!/usr/bin/env node

/**
 * Migration Script: Add Structured Location Fields
 * 
 * This script migrates existing tenants and products to use the new structured location system.
 * 
 * What it does:
 * 1. Updates all tenants with structured location fields (country, province, district, city/area)
 * 2. Updates all products to use their tenant's location (useDefaultLocation = true)
 * 3. Preserves existing plain text location data
 * 
 * Run with: node scripts/migrate-location-fields.mjs
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const DATABASE_URI = process.env.DATABASE_URI;

if (!DATABASE_URI) {
  console.error('❌ DATABASE_URI not found in .env file');
  process.exit(1);
}

// Helper function to parse location string and determine country
function parseLocation(locationString) {
  if (!locationString || typeof locationString !== 'string') {
    return null;
  }

  const lower = locationString.toLowerCase();
  
  // Check for Rwanda indicators
  if (lower.includes('rwanda') || lower.includes('kigali') || lower.includes('huye') || 
      lower.includes('musanze') || lower.includes('rubavu') || lower.includes('nyarugenge') ||
      lower.includes('gasabo') || lower.includes('kicukiro')) {
    return 'RW';
  }
  
  // Check for Uganda indicators
  if (lower.includes('uganda') || lower.includes('kampala') || lower.includes('jinja') || 
      lower.includes('mbale') || lower.includes('gulu') || lower.includes('mbarara')) {
    return 'UG';
  }
  
  // Check for Tanzania indicators
  if (lower.includes('tanzania') || lower.includes('dar es salaam') || lower.includes('arusha') || 
      lower.includes('dodoma') || lower.includes('mwanza') || lower.includes('zanzibar')) {
    return 'TZ';
  }
  
  // Default to Rwanda if no clear indicator
  return 'RW';
}

// Map cities/districts to provinces for Rwanda
function getDefaultProvinceForRwanda(locationString) {
  const lower = locationString.toLowerCase();
  
  if (lower.includes('kigali') || lower.includes('nyarugenge') || 
      lower.includes('gasabo') || lower.includes('kicukiro')) {
    return { province: 'KC', district: 'GAS' }; // Kigali City, Gasabo as default
  }
  
  if (lower.includes('huye') || lower.includes('butare')) {
    return { province: 'SP', district: 'HUY' }; // Southern Province, Huye
  }
  
  if (lower.includes('musanze') || lower.includes('ruhengeri')) {
    return { province: 'NP', district: 'MUS' }; // Northern Province, Musanze
  }
  
  if (lower.includes('rubavu') || lower.includes('gisenyi')) {
    return { province: 'WP', district: 'RUB' }; // Western Province, Rubavu
  }
  
  // Default to Kigali
  return { province: 'KC', district: 'GAS' };
}

// Map cities to regions for Uganda
function getDefaultRegionForUganda(locationString) {
  const lower = locationString.toLowerCase();
  
  if (lower.includes('kampala')) {
    return { province: 'CR', district: 'KLA' }; // Central Region, Kampala
  }
  
  if (lower.includes('gulu') || lower.includes('lira') || lower.includes('arua')) {
    return { province: 'NR', district: 'GUL' }; // Northern Region, Gulu
  }
  
  if (lower.includes('mbale') || lower.includes('jinja')) {
    return { province: 'ER', district: 'MBA' }; // Eastern Region, Mbale
  }
  
  if (lower.includes('mbarara')) {
    return { province: 'WR', district: 'MBR' }; // Western Region, Mbarara
  }
  
  // Default to Kampala
  return { province: 'CR', district: 'KLA' };
}

// Map cities to regions for Tanzania
function getDefaultRegionForTanzania(locationString) {
  const lower = locationString.toLowerCase();
  
  if (lower.includes('dar es salaam') || lower.includes('dar')) {
    return { province: 'DAR', district: 'ILA' }; // Dar es Salaam, Ilala
  }
  
  if (lower.includes('arusha')) {
    return { province: 'ARU', district: 'ARC' }; // Arusha, Arusha City
  }
  
  if (lower.includes('dodoma')) {
    return { province: 'DOD', district: 'DOC' }; // Dodoma, Dodoma City
  }
  
  if (lower.includes('mwanza')) {
    return { province: 'MWZ', district: 'MWC' }; // Mwanza, Mwanza City
  }
  
  // Default to Dar es Salaam
  return { province: 'DAR', district: 'ILA' };
}

// Get structured location from plain text
function getStructuredLocation(locationString) {
  const country = parseLocation(locationString);
  let province, district;
  
  if (country === 'RW') {
    const location = getDefaultProvinceForRwanda(locationString);
    province = location.province;
    district = location.district;
  } else if (country === 'UG') {
    const location = getDefaultRegionForUganda(locationString);
    province = location.province;
    district = location.district;
  } else if (country === 'TZ') {
    const location = getDefaultRegionForTanzania(locationString);
    province = location.province;
    district = location.district;
  }
  
  // Extract city/area (everything before first comma or the whole string)
  const cityOrArea = locationString.split(',')[0].trim();
  
  return {
    locationCountry: country,
    locationProvince: province,
    locationDistrict: district,
    locationCityOrArea: cityOrArea,
  };
}

async function migrateLocations() {
  const client = new MongoClient(DATABASE_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    const db = client.db();
    const tenantsCollection = db.collection('tenants');
    const productsCollection = db.collection('products');
    
    // ==================== MIGRATE TENANTS ====================
    console.log('📊 Starting tenant migration...\n');
    
    const tenants = await tenantsCollection.find({}).toArray();
    console.log(`Found ${tenants.length} tenants\n`);
    
    let tenantsUpdated = 0;
    let tenantsSkipped = 0;
    
    for (const tenant of tenants) {
      // Skip if already has structured location
      if (tenant.locationCountry) {
        console.log(`⏭️  Skipping tenant "${tenant.name}" - already has structured location`);
        tenantsSkipped++;
        continue;
      }
      
      let structuredLocation;
      
      if (tenant.location) {
        // Parse existing location
        structuredLocation = getStructuredLocation(tenant.location);
        console.log(`📍 Tenant: "${tenant.name}"`);
        console.log(`   Old: ${tenant.location}`);
        console.log(`   New: ${structuredLocation.locationCityOrArea}, ${structuredLocation.locationDistrict}, ${structuredLocation.locationProvince}, ${structuredLocation.locationCountry}`);
      } else {
        // No location field - set default to Kigali, Rwanda
        structuredLocation = {
          locationCountry: 'RW',
          locationProvince: 'KC',
          locationDistrict: 'GAS',
          locationCityOrArea: 'Kigali',
        };
        console.log(`📍 Tenant: "${tenant.name}"`);
        console.log(`   No location found - setting default: Kigali, Rwanda`);
      }
      
      // Update tenant
      await tenantsCollection.updateOne(
        { _id: tenant._id },
        { 
          $set: {
            ...structuredLocation,
            // Keep old location field for reference
            location: tenant.location || `${structuredLocation.locationCityOrArea}, ${structuredLocation.locationCountry}`,
          }
        }
      );
      
      tenantsUpdated++;
      console.log(`   ✅ Updated\n`);
    }
    
    console.log(`\n📊 Tenant Migration Summary:`);
    console.log(`   ✅ Updated: ${tenantsUpdated}`);
    console.log(`   ⏭️  Skipped: ${tenantsSkipped}`);
    console.log(`   📝 Total: ${tenants.length}\n`);
    
    // ==================== MIGRATE PRODUCTS ====================
    console.log('📦 Starting product migration...\n');
    
    const products = await productsCollection.find({}).toArray();
    console.log(`Found ${products.length} products\n`);
    
    let productsUpdated = 0;
    let productsSkipped = 0;
    let productsWithoutTenant = 0;
    
    for (const product of products) {
      // Skip if already has structured location
      if (product.locationCountry) {
        productsSkipped++;
        continue;
      }
      
      // Find the tenant for this product
      const tenantId = product.tenant;
      if (!tenantId) {
        console.log(`⚠️  Product "${product.name}" has no tenant - skipping`);
        productsWithoutTenant++;
        continue;
      }
      
      // Get tenant's location
      const tenant = await tenantsCollection.findOne({ _id: tenantId });
      if (!tenant) {
        console.log(`⚠️  Tenant not found for product "${product.name}" - skipping`);
        productsWithoutTenant++;
        continue;
      }
      
      // Use tenant's structured location (or parse tenant's old location)
      let structuredLocation;
      if (tenant.locationCountry) {
        structuredLocation = {
          locationCountry: tenant.locationCountry,
          locationProvince: tenant.locationProvince,
          locationDistrict: tenant.locationDistrict,
          locationCityOrArea: tenant.locationCityOrArea,
        };
      } else if (tenant.location) {
        structuredLocation = getStructuredLocation(tenant.location);
      } else {
        // Default to Kigali
        structuredLocation = {
          locationCountry: 'RW',
          locationProvince: 'KC',
          locationDistrict: 'GAS',
          locationCityOrArea: 'Kigali',
        };
      }
      
      // Update product
      await productsCollection.updateOne(
        { _id: product._id },
        { 
          $set: {
            useDefaultLocation: true,
            ...structuredLocation,
            location: `${structuredLocation.locationCityOrArea}, ${structuredLocation.locationCountry}`,
          }
        }
      );
      
      productsUpdated++;
      
      if (productsUpdated % 50 === 0) {
        console.log(`   ⏳ Processed ${productsUpdated} products...`);
      }
    }
    
    console.log(`\n📊 Product Migration Summary:`);
    console.log(`   ✅ Updated: ${productsUpdated}`);
    console.log(`   ⏭️  Skipped: ${productsSkipped}`);
    console.log(`   ⚠️  No tenant: ${productsWithoutTenant}`);
    console.log(`   📝 Total: ${products.length}\n`);
    
    console.log('✨ Migration completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrateLocations();
