// Mock implementation for react-native-nitro-sound
// This is a temporary fallback to allow the app to build without nitro-modules

export class Sound {
  static setCategory(category: string) {
    console.log('Sound.setCategory called with:', category);
  }

  static async prepare(source: any) {
    console.log('Sound.prepare called');
    return new Sound();
  }

  async play() {
    console.log('Sound.play called');
  }

  async pause() {
    console.log('Sound.pause called');
  }

  async stop() {
    console.log('Sound.stop called');
  }

  async release() {
    console.log('Sound.release called');
  }

  setVolume(volume: number) {
    console.log('Sound.setVolume called with:', volume);
  }

  setLoop(loop: boolean) {
    console.log('Sound.setLoop called with:', loop);
  }
}

export const createSound = (source: any) => {
  console.log('createSound called');
  return new Sound();
};

export const useSound = (source: any) => {
  console.log('useSound called');
  return {
    sound: new Sound(),
    play: () => console.log('useSound.play called'),
    pause: () => console.log('useSound.pause called'),
    stop: () => console.log('useSound.stop called'),
  };
};

export default Sound;

// Additional exports for compatibility
export const AudioSet = {
  Playback: 'playback',
  Recording: 'recording',
};

export const AudioEncoderAndroidType = {
  AAC: 'aac',
  AMR_NB: 'amr_nb',
  AMR_WB: 'amr_wb',
};

export const AudioSourceAndroidType = {
  MIC: 'mic',
  VOICE_UPLINK: 'voice_uplink',
  VOICE_DOWNLINK: 'voice_downlink',
};

export const AVEncoderAudioQualityIOSType = {
  MIN: 'min',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  MAX: 'max',
};
