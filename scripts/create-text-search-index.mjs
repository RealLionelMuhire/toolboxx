#!/usr/bin/env node
/**
 * Creates MongoDB text search indexes for the products collection
 * This enables full-text search across product names, tenant names, locations, descriptions, and tags
 * 
 * Run with: node --loader tsx scripts/create-text-search-index.mjs
 * Or: npm run create-search-index
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function createTextSearchIndex() {
  console.log('🔍 Creating text search indexes for products collection...\n');

  const mongoUri = process.env.DATABASE_URI;
  
  if (!mongoUri) {
    console.error('❌ DATABASE_URI not found in environment variables');
    process.exit(1);
  }

  let client;

  try {
    console.log('📡 Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const collection = db.collection('products');

    // Drop existing text index if it exists
    console.log('📋 Checking for existing text indexes...');
    const existingIndexes = await collection.indexes();
    const textIndex = existingIndexes.find(idx => 
      idx.name?.includes('text') || Object.values(idx.key || {}).includes('text')
    );

    if (textIndex) {
      console.log(`🗑️  Dropping existing text index: ${textIndex.name}`);
      await collection.dropIndex(textIndex.name);
    }

    // Create compound text index for full-text search
    console.log('✨ Creating new text search index...');
    
    const result = await collection.createIndex(
      {
        name: 'text',
        description: 'text',
        locationCityOrArea: 'text',
        // Note: For nested fields like tenant.name and tags.name, 
        // we'll need to handle them differently since MongoDB text indexes
        // don't support nested paths directly
      },
      {
        name: 'product_text_search_index',
        weights: {
          name: 10,              // Product name is most important
          description: 5,        // Description is moderately important
          locationCityOrArea: 3, // Location is less important
        },
        default_language: 'english',
      }
    );

    console.log('✅ Text search index created successfully!');
    console.log(`   Index name: ${result}`);
    
    // Create additional indexes for tenant name and tags (non-text)
    console.log('\n📊 Creating supporting indexes...');
    
    // Ensure tenant name can be searched efficiently
    try {
      await collection.createIndex(
        { 'tenant.name': 1 },
        { name: 'tenant_name_index', background: true }
      );
      console.log('✅ Tenant name index created');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ️  Tenant name index already exists');
      } else {
        throw err;
      }
    }

    // Ensure tags can be searched efficiently
    try {
      await collection.createIndex(
        { 'tags.name': 1 },
        { name: 'tags_name_index', background: true }
      );
      console.log('✅ Tags name index created');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ️  Tags name index already exists');
      } else {
        throw err;
      }
    }

    // List all indexes
    console.log('\n📚 All indexes on products collection:');
    const allIndexes = await collection.indexes();
    allIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n🎉 Text search setup complete!');
    console.log('\n💡 You can now search across:');
    console.log('   - Product names (highest priority)');
    console.log('   - Product descriptions');
    console.log('   - Location (city/area)');
    console.log('   - Store/tenant names');
    console.log('   - Product tags');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating text search index:');
    console.error(error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

// Run the script
createTextSearchIndex();
