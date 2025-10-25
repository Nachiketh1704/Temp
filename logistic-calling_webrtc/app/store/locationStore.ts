import { create } from 'zustand';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

type LocationState = {
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  } | null;
  locationPermission: boolean;
  isTracking: boolean;
  error: string | null;
  
  // Actions
  requestLocationPermission: () => Promise<boolean>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  updateLocation: (latitude: number, longitude: number, heading?: number) => void;
};

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  locationPermission: false,
  isTracking: false,
  error: null,
  
  requestLocationPermission: async () => {
    try {
      console.log('📍 LocationStore: Requesting location permission for platform:', Platform.OS);
      
      if (Platform.OS === 'web') {
        console.log('📍 LocationStore: Web platform - granting permission automatically');
        set({ locationPermission: true });
        return true;
      }
      
      let hasPermission = true;
      if (Platform.OS === 'ios') {
        console.log('📍 LocationStore: iOS platform - requesting authorization...');
        try {
          // Use the standard iOS authorization approach
          Geolocation.requestAuthorization();
          
          // Check if we can get location by trying to get current position
          const canGetLocation = await new Promise((resolve) => {
            Geolocation.getCurrentPosition(
              () => {
                console.log('📍 LocationStore: iOS - Can get location');
                resolve(true);
              },
              (error) => {
                console.log('📍 LocationStore: iOS - Cannot get location, error:', error.code, error.message);
                resolve(false);
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
            );
          });
          
          hasPermission = canGetLocation;
          console.log('📍 LocationStore: iOS permission result:', hasPermission);
        } catch (error) {
          console.error('📍 LocationStore: iOS permission error:', error);
          hasPermission = false;
        }
      } else if (Platform.OS === 'android') {
        console.log('📍 LocationStore: Android platform - requesting runtime permission...');
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location to show your current position.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          console.log('📍 LocationStore: Android permission result:', granted);
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (error) {
          console.error('📍 LocationStore: Android permission error:', error);
          hasPermission = false;
        }
      }
      
      console.log('📍 LocationStore: Final permission status:', hasPermission);
      set({ locationPermission: hasPermission });
      
      if (!hasPermission) {
        console.log('📍 LocationStore: Permission denied');
        set({ error: 'Permission to access location was denied' });
      }
      return hasPermission;
    } catch (error) {
      console.error('📍 LocationStore: Error requesting permission:', error);
      set({ error: 'Error requesting location permission' });
      return false;
    }
  },
  
  startLocationTracking: async () => {
    const { locationPermission, isTracking } = get();
    
    console.log('📍 LocationStore: Starting location tracking...');
    console.log('📍 LocationStore: Permission:', locationPermission, 'Already tracking:', isTracking);
    
    if (!locationPermission) {
      console.log('📍 LocationStore: No permission, requesting...');
      const granted = await get().requestLocationPermission();
      console.log('📍 LocationStore: Permission granted:', granted);
      if (!granted) return;
    }
    
    if (isTracking) {
      console.log('📍 LocationStore: Already tracking, skipping...');
      return;
    }
    
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation API for web
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            console.log('📍 LocationStore: Web - Position received:', position.coords);
            console.log('📍 LocationStore: Web - Heading from GPS:', position.coords.heading);
            set({
              currentLocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp,
                heading: position.coords.heading || undefined,
              },
              error: null,
            });
          },
          (error) => {
            console.error('📍 LocationStore: Web - Position error:', error);
            set({ error: error.message });
          },
          { enableHighAccuracy: true } // Removed distanceFilter for web
        );
        // Store watchId if you want to clear it later
      } else {
        // Use RN Geolocation for native platforms
        const watchId = Geolocation.watchPosition(
          (position) => {
            console.log('📍 LocationStore: Native - Position received:', position.coords);
            console.log('📍 LocationStore: Heading from GPS:', position.coords.heading);
            set({
              currentLocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp,
                heading: position.coords.heading || undefined,
              },
              error: null,
            });
          },
          (error) => {
            console.error('📍 LocationStore: Native - Position error:', error);
            set({ error: error.message });
          },
          { enableHighAccuracy: true, distanceFilter: 1, interval: 5000, fastestInterval: 2000 }
        );
        // Store watchId if you want to clear it later
      }
      set({ isTracking: true });
    } catch (error) {
      set({ error: 'Error starting location tracking', isTracking: false });
    }
  },
  
  stopLocationTracking: () => {
    // In a real app, you should clear the watch using the watchId
    set({ isTracking: false });
  },
  
  updateLocation: (latitude: number, longitude: number, heading?: number) => {
    set({
      currentLocation: {
        latitude,
        longitude,
        timestamp: Date.now(),
        heading,
      },
    });
  },
}));