package com.coinbase;

import android.content.Context;
import android.media.AudioManager;
import android.media.AudioFocusRequest;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class AudioRouteModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AudioRouteModule";
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private AudioManager.OnAudioFocusChangeListener focusChangeListener;

    public AudioRouteModule(ReactApplicationContext reactContext) {
        super(reactContext);
        audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        
        // Create audio focus change listener
        focusChangeListener = new AudioManager.OnAudioFocusChangeListener() {
            @Override
            public void onAudioFocusChange(int focusChange) {
                switch (focusChange) {
                    case AudioManager.AUDIOFOCUS_GAIN:
                        Log.d(TAG, "Audio focus gained");
                        break;
                    case AudioManager.AUDIOFOCUS_LOSS:
                        Log.d(TAG, "Audio focus lost");
                        break;
                    case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                        Log.d(TAG, "Audio focus lost temporarily");
                        break;
                    case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                        Log.d(TAG, "Audio focus lost, can duck");
                        break;
                }
            }
        };
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
                // Request audio focus for voice call
                int result;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                            .setOnAudioFocusChangeListener(focusChangeListener)
                            .build();
                    result = audioManager.requestAudioFocus(audioFocusRequest);
                } else {
                    result = audioManager.requestAudioFocus(
                            focusChangeListener,
                            AudioManager.STREAM_VOICE_CALL,
                            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
                }
                
                if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                    Log.d(TAG, "Audio focus granted");
                } else {
                    Log.w(TAG, "Audio focus not granted");
                }
                
                // Set to IN_COMMUNICATION mode for call audio
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                // Start with earpiece (false) by default - natural call mode
                audioManager.setSpeakerphoneOn(false);
                // Set the volume to maximum for clear audio
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL);
                int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_VOICE_CALL);
                Log.d(TAG, "Current volume: " + currentVolume + ", Max volume: " + maxVolume);
                
                // Set to 80% of max volume for good quality without distortion
                int targetVolume = (int)(maxVolume * 0.8);
                audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, targetVolume, 0);
                Log.d(TAG, "Audio routing started with earpiece mode, volume set to " + targetVolume);
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
                // Abandon audio focus
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                    audioManager.abandonAudioFocusRequest(audioFocusRequest);
                } else {
                    audioManager.abandonAudioFocus(focusChangeListener);
                }
                
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
