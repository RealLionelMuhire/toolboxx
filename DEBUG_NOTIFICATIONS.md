# Quick Debug Steps

## What I Just Added

I've added a **debug component** to help you see what's happening with notifications.

## Steps to Debug

1. **Build and start your server:**
   ```bash
   bun run build
   bun start
   # OR for development:
   bun dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000/verify-payments
   ```

3. **You should now see an ORANGE debug card** at the top that shows:
   - Browser Support: ✅/❌
   - Permission Status: default/granted/denied
   - Notifications Enabled: ✅/❌
   - Your browser info

4. **Use the debug buttons:**
   - **"Request Permission"** - Ask for notification permission
   - **"Test Notification"** - Show a test notification
   - **"Refresh Status"** - Update the status display

## Common Issues & Solutions

### Issue 1: Permission shows "denied"
**Cause:** You previously clicked "Block" in the browser dialog

**Fix:**
1. Click the lock/info icon in your browser's address bar (left of URL)
2. Find "Notifications" setting
3. Change from "Block" to "Ask" or "Allow"
4. Refresh the page

### Issue 2: Permission shows "granted" but prompt doesn't show
**Cause:** Notifications are already enabled! (This is good)

**Result:** The prompt correctly doesn't show because you don't need it

### Issue 3: Browser Support shows "❌ No"
**Cause:** 
- You're in incognito/private mode (notifications don't work)
- Very old browser (unlikely)

**Fix:** Use a regular browser window

### Issue 4: Permission shows "default" but prompt still doesn't show
**Possible causes:**
- JavaScript not loading
- Component error (check browser console F12)

## What Each Status Means

| Permission | What It Means | Prompt Shows? |
|-----------|---------------|---------------|
| `default` | Not asked yet | ✅ YES - Should show blue prompt |
| `granted` | User allowed | ❌ NO - Already enabled |
| `denied` | User blocked | ❌ NO - User said no |

## Testing Flow

1. **First visit** (permission = "default"):
   - Debug card shows: Permission Status: default
   - Blue notification prompt SHOULD appear below debug card
   - Click "Enable Notifications"
   - Browser asks for permission
   - Click "Allow"

2. **After allowing** (permission = "granted"):
   - Debug card shows: Permission Status: granted
   - Blue prompt disappears (no longer needed)
   - Click "Test Notification" to see if it works

3. **Test actual notifications:**
   - Click "Test Notification" button in debug card
   - Should see: "💰 Payment Received - New payment of RWF 50,000"

## Browser-Specific Notes

### Chrome/Edge
- Address bar shows lock icon
- Click it → Site settings → Notifications
- Can change permission there

### Firefox
- Address bar shows info icon (i)
- Click it → Permissions → Notifications
- Can change permission there

### Safari
- Safari → Settings → Websites → Notifications
- Find localhost in list
- Change permission

## What to Report Back

After testing, tell me:
1. What does "Permission Status" show? (default/granted/denied)
2. What does "Browser Support" show? (Yes/No)
3. Do you see the blue "Enable Notifications" prompt?
4. What browser are you using?

This will help me understand what's happening!

## Remove Debug Component Later

Once notifications work, remove the debug component:

In `/src/app/(app)/verify-payments/page.tsx`:
- Remove: `import { NotificationDebug } from '@/components/notification-debug';`
- Remove: `<NotificationDebug />`

The orange debug card is just for troubleshooting!
