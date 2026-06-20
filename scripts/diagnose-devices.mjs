#!/usr/bin/env node
/**
 * Diagnose Multi-Device Notification Issues
 * Checks subscriptions and identifies which devices are subscribed
 */

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.DATABASE_URI

async function diagnoseNotifications() {
  console.log('🔍 Diagnosing Multi-Device Notifications...\n')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('toolboxx')
    const subscriptions = await db.collection('push-subscriptions').find({}).toArray()

    if (subscriptions.length === 0) {
      console.log('❌ NO SUBSCRIPTIONS FOUND\n')
      console.log('📝 To Fix:')
      console.log('1. Visit: https://toolboxx-production.up.railway.app/')
      console.log('2. Click "Enable Notifications"')
      console.log('3. Grant permission\n')
      return
    }

    console.log(`📊 Total Subscriptions: ${subscriptions.length}\n`)
    console.log('=' .repeat(70))

    subscriptions.forEach((sub, index) => {
      // Detect device type from user agent
      const ua = sub.userAgent || ''
      let deviceType = '🖥️  Desktop'
      let browser = 'Unknown'
      
      if (ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android')) {
        deviceType = '📱 Mobile (Android)'
      } else if (ua.toLowerCase().includes('iphone') || ua.toLowerCase().includes('ipad')) {
        deviceType = '📱 Mobile (iOS)'
      }
      
      if (ua.includes('Chrome')) browser = 'Chrome'
      else if (ua.includes('Firefox')) browser = 'Firefox'
      else if (ua.includes('Safari')) browser = 'Safari'
      else if (ua.includes('Edge')) browser = 'Edge'
      else if (ua.includes('Samsung')) browser = 'Samsung Internet'

      // Detect FCM endpoint details
      const endpoint = sub.endpoint || ''
      const fcmToken = endpoint.split('/').pop()?.substring(0, 30) || 'Unknown'
      
      console.log(`\n${index + 1}. ${deviceType} - ${browser}`)
      console.log('─'.repeat(70))
      console.log(`   Subscription ID: ${sub._id}`)
      console.log(`   User ID: ${sub.user || 'Anonymous'}`)
      console.log(`   FCM Token: ${fcmToken}...`)
      console.log(`   User Agent: ${ua || 'Not recorded'}`)
      console.log(`   Active: ${sub.isActive ? '✅ Yes' : '❌ No'}`)
      console.log(`   Created: ${sub.createdAt || 'Unknown'}`)
      console.log(`   Last Updated: ${sub.updatedAt || 'Unknown'}`)
    })

    console.log('\n' + '='.repeat(70))
    console.log('\n📋 ANALYSIS:\n')

    // Count by device type
    const mobileCount = subscriptions.filter(s => 
      s.userAgent?.toLowerCase().includes('mobile') || 
      s.userAgent?.toLowerCase().includes('android')
    ).length
    
    const desktopCount = subscriptions.length - mobileCount

    console.log(`🖥️  Desktop subscriptions: ${desktopCount}`)
    console.log(`📱 Mobile subscriptions: ${mobileCount}`)
    
    if (mobileCount === 0) {
      console.log('\n⚠️  WARNING: No mobile subscriptions found!')
      console.log('   Your Samsung phone is NOT subscribed yet.')
      console.log('\n📝 TO FIX:')
      console.log('   1. Open Chrome on your Samsung phone')
      console.log('   2. Visit: https://toolboxx-production.up.railway.app/')
      console.log('   3. Log in with the same account')
      console.log('   4. Click "Enable Notifications"')
      console.log('   5. Grant permission when prompted')
      console.log('   6. Run this script again to verify\n')
    } else {
      console.log('\n✅ Both desktop and mobile subscribed!')
      console.log('\n🧪 TEST:')
      console.log('   Run: bun run scripts/test-offline-notifications.mjs')
      console.log('   Notifications should appear on ALL devices!\n')
    }

    // Check for inactive subscriptions
    const inactiveCount = subscriptions.filter(s => !s.isActive).length
    if (inactiveCount > 0) {
      console.log(`\n⚠️  Warning: ${inactiveCount} inactive subscription(s) found`)
      console.log('   These won\'t receive notifications')
      console.log('   Consider cleaning them up\n')
    }

    // Check for same user on multiple devices
    const userGroups = {}
    subscriptions.forEach(sub => {
      const userId = sub.user?.toString() || 'anonymous'
      if (!userGroups[userId]) userGroups[userId] = []
      userGroups[userId].push(sub)
    })

    console.log('\n👥 USERS WITH MULTIPLE DEVICES:\n')
    Object.entries(userGroups).forEach(([userId, subs]) => {
      if (subs.length > 1) {
        console.log(`   User ${userId}: ${subs.length} devices`)
        subs.forEach((s, i) => {
          const device = s.userAgent?.includes('Mobile') ? '📱' : '🖥️'
          console.log(`      ${i + 1}. ${device} ${s.userAgent?.split('/')[0] || 'Unknown'}`)
        })
      }
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.close()
    console.log('\n🔌 Connection closed\n')
  }
}

diagnoseNotifications().catch(console.error)
