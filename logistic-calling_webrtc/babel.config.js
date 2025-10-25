module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@app': './app',
          'react-native-nitro-sound': './app/mocks/react-native-nitro-sound',
          'react-native-reanimated': './app/mocks/react-native-reanimated',
          'react-native-screens': './app/mocks/react-native-screens',
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    ],
    // Temporarily comment out reanimated plugin to avoid build issues
    // 'react-native-reanimated/plugin',
  ],
};