#!/usr/bin/env node

/**
 * Script to drop the unique index on tinNumber field in tenants collection
 */

import { MongoClient } from 'mongodb'

async function dropTinIndex() {
  // Get MongoDB connection string from environment
  const mongoUrl = process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/toolboxx'
  
  console.log('🔧 Connecting to MongoDB...')
  const client = new MongoClient(mongoUrl)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db()
    const collection = db.collection('tenants')

    console.log('🔍 Checking existing indexes...')
    const indexes = await collection.indexes()
    console.log('Current indexes:', indexes.map(idx => idx.name))

    // Drop the unique index on tinNumber if it exists
    const tinIndexes = indexes.filter(idx => 
      idx.key && idx.key.tinNumber !== undefined
    )

    if (tinIndexes.length > 0) {
      for (const idx of tinIndexes) {
        console.log(`🗑️  Dropping index: ${idx.name}`)
        await collection.dropIndex(idx.name)
        console.log(`✅ Dropped index: ${idx.name}`)
      }
    } else {
      console.log('ℹ️  No tinNumber index found to drop')
    }

    console.log('✨ Done!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.close()
    console.log('👋 Disconnected from MongoDB')
  }
}

dropTinIndex()
