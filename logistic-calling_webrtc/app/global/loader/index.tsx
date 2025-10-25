/**
 * App loader
 * @format
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useSelector } from 'react-redux';

import { selectLoader } from '@app/module/common';
import { getStyles } from './styles';

const Loader = () => {
  const styles = getStyles();
  const visible = useSelector(selectLoader);

  console.log('Loader component - visible:', visible);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.loaderContent}> */}
        <ActivityIndicator size="large" color="#E67932" />
        <Text style={styles.loadingText}>Loading...</Text>
      {/* </View> */}
    </View>
  );
};

export { Loader };
