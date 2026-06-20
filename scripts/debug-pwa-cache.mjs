#!/usr/bin/env node
/**
 * PWA Cache Debug Script
 * Helps diagnose PWA caching issues
 */

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.DATABASE_URI

console.log('📱 PWA Notification Debug Guide\n')
console.log('='.repeat(60))

async function checkSubscriptions() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('toolboxx')
    const subscriptions = await db.collection('push-subscriptions').find({}).toArray()
    
    console.log(`\n📊 Current Subscriptions: ${subscriptions.length}\n`)
    
    subscriptions.forEach((sub, index) => {
      const ua = sub.userAgent || ''
      const isMobile = ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android')
      const device = isMobile ? '📱 Mobile' : '🖥️  Desktop'
      
      console.log(`${index + 1}. ${device}`)
      console.log(`   User: ${sub.user}`)
      console.log(`   Created: ${sub.createdAt}`)
      console.log(`   Active: ${sub.isActive ? '✅' : '❌'}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.close()
  }
}

console.log('\n🔧 PWA CACHE ISSUE - HOW TO FIX:\n')
console.log('The PWA caches aggressively. To see new UI changes:\n')
console.log('METHOD 1: Clear PWA Cache (Recommended)')
console.log('─'.repeat(60))
console.log('1. Close the PWA app completely')
console.log('2. Open Chrome browser (not PWA)')
console.log('3. Visit chrome://serviceworker-internals/')
console.log('4. Find "toolboxx-production.up.railway.app"')
console.log('5. Click "Unregister"')
console.log('6. Go to Settings → Site Settings → toolboxx... → Clear & reset')
console.log('7. Visit the site fresh in browser')
console.log('8. Re-enable notifications\n')

console.log('METHOD 2: Nuclear Reset via Console')
console.log('─'.repeat(60))
console.log('1. Open the site in Chrome browser')
console.log('2. Open Console (Menu → More tools → Developer tools)')
console.log('3. Paste and run this code:\n')
console.log('   navigator.serviceWorker.getRegistrations().then(regs =>')
console.log('     regs.forEach(r => r.unregister())')
console.log('   );')
console.log('   caches.keys().then(names =>')
console.log('     Promise.all(names.map(n => caches.delete(n)))')
console.log('   );')
console.log('   localStorage.clear();')
console.log('   setTimeout(() => location.reload(true), 1000);\n')

console.log('METHOD 3: Force Update Service Worker')
console.log('─'.repeat(60))
console.log('1. Open the site')
console.log('2. Open DevTools → Application → Service Workers')
console.log('3. Check "Update on reload"')
console.log('4. Click "Update" button')
console.log('5. Hard refresh (Ctrl+Shift+R or hold refresh button)\n')

console.log('═'.repeat(60))
console.log('\n💡 WHY THIS HAPPENS:\n')
console.log('PWAs cache everything for offline use. This includes:')
console.log('• JavaScript bundles')
console.log('• CSS styles')
console.log('• Service Worker file')
console.log('• Page HTML\n')
console.log('When you deploy new code, the PWA might still use old cached files.')
console.log('The service worker needs to be updated to fetch new files.\n')

console.log('═'.repeat(60))
console.log('\n🔍 CHECKING DATABASE SUBSCRIPTIONS...\n')

await checkSubscriptions()

console.log('═'.repeat(60))
console.log('\n✅ AFTER CLEARING CACHE:\n')
console.log('1. You should see the new blue banner at the top')
console.log('2. Sidebar should have "Enable Notifications" button')
console.log('3. Subscribe using either method')
console.log('4. Run this script again to verify subscription saved')
console.log('5. Test notifications:\n')
console.log('   bun run scripts/test-offline-notifications.mjs\n')

console.log('═'.repeat(60))
