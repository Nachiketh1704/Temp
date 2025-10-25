/**
 * Notification Service
 * Handles all notification-related functionality
 */

import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onMessage,
  getMessaging,
  AuthorizationStatus,
  requestPermission,
  getToken,
  onTokenRefresh,
  hasPermission,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

const messaging = getMessaging();

class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  public async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await this.requestUserIosPermission();
      } else {
        await this.requestUserAndroidPermission();
      }

      await this.handleTokenRefresh();
      const unsubscribe = this.setupForegroundMessageHandler();

      // Store unsubscribe function for cleanup if needed
      if (unsubscribe) {
        // You can store this for cleanup later if needed
        console.log('Foreground message handler setup complete');
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Request notification permission for Android
   */
  private async requestUserAndroidPermission(): Promise<void> {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
        return;
      }
    }

    // Request FCM permission
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted:', authStatus);
      await this.getFcmToken();
    } else {
      console.log('Permission not granted');
    }
  }

  /**
   * Request notification permission for iOS
   */
  private async requestUserIosPermission(): Promise<void> {
    try {
      console.log('Requesting iOS notification permission...');
      
      // First check current permission status
      const currentStatus = await hasPermission(messaging);
      console.log('Current iOS permission status:', currentStatus);
      
      if (currentStatus === AuthorizationStatus.AUTHORIZED) {
        console.log('iOS notification permission already granted');
        await this.getFcmToken();
        return;
      }
      
      // Request permission
      const authorizationStatus = await requestPermission(messaging);
      console.log('iOS Permission request result:', authorizationStatus);
      
      if (authorizationStatus === AuthorizationStatus.AUTHORIZED || 
          authorizationStatus === AuthorizationStatus.PROVISIONAL) {
        console.log('iOS notification permission granted');
        await this.getFcmToken();
      } else {
        console.log('iOS notification permission denied:', authorizationStatus);
      }
    } catch (error) {
      console.error('Error requesting iOS notification permission:', error);
    }
  }

  /**
   * Get FCM token
   */
  private async getFcmToken(): Promise<void> {
    try {
      const token = await getToken(messaging);
      if (token) {
        this.fcmToken = token;
        console.log('FCM Token:', token);
        await AsyncStorage.setItem('fcm_token', token);
      } else {
        console.log('Failed to get FCM token');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  /**
   * Handle FCM token refresh
   */
  private async handleTokenRefresh(): Promise<void> {
    onTokenRefresh(messaging, async newToken => {
      console.log('New FCM Token:', newToken);
      this.fcmToken = newToken;
      await AsyncStorage.setItem('fcm_token', newToken);
    });
  }

  /**
   * Setup foreground message handler
   */
  private setupForegroundMessageHandler(): (() => void) | undefined {
    const unsubscribe = onMessage(messaging, async remoteMessage => {
      console.log('Foreground Notification:', remoteMessage);

      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
    });

    // Create notification channel
    notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    return unsubscribe;
  }

  /**
   * Display local notification
   */
  public async displayLocalNotification(
    title: string,
    body: string,
  ): Promise<void> {
    try {
      // Request permission for local notifications
      await notifee.requestPermission();

      // Create a channel (required for Android)
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display notification
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  }

  /**
   * Get current FCM token
   */
  public getCurrentFcmToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Get stored FCM token from AsyncStorage
   */
  public async getStoredFcmToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('fcm_token');
    } catch (error) {
      console.error('Error getting stored FCM token:', error);
      return null;
    }
  }

  /**
   * Clear stored FCM token
   */
  public async clearFcmToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('fcm_token');
      this.fcmToken = null;
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  }

  /**
   * Check if notification permission is granted
   */
  public async checkPermissionStatus(): Promise<boolean> {
    try {
      const authStatus = await hasPermission(messaging);
      return (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Error checking permission status:', error);
      return false;
    }
  }

  /**
   * Manually request notification permission (can be called from UI)
   */
  public async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        await this.requestUserIosPermission();
        const status = await hasPermission(messaging);
        return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
      } else {
        await this.requestUserAndroidPermission();
        const status = await hasPermission(messaging);
        return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('Error manually requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Setup background message handler
   */
  public setupBackgroundMessageHandler(): void {
    setBackgroundMessageHandler(messaging, async remoteMessage => {
      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
        },
      });
    });
  }
}

// Export singleton instance
export default NotificationService.getInstance();
