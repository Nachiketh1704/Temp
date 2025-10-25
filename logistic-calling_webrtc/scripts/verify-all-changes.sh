#!/bin/bash

# Comprehensive Code Change Verification Script
# This script verifies all changes are properly applied

set -e

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🔍 Mobile Audio Fix - Code Verification"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# Function to check and report
check_change() {
    local description="$1"
    local command="$2"
    local expected="$3"
    
    echo -e "${BLUE}▶ Checking:${NC} $description"
    
    if eval "$command" > /dev/null 2>&1; then
        if [ -n "$expected" ]; then
            result=$(eval "$command" 2>&1)
            if echo "$result" | grep -q "$expected"; then
                echo -e "${GREEN}  ✅ PASS${NC}"
                ((PASS_COUNT++))
                return 0
            else
                echo -e "${RED}  ❌ FAIL${NC} - Expected pattern not found"
                echo -e "${YELLOW}  Expected: $expected${NC}"
                echo -e "${YELLOW}  Got: $result${NC}"
                ((FAIL_COUNT++))
                return 1
            fi
        else
            echo -e "${GREEN}  ✅ PASS${NC}"
            ((PASS_COUNT++))
            return 0
        fi
    else
        echo -e "${RED}  ❌ FAIL${NC}"
        ((FAIL_COUNT++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  WebRTC Service Changes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_change "Earpiece mode enabled (speaker: false)" \
    "grep 'speaker: false' app/service/webrtc-service.tsx" \
    "speaker: false"

check_change "Force speaker disabled (forceSpeakerphoneOn: false)" \
    "grep 'forceSpeakerphoneOn: false' app/service/webrtc-service.tsx" \
    "forceSpeakerphoneOn: false"

check_change "Explicit setSpeakerphoneOn(false) added" \
    "grep 'InCallManager.setSpeakerphoneOn(false)' app/service/webrtc-service.tsx" \
    "setSpeakerphoneOn"

check_change "Earpiece mode log message" \
    "grep 'earpiece mode' app/service/webrtc-service.tsx" \
    "earpiece mode"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  AudioRouteModule (Native Android) Changes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_change "AudioFocusRequest import added" \
    "grep 'import android.media.AudioFocusRequest' android/app/src/main/java/com/coinbase/AudioRouteModule.java" \
    "AudioFocusRequest"

check_change "Audio focus listener created" \
    "grep 'OnAudioFocusChangeListener' android/app/src/main/java/com/coinbase/AudioRouteModule.java" \
    "OnAudioFocusChangeListener"

check_change "Audio focus request in startAudioRouting" \
    "grep 'requestAudioFocus' android/app/src/main/java/com/coinbase/AudioRouteModule.java" \
    "requestAudioFocus"

check_change "Audio focus granted log" \
    "grep 'Audio focus granted' android/app/src/main/java/com/coinbase/AudioRouteModule.java" \
    "Audio focus granted"

check_change "Earpiece mode in startAudioRouting" \
    "grep 'setSpeakerphoneOn(false)' android/app/src/main/java/com/coinbase/AudioRouteModule.java" \
    "setSpeakerphoneOn(false)"

check_change "Volume optimization (0.8)" \
    "grep '0.8' android/app/src/main/java/com/coinbase/AudioRouteModule.java" \
    "0.8"

check_change "Audio focus cleanup in stopAudioRouting" \
    "grep 'abandonAudioFocus' android/app/src/main/java/com/coinbase/AudioRouteModule.java" \
    "abandonAudioFocus"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  AndroidManifest Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_change "BLUETOOTH permission" \
    "grep 'android.permission.BLUETOOTH\"' android/app/src/main/AndroidManifest.xml | grep -v BLUETOOTH_CONNECT" \
    "BLUETOOTH"

check_change "BLUETOOTH_CONNECT permission" \
    "grep 'BLUETOOTH_CONNECT' android/app/src/main/AndroidManifest.xml" \
    "BLUETOOTH_CONNECT"

check_change "WAKE_LOCK permission" \
    "grep 'WAKE_LOCK' android/app/src/main/AndroidManifest.xml" \
    "WAKE_LOCK"

check_change "FOREGROUND_SERVICE permission" \
    "grep 'FOREGROUND_SERVICE' android/app/src/main/AndroidManifest.xml" \
    "FOREGROUND_SERVICE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Additional Verifications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_change "react-native-incall-manager in package.json" \
    "grep 'react-native-incall-manager' package.json" \
    "react-native-incall-manager"

check_change "react-native-webrtc in package.json" \
    "grep 'react-native-webrtc' package.json" \
    "react-native-webrtc"

check_change "AudioRouteModule package registration" \
    "grep 'AudioRouteModule' android/app/src/main/java/com/coinbase/MainApplication.kt || grep 'AudioRoutePackage' android/app/src/main/java/com/coinbase/MainApplication.kt" \
    ""

check_change "Audio routing service file exists" \
    "test -f app/service/audio-routing.ts && echo 'exists'" \
    "exists"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  📊 VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo ""

TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo -e "${GREEN}✅ Passed: $PASS_COUNT / $TOTAL${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT / $TOTAL${NC}"

echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "═══════════════════════════════════════════════════════"
    echo -e "${GREEN}  🎉 ALL CHANGES VERIFIED SUCCESSFULLY! 🎉${NC}"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "✅ All code changes are in place and correct!"
    echo ""
    echo "📱 Next Steps:"
    echo "  1. Rebuild the app:"
    echo "     cd android && ./gradlew clean && cd .."
    echo "     npx react-native run-android"
    echo ""
    echo "  2. Test audio on two devices"
    echo "     See TESTING_GUIDE.md for detailed instructions"
    echo ""
    echo "  3. Monitor logs during test:"
    echo "     adb logcat | grep -E 'WebRTC|AudioRoute|InCallManager'"
    echo ""
    exit 0
else
    echo "═══════════════════════════════════════════════════════"
    echo -e "${RED}  ⚠️  SOME CHECKS FAILED  ⚠️${NC}"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "Some changes may not have been applied correctly."
    echo "Please review the failed checks above."
    echo ""
    echo "📋 Files to review:"
    echo "  - app/service/webrtc-service.tsx"
    echo "  - android/app/src/main/java/com/coinbase/AudioRouteModule.java"
    echo "  - android/app/src/main/AndroidManifest.xml"
    echo ""
    exit 1
fi
