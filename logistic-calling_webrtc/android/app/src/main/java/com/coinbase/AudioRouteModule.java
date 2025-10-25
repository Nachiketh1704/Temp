package com.coinbase;

import android.content.Context;
import android.media.AudioManager;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class AudioRouteModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AudioRouteModule";
    private AudioManager audioManager;

    public AudioRouteModule(ReactApplicationContext reactContext) {
        super(reactContext);
        audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
    }

    @Override
    public String getName() {
        return "AudioRouteModule";
    }

    @ReactMethod
    public void setSpeakerOn(boolean enabled, Promise promise) {
        try {
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                audioManager.setSpeakerphoneOn(enabled);
                Log.d(TAG, "Speaker set to: " + enabled);
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "AudioManager not available");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting speaker", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startAudioRouting(Promise promise) {
        try {
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                audioManager.setSpeakerphoneOn(true);
                audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, 
                    audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL), 0);
                Log.d(TAG, "Audio routing started");
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "AudioManager not available");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting audio routing", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopAudioRouting(Promise promise) {
        try {
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_NORMAL);
                audioManager.setSpeakerphoneOn(false);
                Log.d(TAG, "Audio routing stopped");
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "AudioManager not available");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping audio routing", e);
            promise.reject("ERROR", e.getMessage());
        }
    }
}
