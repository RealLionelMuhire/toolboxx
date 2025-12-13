# Testing Browser Notifications - Quick Guide

## ✅ Setup Complete!

I've added browser notifications to your app:

### Files Modified:
1. ✅ `/src/app/(app)/layout.tsx` - Added `NotificationProvider`
2. ✅ `/src/app/(app)/verify-payments/page.tsx` - Added `NotificationPrompt`
3. ✅ `/src/app/(app)/my-store/page.tsx` - Added `NotificationPrompt`

---

## 🎯 What You'll See

### 1. Permission Prompt (First Time Only)

When you visit `/verify-payments` or `/my-store`, you'll see a blue card at the top:

```
┌────────────────────────────────────────────────────┐
│ 🔔 Enable Notifications                            │
│ Get instant alerts for new payments, orders,       │
│ and messages                                       │
│                                                    │
│ [Enable Notifications]  [Not Now]                 │
└────────────────────────────────────────────────────┘
```

### 2. Browser Permission Dialog

After clicking "Enable Notifications", your browser will show:

**Chrome/Edge:**
```
┌────────────────────────────────────────────────────┐
│ localhost:3000 wants to                            │
│ Show notifications                                 │
│                                                    │
│              [Block]  [Allow]                      │
└────────────────────────────────────────────────────┘
```

**Firefox:**
```
┌────────────────────────────────────────────────────┐
│ localhost:3000 wants to send you notifications    │
│                                                    │
│     [Don't Allow]  [Allow]                        │
└────────────────────────────────────────────────────┘
```

**Safari:**
```
┌────────────────────────────────────────────────────┐
│ "localhost" Would Like to Send You Notifications  │
│                                                    │
│              [Don't Allow]  [Allow]                │
└────────────────────────────────────────────────────┘
```

### 3. Notifications Appear!

Once enabled, you'll get notifications for:
- 💰 New payments (if you're a tenant)
- 💬 New chat messages
- 📦 Order updates (if you're a customer)

---

## 🧪 How to Test

### Test 1: On Localhost (Development)

**YES, you can test on localhost!** Browser notifications work perfectly in development.

#### Steps:
1. **Start your dev server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Log in as a tenant** (seller account)

4. **Navigate to `/verify-payments` or `/my-store`**

5. **You'll see the notification prompt** (blue card at top)

6. **Click "Enable Notifications"**

7. **Click "Allow" in browser dialog**

8. **Test notifications:**
   - Open a second browser tab
   - Create a test payment/transaction in that tab
   - Wait 30 seconds (for polling to detect new payment)
   - **You should see a notification!** 🎉

---

### Test 2: Manual Trigger (Instant Test)

To test immediately without waiting:

1. **Open browser console** (F12 → Console tab)

2. **Paste this code:**
   ```javascript
   import('/src/lib/notifications/browser-notifications.js')
     .then(module => {
       const service = module.notificationService;
       service.requestPermission().then(() => {
         service.showPaymentNotification('RWF 50,000', 'test-123');
       });
     });
   ```

3. **Or add a test button temporarily** to your page:

   ```tsx
   import { notificationService } from '@/lib/notifications/browser-notifications';
   import { Button } from '@/components/ui/button';

   // Add this inside your component
   <Button onClick={async () => {
     if (!notificationService.isEnabled()) {
       await notificationService.requestPermission();
     }
     await notificationService.showPaymentNotification('RWF 50,000', 'test-123');
   }}>
     Test Notification
   </Button>
   ```

---

### Test 3: On Production/Staging

**Do you NEED production to test?** 

**NO!** Localhost works perfectly for Phase 1 (Browser Notifications).

**However, if you want to test on production:**

1. Deploy your code to your hosting (Vercel, Railway, etc.)
2. Visit your production URL: `https://your-domain.com`
3. Same steps as localhost test above
4. Notifications will work the same way

**Note:** The ONLY difference between localhost and production for Phase 1 is:
- Localhost: `http://localhost:3000` (works fine!)
- Production: `https://your-domain.com` (also works!)

Phase 1 doesn't require HTTPS, but production sites should use HTTPS anyway.

---

## 🎬 Step-by-Step First Test

### Complete Test Flow (5 minutes):

1. **Terminal 1: Start dev server**
   ```bash
   cd /home/leo/HomeLTD/toolboxx
   bun dev
   ```

2. **Browser: Open app**
   - Go to `http://localhost:3000`
   - Log in with tenant account

3. **Navigate to My Store**
   - Click "My Store" in navbar
   - OR go to `http://localhost:3000/my-store`

4. **See the prompt**
   - You should see a blue notification prompt card at the top
   - It says "Enable Notifications"

5. **Enable notifications**
   - Click "Enable Notifications" button
   - Browser shows permission dialog
   - Click "Allow"

6. **Prompt disappears**
   - The blue card will disappear
   - Notifications are now enabled ✅

7. **Test with real data** (Option A):
   - Open a second browser tab (same browser)
   - In that tab, create a test payment or transaction
   - Wait 30-60 seconds
   - Look for notification to appear!

8. **Test manually** (Option B - Faster):
   - Press F12 to open DevTools
   - Go to Console tab
   - Type:
     ```javascript
     const { notificationService } = await import('/src/lib/notifications/browser-notifications.js');
     await notificationService.showPaymentNotification('RWF 50,000', 'test-123');
     ```
   - Press Enter
   - **Notification should appear immediately!** 🔔

---

## 🎯 What Notifications Will Show

### For Tenants (Sellers):
- **New Payment:** "💰 Payment Received - New payment of RWF 50,000"
- **Low Stock:** "📦 Stock Alert - Hammer is running low on stock"
- **Out of Stock:** "📦 Stock Alert - Nails is out of stock"
- **New Message:** "💬 John - Hello, I'm interested in..."

### For Customers (Buyers):
- **Order Shipped:** "📦 Order Update - Your order has been shipped"
- **New Message:** "💬 ToolStore - Your item is ready for pickup"

---

## 🐛 Troubleshooting

### Issue: "I don't see the prompt"

**Solutions:**
1. Make sure you're logged in as a tenant
2. Check if you've already granted/denied permission:
   - Click the lock icon in address bar
   - Check "Notifications" permission
   - Reset if needed

### Issue: "I clicked Allow but no notifications appear"

**Check:**
1. Open DevTools → Console
2. Type: `notificationService.isEnabled()`
3. Should return `true`

**If false:**
- Check browser settings → Notifications
- Make sure notifications aren't blocked

### Issue: "Notification permission is 'denied'"

**Fix:**
1. Click lock icon in address bar (left of URL)
2. Find "Notifications"
3. Change from "Block" to "Ask" or "Allow"
4. Refresh page

### Issue: "I'm on Safari and it's not working"

**Safari Requirements:**
- macOS: Works on Safari 7+
- iOS: Requires iOS 16.4+ (March 2023)
- Older iOS versions don't support notifications

---

## 📊 Browser DevTools - Monitoring

### Check Notification Status:

**Open DevTools → Console:**
```javascript
// Check if notifications are supported
Notification.permission  // Should be: "granted", "denied", or "default"

// Check our service
const { notificationService } = await import('/src/lib/notifications/browser-notifications.js');
notificationService.isSupported()  // Should be: true
notificationService.isEnabled()    // Should be: true (after granting permission)
```

### View Notification Logs:

All notification events are logged to console. Look for:
- "Notification shown: ..."
- "Notification clicked: ..."
- "Permission granted/denied"

---

## ✅ Testing Checklist

After setup, verify:

- [ ] Blue prompt appears on `/my-store` or `/verify-payments`
- [ ] Can click "Enable Notifications"
- [ ] Browser permission dialog appears
- [ ] After clicking Allow, prompt disappears
- [ ] Manual test notification works (console test)
- [ ] Real notification appears after payment (wait 30s)
- [ ] Clicking notification opens correct page
- [ ] Can test on localhost (no need for production)
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari (if on macOS/iOS 16.4+)

---

## 🚀 Next Steps After Testing

Once notifications work:

1. **Customize messages** - Edit notification texts in `browser-notifications.ts`
2. **Add sounds** - Place MP3 files in `/public/sounds/`
3. **Gather feedback** - Ask users if they like it
4. **Phase 2** - Consider Web Push for background notifications

---

## 💡 Pro Tips

1. **Don't spam**: Only show important notifications
2. **Test in multiple browsers**: Chrome, Firefox, Safari behave differently
3. **Mobile testing**: Open localhost on your phone (use your computer's IP)
4. **Incognito mode**: Notifications don't work in private/incognito
5. **System settings**: Check OS notification settings if issues persist

---

## 🎉 Success Criteria

You'll know it's working when:

✅ You see the blue notification prompt  
✅ Browser asks for permission  
✅ After allowing, notifications appear  
✅ Clicking notification opens the right page  
✅ Sound plays (if you added sound files)  

**That's it! You're ready to test!** 🚀

---

## Quick Commands

```bash
# Start dev server
cd /home/leo/HomeLTD/toolboxx
bun dev

# Open in browser
# Go to: http://localhost:3000/my-store

# Manual test in browser console:
const { notificationService } = await import('/src/lib/notifications/browser-notifications.js');
await notificationService.requestPermission();
await notificationService.showPaymentNotification('RWF 50,000', 'test-123');
```

**Happy testing!** 🎯
