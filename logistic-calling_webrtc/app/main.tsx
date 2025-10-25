/*** 
 * Initialize redux store, routes, configs
 * @format
 */

import * as React from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import '@app/language/i18n'; // ✅ Initialize i18n first

import { Navigator } from '@app/navigator';
import { store, persistor } from '@app/redux';
import { Colors } from './styles';
import SplashScreen from 'react-native-splash-screen';
import { webrtcService } from './service/webrtc-service';
import { CallEventEmitter } from './helpers/call-event-emitter';
import { NavigationService } from './helpers/navigation-service';

LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

function MainApp() {
      React.useEffect(() => {
          SplashScreen.hide(); // Hide the splash screen after the component mounts
          // Initialize WebRTC service - will be initialized when first used
          webrtcService.init();
      }, []);
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
                    <SafeAreaView style={{ flex: 1,backgroundColor:Colors.background
                     }}>

          <Navigator   />
          </SafeAreaView>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}

export { MainApp };
