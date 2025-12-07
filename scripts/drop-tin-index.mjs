#!/usr/bin/env node

/**
 * Script to drop the unique index on tinNumber field in tenants collection
 * This is needed after removing unique: true from the field definition
 */

import { getPayload } from 'payload'
import config from '../src/payload.config.js'

async function dropTinIndex() {
  try {
    console.log('🔧 Initializing Payload...')
    const payload = await getPayload({ config })

    console.log('📊 Accessing MongoDB connection...')
    const db = payload.db.connection.db
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
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

dropTinIndex()
