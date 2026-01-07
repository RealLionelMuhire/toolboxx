# Product Card Click - Console Logging Reference

## Quick Start

1. Open browser DevTools Console (F12 or Cmd+Option+J)
2. Navigate to any page with product cards
3. Click/tap on product cards
4. Watch the console output

## Log Prefixes

All logs use color-coded prefixes:
- `[ImageCarousel]` - Green - Image carousel touch/swipe events
- `[ProductCard]` - Yellow - Product card click handling
- `[SuggestedProductCard]` - Yellow - Suggested product card clicks

## Expected Log Flows

### ✅ Successful Quick Tap on Mobile

```
[ImageCarousel] Touch start detected
[ImageCarousel] Quick tap detected, allowing click through
[ProductCard] Card clicked
[ProductCard] Click processing time: 0.50 ms
[ProductCard] Same-origin navigation to: /products/abc123
```

**What this means:**
- Touch was detected
- Identified as a tap (not swipe)
- Click handler executed
- Very fast processing (< 1ms is excellent)
- Navigation initiated

### ✅ Successful Swipe in Carousel

```
[ImageCarousel] Touch start detected
[ImageCarousel] Movement detected, marking as swipe
[ImageCarousel] Swipe detected, preventing click propagation
```

**What this means:**
- Touch was detected
- User moved finger enough to be a swipe
- Click event properly prevented
- Carousel navigation occurred

### ✅ Desktop Click

```
[ProductCard] Card clicked
[ProductCard] Click processing time: 0.35 ms
[ProductCard] Same-origin navigation to: /products/abc123
```

**What this means:**
- Direct click (no touch events on desktop)
- Fast processing
- Navigation initiated

### ✅ Prefetch on Hover

```
[ProductCard] Prefetching product: /products/abc123
```

**What this means:**
- User hovered over card
- Next.js is prefetching the page
- Click will be faster due to cached route

### ✅ Cross-Domain Navigation

```
[ProductCard] Card clicked
[ProductCard] Click processing time: 1.20 ms
[ProductCard] Cross-origin navigation to: https://tenant.domain.com/products/abc123
```

**What this means:**
- Subdomain routing is enabled
- Navigating to different subdomain
- Using window.location (not router.push)

## Performance Benchmarks

### Click Processing Time

| Time | Status | Action Needed |
|------|--------|---------------|
| < 2ms | ✅ Excellent | None |
| 2-10ms | ✅ Good | None |
| 10-50ms | ⚠️ Acceptable | Monitor |
| > 50ms | ❌ Slow | Investigate |

### Common Patterns

#### Pattern 1: Normal Click Flow
```
Card clicked → Processing time → Navigation
```
Time from click to navigation: < 50ms

#### Pattern 2: Hover Then Click (Desktop)
```
Prefetching → Card clicked → Processing time → Navigation
```
Navigation should be instant (already cached)

#### Pattern 3: Carousel Swipe Then Click
```
Touch start → Movement detected → Swipe detected
(wait)
Touch start → Quick tap → Card clicked → Navigation
```
Second touch should register as tap

## Troubleshooting Guide

### ⚠️ Problem: Multiple Clicks Needed

**Look for:**
```
[ProductCard] Card clicked
```
appearing multiple times without navigation logs

**Possible causes:**
- JavaScript error (check for red errors)
- Touch event interference
- Router not responding

**Debug:**
```javascript
// In console, check router state
window.__NEXT_DATA__
```

### ⚠️ Problem: Swipes Trigger Navigation

**Look for:**
```
[ImageCarousel] Swipe detected, preventing click propagation
[ProductCard] Card clicked
```

**This should NOT happen.** If it does:
- Touch events not properly stopping propagation
- Check `e.preventDefault()` and `e.stopPropagation()`

### ⚠️ Problem: Slow Click Response

**Look for:**
```
[ProductCard] Click processing time: 100.50 ms  // Too slow!
```

**Possible causes:**
- Heavy computation in click handler
- Synchronous DOM queries
- Network requests blocking

**Debug:**
Use Performance tab to profile the click event

### ⚠️ Problem: No Logs Appearing

**Possible causes:**
1. **Console cleared:** Browser auto-cleared console
2. **Wrong page:** Not on a page with product cards
3. **Ad blocker:** Some extensions interfere with console.log
4. **Old build:** Clear cache and reload

**Verify logging works:**
```javascript
console.log('[ProductCard] Test log');
// Should appear in console
```

## Console Filters

### Filter by Component

```javascript
// ImageCarousel only
[ImageCarousel]

// ProductCard only
[ProductCard]

// Performance metrics only
processing time

// Navigation only
navigation to
```

### Copy All Logs

1. Right-click in console
2. "Save as..." or select all logs
3. Or use the diagnostic tool at `/product-card-diagnostic.html`

## Advanced Debugging

### Check if touch events are working

```javascript
document.addEventListener('touchstart', (e) => {
  console.log('Touch detected at:', e.touches[0].clientX, e.touches[0].clientY);
});
```

### Check if clicks are being registered

```javascript
document.addEventListener('click', (e) => {
  console.log('Click detected on:', e.target.tagName, e.target.className);
});
```

### Measure full navigation time

```javascript
let clickTime;
document.addEventListener('click', (e) => {
  if (e.target.closest('[class*="ProductCard"]')) {
    clickTime = performance.now();
  }
});

window.addEventListener('beforeunload', () => {
  if (clickTime) {
    console.log('Navigation took:', performance.now() - clickTime, 'ms');
  }
});
```

## Diagnostic Tool

For a better debugging experience, use the diagnostic tool:

**URL:** `/product-card-diagnostic.html`

**Features:**
- Real-time log capture
- Performance metrics
- Click success rate
- Export logs to JSON
- Visual indicators

## Production Monitoring

### Set up logging aggregation (Optional)

```javascript
// Add to your analytics
window.addEventListener('load', () => {
  const originalLog = console.log;
  console.log = function(...args) {
    originalLog.apply(console, args);
    
    const message = args.join(' ');
    if (message.includes('[ProductCard]') && message.includes('processing time')) {
      // Send to analytics
      const match = message.match(/(\d+\.\d+) ms/);
      if (match) {
        const time = parseFloat(match[1]);
        // analytics.track('product_card_click_time', { time });
      }
    }
  };
});
```

## Quick Commands

### Clear console
```javascript
console.clear();
```

### Count clicks
```javascript
let clicks = 0;
document.addEventListener('click', () => clicks++);
console.log('Total clicks:', clicks);
```

### Monitor performance
```javascript
window.addEventListener('click', (e) => {
  if (e.target.closest('[class*="ProductCard"]')) {
    const start = performance.now();
    requestAnimationFrame(() => {
      console.log('Click to frame:', performance.now() - start, 'ms');
    });
  }
});
```

---

## Summary

**Good logs indicate:**
- ✅ Processing time < 10ms
- ✅ Clear tap vs swipe distinction
- ✅ Navigation logs appear after clicks
- ✅ Prefetch happens on hover

**Bad logs indicate:**
- ❌ Processing time > 50ms
- ❌ Multiple clicks without navigation
- ❌ Swipes triggering navigation
- ❌ Missing navigation logs

For detailed metrics, use: `/product-card-diagnostic.html`
