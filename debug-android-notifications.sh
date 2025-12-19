#!/bin/bash

# Android Chrome Remote Debugging Helper
# Helps debug web push notifications on Android devices

echo "🔍 Android Notification Debugging Tool"
echo "======================================="
echo ""

# Check if device is connected
echo "📱 Checking connected devices..."
adb devices
echo ""

# Check if Chrome is installed
echo "🌐 Checking Chrome processes..."
adb shell ps | grep chrome
echo ""

# Get Chrome version
echo "📊 Chrome version:"
adb shell dumpsys package com.android.chrome | grep versionName
echo ""

# Check notification permissions
echo "🔔 Checking notification permissions..."
adb shell dumpsys notification | grep "android.permission.POST_NOTIFICATIONS"
echo ""

# Open Chrome DevTools
echo "🔧 Opening Chrome DevTools..."
echo "Now open chrome://inspect in your desktop Chrome browser"
echo ""

# Get device info
echo "📱 Device Information:"
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
echo ""

# Instructions
echo "📋 Next Steps:"
echo "1. Open chrome://inspect in desktop Chrome"
echo "2. Find your device and click 'inspect' on your website"
echo "3. In the console, run these commands:"
echo ""
echo "   // Check notification support"
echo "   console.log('Notifications:', 'Notification' in window);"
echo "   console.log('Permission:', Notification.permission);"
echo ""
echo "   // Check Service Worker"
echo "   navigator.serviceWorker.getRegistration().then(reg => {"
echo "     console.log('SW Registered:', !!reg);"
echo "     console.log('SW State:', reg?.active?.state);"
echo "   });"
echo ""
echo "   // Check Push Subscription"
echo "   navigator.serviceWorker.ready.then(reg =>"
echo "     reg.pushManager.getSubscription()"
echo "   ).then(sub => {"
echo "     console.log('Push Subscribed:', !!sub);"
echo "     if (sub) console.log('Endpoint:', sub.endpoint);"
echo "   });"
echo ""
echo "4. Share the output to diagnose the issue!"
echo ""
