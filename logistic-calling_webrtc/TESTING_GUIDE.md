# 🧪 Complete Testing Guide for Mobile Audio Fix

## Prerequisites

### Required Setup
1. **Two Android devices** (or one device + one emulator)
2. **Android Studio** installed
3. **adb** (Android Debug Bridge) installed
4. **Node.js and npm/yarn** installed

## 🔨 Step 1: Rebuild the Application

The native Android code was modified, so you **MUST** rebuild the app:

```bash
# Navigate to the project
cd /app/logistic-calling_webrtc

# Clean previous builds
cd android && ./gradlew clean
cd ..

# Rebuild and install on device
npx react-native run-android

# Or if you want to build a release APK
cd android && ./gradlew assembleRelease
```

**Installation time**: 5-10 minutes depending on your machine

## 📱 Step 2: Install on Two Devices

### Option A: Two Physical Devices
```bash
# Check connected devices
adb devices

# If multiple devices, install on specific device
adb -s DEVICE_ID install android/app/build/outputs/apk/release/app-release.apk
```

### Option B: One Device + One Emulator
```bash
# Start emulator
emulator -avd YOUR_AVD_NAME

# Install on emulator
npx react-native run-android
```

## 🎯 Step 3: Testing Scenarios

### Test 1: Basic Audio Call ✅

**Setup**:
1. Login as User A on Device 1
2. Login as User B on Device 2

**Test Steps**:
1. User A initiates a call to User B
2. User B receives the call notification
3. User B accepts the call
4. **EXPECTED**: 
   - Both users should see each other (video)
   - Both users should **hear each other through earpiece**
   - Hold phone to ear to hear audio clearly

**Success Criteria**:
- ✅ Audio is clear and audible through earpiece
- ✅ No echo or feedback
- ✅ Both users can hear each other simultaneously
- ✅ No audio dropouts

---

### Test 2: Speaker Toggle 🔊

**During an active call**:
1. User A taps the "Speaker" button
2. **EXPECTED**: 
   - Audio switches to loudspeaker
   - Audio remains clear
   - User can hear without holding phone to ear

3. User A taps "Speaker" button again
4. **EXPECTED**:
   - Audio switches back to earpiece
   - Audio quality maintained

**Success Criteria**:
- ✅ Speaker toggle works smoothly
- ✅ No audio interruption during toggle
- ✅ Audio quality maintained in both modes

---

### Test 3: Microphone Mute 🎤

**During an active call**:
1. User A taps "Mute" button
2. User A speaks
3. **EXPECTED**: User B should NOT hear User A

4. User A taps "Mute" button again
5. User A speaks
6. **EXPECTED**: User B should hear User A clearly

**Success Criteria**:
- ✅ Mute works correctly
- ✅ Unmute restores audio
- ✅ Other user's audio not affected

---

### Test 4: Long Duration Call ⏱️

**Test Steps**:
1. Start a call between User A and User B
2. Keep the call active for 5 minutes
3. Have both users speak periodically

**Success Criteria**:
- ✅ Audio remains stable throughout
- ✅ No audio dropouts or degradation
- ✅ No memory leaks or performance issues
- ✅ Phone doesn't get excessively hot

---

### Test 5: Background/Foreground Transition 📱

**During an active call**:
1. User A presses home button (app goes to background)
2. **EXPECTED**: Audio continues to work
3. User A opens the app again
4. **EXPECTED**: Audio still works, call continues

**Success Criteria**:
- ✅ Audio continues in background
- ✅ No audio interruption when switching
- ✅ Call UI restored correctly

---

### Test 6: Call Rejection & End 📞

**Test 6a - Rejection**:
1. User A calls User B
2. User B rejects the call
3. **EXPECTED**: 
   - User A sees "Call Rejected"
   - Both users return to normal state
   - Audio routing resets

**Test 6b - End Call**:
1. User A calls User B, User B accepts
2. After 30 seconds, User A ends call
3. **EXPECTED**:
   - Call ends for both users
   - Audio routing returns to normal
   - No audio artifacts remain

**Success Criteria**:
- ✅ Clean call termination
- ✅ Resources properly released
- ✅ Ready for next call

---

## 🔍 Step 4: Monitor Logs

Open two terminal windows to monitor logs from both devices:

### Terminal 1 - Device 1 Logs
```bash
adb -s DEVICE_1_ID logcat | grep -E "WebRTC|AudioRoute|InCallManager|Audio"
```

### Terminal 2 - Device 2 Logs
```bash
adb -s DEVICE_2_ID logcat | grep -E "WebRTC|AudioRoute|InCallManager|Audio"
```

### What to Look For:

#### ✅ GOOD Logs (Audio Should Work):
```
🎯 WebRTC: Using InCallManager for audio routing
✅ WebRTC: InCallManager started successfully with earpiece mode
AudioRouteModule: Audio focus granted
AudioRouteModule: Audio routing started with earpiece mode, volume set to [number]
📞 WebRTC: Audio track is live and active - ready for WebRTC
📞 WebRTC: Received remote track: {kind: 'audio', ...}
```

#### ❌ BAD Logs (Indicates Issues):
```
❌ WebRTC: InCallManager.start() failed
❌ WebRTC: No audio track found!
⚠️ WebRTC: Audio track is not live
AudioRouteModule: Audio focus not granted
ERROR: AudioManager not available
```

---

## 📊 Step 5: Verification Checklist

Use this checklist during testing:

```
Device Setup:
[ ] App installed on both devices
[ ] Both devices have microphone permission granted
[ ] Both devices have camera permission granted
[ ] Network connection is stable

Basic Call Test:
[ ] Call initiated successfully
[ ] Call received and accepted
[ ] Video visible on both sides
[ ] Audio audible through earpiece on Device 1
[ ] Audio audible through earpiece on Device 2
[ ] Both users can hear each other simultaneously

Speaker Toggle:
[ ] Speaker button visible during call
[ ] Toggling to speaker works (audio from loudspeaker)
[ ] Toggling back to earpiece works
[ ] Audio quality maintained during toggle

Audio Quality:
[ ] No echo or feedback
[ ] Clear voice quality
[ ] No crackling or distortion
[ ] Proper volume level (not too loud/quiet)

Call Management:
[ ] Mute/unmute works correctly
[ ] Call can be ended from either side
[ ] Resources cleaned up after call end
[ ] Ready for next call immediately

Logs Verification:
[ ] "InCallManager started successfully" in logs
[ ] "Audio focus granted" in logs
[ ] "Audio track is live" in logs
[ ] No error messages in logs
```

---

## 🐛 Troubleshooting

### Issue: No Audio on Mobile

**Check 1**: Verify Rebuild
```bash
# Check if AudioRouteModule was recompiled
cd /app/logistic-calling_webrtc/android
./gradlew app:dependencies | grep AudioRoute

# Verify APK was built with new code
cd app/build/outputs/apk/release
ls -lh  # Check timestamp is recent
```

**Check 2**: Verify Permissions
```bash
# Check granted permissions
adb shell dumpsys package com.coinbase | grep permission
```

Expected permissions:
- android.permission.RECORD_AUDIO: granted=true
- android.permission.MODIFY_AUDIO_SETTINGS: granted=true

**Check 3**: Check Audio Mode
```bash
# During active call, check audio mode
adb shell dumpsys audio | grep "Mode"
```

Expected: `Mode: MODE_IN_COMMUNICATION`

---

### Issue: Audio Works But Distorted

**Solution**: Adjust volume in AudioRouteModule.java
```java
// Change from 0.8 to 0.6 if too loud
int targetVolume = (int)(maxVolume * 0.6);
```

---

### Issue: InCallManager Not Found

**Solution**: Reinstall dependency
```bash
cd /app/logistic-calling_webrtc
npm install react-native-incall-manager --save
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

---

## 📹 Step 6: Record Test Results

For documentation purposes:

```bash
# Record screen during test call
adb shell screenrecord /sdcard/call_test.mp4

# After test, pull the recording
adb pull /sdcard/call_test.mp4 ./test_results/

# Capture logs during test
adb logcat > call_test_logs.txt
```

---

## ✅ Success Criteria Summary

The fix is successful if ALL of these are true:

1. ✅ **Audio works through earpiece** on mobile (not just speaker)
2. ✅ **Both users hear each other** clearly and simultaneously
3. ✅ **Speaker toggle** switches between earpiece and loudspeaker
4. ✅ **No audio dropouts** during 5-minute call
5. ✅ **Logs show** "Audio focus granted" and "InCallManager started"
6. ✅ **Call cleanup** works properly (audio routing resets)
7. ✅ **No echo or feedback** during normal conversation

---

## 📞 Quick Test Command

For rapid testing, use this single command:

```bash
cd /app/logistic-calling_webrtc && \
cd android && ./gradlew clean && cd .. && \
npx react-native run-android && \
adb logcat | grep -E "WebRTC|AudioRoute|InCallManager"
```

This will:
1. Clean previous builds
2. Rebuild and install app
3. Show relevant logs in real-time

---

## 🎯 Expected Timeline

- **Rebuild**: 5-10 minutes
- **Install on devices**: 2-3 minutes  
- **Basic call test**: 2 minutes
- **Full test suite**: 15-20 minutes
- **Total**: ~30 minutes for complete verification

---

## 📝 Test Report Template

After testing, document results:

```
# Test Report - Mobile Audio Fix

Date: [DATE]
Tester: [NAME]
Devices: 
  - Device 1: [MODEL, ANDROID VERSION]
  - Device 2: [MODEL, ANDROID VERSION]

## Results

Basic Audio Test: [PASS/FAIL]
- Earpiece audio: [PASS/FAIL]
- Audio quality: [GOOD/FAIR/POOR]
- Notes: [Any observations]

Speaker Toggle: [PASS/FAIL]
- Notes: [Any observations]

Long Duration: [PASS/FAIL]
- Duration tested: [X minutes]
- Notes: [Any observations]

Overall: [PASS/FAIL]

## Issues Found
[List any issues]

## Logs
[Attach relevant logs]
```

---

**Need Help?** Check logs for specific error messages and refer to the troubleshooting section above.
