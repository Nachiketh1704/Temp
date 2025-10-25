#!/bin/bash

# Mobile Audio Fix Verification Script
# Run this script after rebuilding the app to verify the fix

echo "🔍 Mobile Audio Fix Verification"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in the logistic-calling_webrtc directory${NC}"
    echo "Please run this script from /app/logistic-calling_webrtc/"
    exit 1
fi

echo "📱 Step 1: Checking Android setup..."
echo "-----------------------------------"

# Check if AndroidManifest has required permissions
if grep -q "android.permission.BLUETOOTH" android/app/src/main/AndroidManifest.xml && \
   grep -q "android.permission.WAKE_LOCK" android/app/src/main/AndroidManifest.xml && \
   grep -q "android.permission.FOREGROUND_SERVICE" android/app/src/main/AndroidManifest.xml; then
    echo -e "${GREEN}✅ Required permissions found in AndroidManifest${NC}"
else
    echo -e "${RED}❌ Missing required permissions in AndroidManifest${NC}"
    echo "   Please ensure BLUETOOTH, WAKE_LOCK, and FOREGROUND_SERVICE are added"
fi

# Check if AudioRouteModule has audio focus
if grep -q "AudioFocusRequest" android/app/src/main/java/com/coinbase/AudioRouteModule.java; then
    echo -e "${GREEN}✅ AudioRouteModule has audio focus management${NC}"
else
    echo -e "${RED}❌ AudioRouteModule missing audio focus management${NC}"
fi

echo ""
echo "📝 Step 2: Checking WebRTC Service configuration..."
echo "---------------------------------------------------"

# Check if webrtc-service has earpiece mode
if grep -q "speaker: false" app/service/webrtc-service.tsx && \
   grep -q "forceSpeakerphoneOn: false" app/service/webrtc-service.tsx; then
    echo -e "${GREEN}✅ WebRTC Service configured for earpiece mode${NC}"
else
    echo -e "${RED}❌ WebRTC Service not configured correctly${NC}"
    echo "   Should have speaker: false and forceSpeakerphoneOn: false"
fi

echo ""
echo "🔧 Step 3: Build verification..."
echo "--------------------------------"

echo -e "${YELLOW}⚠️  IMPORTANT: You must rebuild the app for native changes to take effect!${NC}"
echo ""
echo "To rebuild the Android app:"
echo "  1. cd android && ./gradlew clean"
echo "  2. cd .. && npx react-native run-android"
echo ""
echo "Or use this quick command:"
echo "  cd android && ./gradlew clean && cd .. && npx react-native run-android"

echo ""
echo "📋 Step 4: Testing checklist..."
echo "-------------------------------"
echo ""
echo "After rebuilding, test these scenarios:"
echo ""
echo "  [ ] Test 1: Make a call between two Android devices"
echo "  [ ] Test 2: Verify audio works through earpiece"
echo "  [ ] Test 3: Toggle speaker on/off"
echo "  [ ] Test 4: Check logs for 'Audio focus granted'"
echo "  [ ] Test 5: Verify no audio dropouts during call"
echo "  [ ] Test 6: Test call end and cleanup"
echo ""

echo "🔍 Step 5: Log patterns to look for..."
echo "--------------------------------------"
echo ""
echo "Successful initialization should show:"
echo -e "${GREEN}  📞 WebRTC: Using InCallManager for audio routing${NC}"
echo -e "${GREEN}  ✅ WebRTC: InCallManager started successfully with earpiece mode${NC}"
echo -e "${GREEN}  AudioRouteModule: Audio focus granted${NC}"
echo -e "${GREEN}  AudioRouteModule: Audio routing started with earpiece mode${NC}"
echo ""

echo "🎯 Expected Behavior:"
echo "--------------------"
echo "  ✅ Audio should play through earpiece (phone speaker near ear)"
echo "  ✅ Both users should hear each other clearly"
echo "  ✅ Speaker toggle should work smoothly"
echo "  ✅ Audio should remain stable throughout the call"
echo ""

echo "📱 To view live logs during testing:"
echo "------------------------------------"
echo "  adb logcat | grep -E 'WebRTC|AudioRoute|InCallManager'"
echo ""

echo "✨ Verification complete! Please rebuild and test the app."
echo ""
