# Mobile Notification Setup Guide (Android/Samsung)

## 🔍 Current Issue
- ✅ PC receives notifications (1 subscription found)
- ❌ Samsung phone doesn't receive notifications (not subscribed)

## 🎯 Solution: Subscribe on Mobile Device

### Step 1: Open Production App on Samsung Phone

1. Open **Chrome** or **Samsung Internet** browser on your phone
2. Visit: `https://toolboxx-production.up.railway.app/`
3. **Important:** Make sure you're **logged in** with the same account

### Step 2: Enable Notifications on Mobile

**Option A: Look for Notification Banner**
- Scroll through the page
- Look for "Enable Notifications" button/banner
- Tap it
- Grant permission when prompted

**Option B: Trigger Manually (If no banner appears)**
1. Tap the **menu icon** (⋮) in browser
2. Tap **Settings**
3. Tap **Site settings** → **Notifications**
4. Find your site, set to **"Allow"**
5. Refresh the page

### Step 3: Verify Mobile Subscription

**On your phone's browser:**
1. Tap **menu (⋮)** → **More tools** → **Developer tools** (or use Chrome DevTools via USB debugging)
2. Or simpler: Just wait for confirmation message on screen

**On your PC:**
```bash
# Run this to check subscriptions
bun run scripts/check-subscriptions.mjs
```

You should now see:
```
📊 Total push subscriptions: 2

1. Subscription ID: xxx (PC)
   Endpoint: https://fcm.googleapis.com/fcm/send/cFBi1_Wmvso...

2. Subscription ID: yyy (Samsung Phone)
   Endpoint: https://fcm.googleapis.com/fcm/send/dXyZ2_Abc...
```

### Step 4: Test Both Devices

```bash
# Send test notification to all subscribed devices
bun run scripts/test-offline-notifications.mjs
```

**Expected:**
- ✅ Notification appears on PC
- ✅ Notification appears on Samsung phone
- Both should show: "📴 Offline Test Notification"

## 🐛 Troubleshooting Mobile

### "No notification banner appears on mobile"

**Possible causes:**
1. Already have permission (check browser settings)
2. On wrong route (admin vs app layout)
3. Not logged in

**Solutions:**

1. **Check current permissions:**
   - Browser menu → Settings → Site settings → Notifications
   - If blocked, change to "Allow"

2. **Clear site data and try again:**
   - Browser menu → Settings → Site settings → toolboxx-production.up.railway.app
   - Tap "Clear & reset"
   - Reload page
   - Try subscribing again

3. **Make sure you're logged in:**
   - If not logged in, subscriptions can't be saved to your user
   - Sign in first, then enable notifications

### "Permission granted but still no subscription"

**Check these:**

1. **Service Worker active on mobile?**
   - Visit: `chrome://serviceworker-internals/` (Chrome)
   - Look for your site
   - Should show "ACTIVATED"

2. **Network request successful?**
   - Enable USB debugging
   - Connect phone to PC
   - Use Chrome DevTools to inspect mobile browser
   - Check Network tab for `/api/push/subscribe` request
   - Should return 200 OK

3. **Different user logged in?**
   - Make sure you're logged in with the **same user** on both devices
   - Or send notifications to specific user:
   ```bash
   bun run scripts/test-offline-notifications.mjs YOUR_USER_ID
   ```

### "Notification appears briefly then disappears"

**This is Samsung/Android behavior:**
- Notifications may auto-dismiss after few seconds
- Check notification tray (swipe down from top)
- Should still be there

**To make notifications persistent:**
- We already set `requireInteraction: true` in the test
- But Android may override this based on:
  - App importance level
  - Do Not Disturb settings
  - Battery saving mode

### "Only get notifications when app is open"

**This shouldn't happen with service workers, but if it does:**

1. **Check background data:**
   - Settings → Apps → Chrome → Mobile data
   - Enable "Background data"

2. **Check battery optimization:**
   - Settings → Apps → Chrome → Battery
   - Set to "Unrestricted"

3. **Check notification priority:**
   - Settings → Apps → Chrome → Notifications
   - Set to "High priority" or "Make sound"

## 📱 Samsung-Specific Settings

### Samsung Internet Browser

If using Samsung Internet instead of Chrome:

1. **Enable notifications:**
   - Menu → Settings → Sites and downloads → Notifications
   - Allow notifications for your site

2. **Background service:**
   - Settings → Advanced features → Labs
   - Enable "Background service worker"

3. **Protected apps:**
   - Settings → Device care → Battery → App power management
   - Add Samsung Internet to "Apps that won't be put to sleep"

### Samsung One UI Settings

1. **Notification settings:**
   - Settings → Notifications → App notifications → Chrome/Samsung Internet
   - Enable all notification categories

2. **Pop-up notifications:**
   - Settings → Notifications → Advanced settings
   - Enable "Floating notifications"

3. **Do Not Disturb:**
   - Make sure DND is off, OR
   - Add Chrome as exception in DND settings

## 🎯 Quick Test Checklist

Before testing, verify:

- [ ] Samsung phone has internet connection
- [ ] Logged in to production app on phone
- [ ] Notifications allowed in browser settings
- [ ] Service worker active (check browser dev tools or site info)
- [ ] Subscription saved (verify with check-subscriptions.mjs)
- [ ] Battery saver mode OFF (can interfere)
- [ ] Do Not Disturb mode OFF

Then test:
```bash
bun run scripts/test-offline-notifications.mjs
```

## 🔄 Alternative: Test with Message

Instead of using test script, try sending a real message:

1. **From PC:** Send a chat message or create an order
2. **On Samsung phone:** Should receive notification
3. If using chat, make sure:
   - Message is sent to different user
   - Or triggering a notification event
   - Check server logs for notification sending

## 💡 Pro Tips

### Check if notification was actually sent to phone

Add this to the test script output to see endpoints:

```bash
# Run check-subscriptions to see full endpoints
bun run scripts/check-subscriptions.mjs
```

Compare the endpoints:
- PC: `https://fcm.googleapis.com/fcm/send/cFBi1_Wmvso...`
- Phone: `https://fcm.googleapis.com/fcm/send/[different-id]...`

Both should have **different** unique IDs.

### Debug individual subscription

```bash
# Send to specific user only
bun run scripts/test-offline-notifications.mjs YOUR_USER_ID
```

Where `YOUR_USER_ID` is: `68ffed10f22184ec2bb53112` (from check-subscriptions output)

### Monitor in real-time

Keep this running in terminal:
```bash
# Watch for new subscriptions
watch -n 2 'bun run scripts/check-subscriptions.mjs'
```

Then subscribe on phone, you'll see count go from 1 → 2.

## 🚀 Expected Working State

Once properly set up:

1. **PC subscription:** ✅ Working (you already have this)
2. **Phone subscription:** ✅ Added (after following steps above)
3. **Total subscriptions:** 2
4. **Test notification:** Appears on BOTH devices simultaneously
5. **Real notifications:** Work on both when triggered by app events

## 📞 Still Not Working?

Share these details:

1. Output of: `bun run scripts/check-subscriptions.mjs`
2. Screenshot of phone notification settings
3. Browser used on Samsung phone (Chrome/Samsung Internet/Firefox?)
4. Android version
5. Any errors in browser console on phone (if you can access it)

Most likely cause: **Phone not subscribed yet** - follow Step 1-2 above!
