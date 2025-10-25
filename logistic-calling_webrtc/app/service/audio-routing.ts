import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

const { AudioRouteModule } = NativeModules;

class AudioRouting {
  private isAudioActive: boolean = false;
  private nativeModuleAvailable: boolean = false;

  constructor() {
    // Check if native module is available
    this.nativeModuleAvailable = AudioRouteModule !== null && AudioRouteModule !== undefined;
    if (this.nativeModuleAvailable) {
      console.log('✅ AudioRoute: Native AudioRouteModule is available!');
    } else {
      console.warn('⚠️ AudioRoute: Native AudioRouteModule not available - check if APK was rebuilt');
    }
  }

  async setSpeakerOn(enabled: boolean): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('AudioRoute: Only available on Android');
      return false;
    }

    try {
      if (this.nativeModuleAvailable && AudioRouteModule.setSpeakerOn) {
        console.log(`🔊 AudioRoute: Setting speaker to ${enabled} via NATIVE module`);
        AudioRouteModule.setSpeakerOn(enabled);
        console.log(`✅ AudioRoute: Speaker ${enabled ? 'ON' : 'OFF'} via native AudioManager`);
        return true;
      } else {
        console.warn(`⚠️ AudioRoute: Native module not available - speaker ${enabled} NOT applied`);
        return false;
      }
    } catch (error) {
      console.error('❌ AudioRoute: Error setting speaker:', error);
      return false;
    }
  }

  async startAudioRouting(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('AudioRoute: Only available on Android');
      return false;
    }

    try {
      const hasPermission = await this.ensureAudioPermissions();
      if (!hasPermission) {
        console.warn('AudioRoute: Audio permissions not granted');
        return false;
      }

      if (this.nativeModuleAvailable && AudioRouteModule.startAudioRouting) {
        console.log('🔊 AudioRoute: Starting audio routing via NATIVE module');
        AudioRouteModule.startAudioRouting();
        this.isAudioActive = true;
        console.log('✅ AudioRoute: Audio routing started via native AudioManager');
        return true;
      } else {
        console.warn('⚠️ AudioRoute: Native module not available - audio routing NOT started');
        return false;
      }
    } catch (error) {
      console.error('❌ AudioRoute: Error starting audio routing:', error);
      return false;
    }
  }

  async stopAudioRouting(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      if (this.nativeModuleAvailable && AudioRouteModule.stopAudioRouting) {
        console.log('🔊 AudioRoute: Stopping audio routing via NATIVE module');
        AudioRouteModule.stopAudioRouting();
        this.isAudioActive = false;
        console.log('✅ AudioRoute: Audio routing stopped via native AudioManager');
        return true;
      } else {
        this.isAudioActive = false;
        console.log('✅ AudioRoute: Audio routing stopped (no native module)');
        return false;
      }
    } catch (error) {
      console.error('❌ AudioRoute: Error stopping audio routing:', error);
      return false;
    }
  }

  private async ensureAudioPermissions(): Promise<boolean> {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Audio Permission',
          message: 'App needs access to your microphone for calls',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('AudioRoute: Permission error:', err);
      return false;
    }
  }

  isAvailable(): boolean {
    return Platform.OS === 'android' && this.nativeModuleAvailable;
  }
}

export const audioRouting = new AudioRouting();
