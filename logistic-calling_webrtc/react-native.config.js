module.exports = {
  dependencies: {
    'react-native-nitro-modules': {
      platforms: {
        android: null, // Exclude from Android build
        ios: null,
      },
    },
    'react-native-nitro-sound': {
      platforms: {
        android: null, // Exclude from Android build
        ios: null,
      },
    },
    'react-native-reanimated': {
      platforms: {
        android: null, // Exclude from Android build - CMake issues
        ios: null,
      },
    },
    'react-native-screens': {
      platforms: {
        android: null, // Exclude from Android build - CMake issues
        ios: null,
      },
    },
  },
};
