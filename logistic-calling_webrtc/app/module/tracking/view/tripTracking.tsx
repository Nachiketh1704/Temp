import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import MapView, { Marker, MarkerAnimated, Polyline } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  CheckCircle,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Locate,
  Route,
  Play,
  Pause,
  Square,
  Truck,
  Package,
  Home,
  ArrowLeft,
  Navigation,
  TruckElectric,
  TruckIcon,
} from "lucide-react-native";

// Screens
import { Colors, useThemedStyle } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { useJobStore } from "@app/store/jobStore";
import { useLocationStore } from "@app/store/locationStore";
import { Job } from "@app/types";
import { Button } from "@app/components/Button";
import { getStyles } from "./tripTrackingStyles";
import { GOOGLE_MAPS_API_KEY } from "@app/configs";
import {
  sendLiveLocation,
  createLiveLocationData,
} from "@app/service/location-service";
import { selectProfile } from "@app/module/common";
import { useSelector } from "react-redux";
import { socketService } from "@app/service/socket-service";

const { width, height } = Dimensions.get("window");

interface TripMilestone {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  timestamp?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  distance: string;
  duration: string;
  coordinates: RouteCoordinates[];
}

function TripTrackingScreen() {
  const styles = useThemedStyle(getStyles);
  const route = useRoute();
  const navigation = useNavigation();
  const profileData = useSelector(selectProfile);
  const userRole = profileData?.roles?.[0]?.role?.name;
  const { userProfile } = useAuthStore();
  const { jobs } = useJobStore();
  const {
    currentLocation,
    locationPermission,
    requestLocationPermission,
    startLocationTracking,
  } = useLocationStore();

  // Get job data from navigation params
  const { job: passedJob } = route.params as { job?: Job; jobId?: string };

  const [selectedJob, setSelectedJob] = useState(null);
  const [tripStarted, setTripStarted] = useState(false);
  const [tripPaused, setTripPaused] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(0);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7589,
    longitude: -73.9851,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [distanceToDelivery, setDistanceToDelivery] = useState<number | null>(
    null
  );
  const [etaToPickup, setEtaToPickup] = useState<string | null>(null);
  const [etaToDelivery, setEtaToDelivery] = useState<string | null>(null);

  // Route coordinates state
  const [pickupRouteInfo, setPickupRouteInfo] = useState<RouteInfo | null>(
    null
  );
  const [deliveryRouteInfo, setDeliveryRouteInfo] = useState<RouteInfo | null>(
    null
  );
  const [completeRouteInfo, setCompleteRouteInfo] = useState<RouteInfo | null>(
    null
  );
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLocationUpdating, setIsLocationUpdating] = useState(false);
  const [trackedDriverLocation, setTrackedDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>(null);

  const [driverSocketLocation, setDriverSocketLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
    heading?: number;
  } | null>(null);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const liveLocationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const continuousLocationRef = useRef<NodeJS.Timeout | null>(null);
  const locationSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to get the correct location based on user role
  const getLocationForMap = useMemo(() => {
    if (userRole === "driver") {
      // Driver uses their own current location
      return (
        currentLocation || {
          latitude: 40.7589,
          longitude: -73.9851,
          timestamp: Date.now(),
        }
      );
    } else {
      // Non-driver users use the tracked driver's location
      return (
        trackedDriverLocation || {
          latitude: 40.7589,
          longitude: -73.9851,
          timestamp: Date.now(),
        }
      );
    }
  }, [userRole, currentLocation, trackedDriverLocation]);

  // Track driver socket location changes
  useEffect(() => {
    if (driverSocketLocation) {
      // Driver socket location updated
    }
  }, [driverSocketLocation]);

  // Calculate coordinates for map markers - reactive to location changes
  const coordinates = useMemo(() => {
    const driverLocation = getLocationForMap;
    const jobToUse = selectedJob || {
      pickupLocation: {
        lat: 40.7505,
        lng: -73.9934,
        address: "123 Main St, New York, NY",
      },
      dropoffLocation: {
        lat: 40.7282,
        lng: -73.9942,
        address: "321 Corporate Plaza, Manhattan, NY 10003",
      },
    };

    console.log("📍 TripTracking: Calculating coordinates:", {
      userRole,
      driverLocation,
      trackedDriverLocation,
      currentLocation,
    });
    
    console.log("📍 TripTracking: Heading data:", {
      driverLocationHeading: driverLocation?.heading,
      trackedDriverLocationHeading: trackedDriverLocation?.heading,
      currentLocationHeading: currentLocation?.heading,
    });

    // For drivers: show their own location + pickup + drop
    // For carriers/brokers/shippers: show only driver location + pickup + drop (no current location)
    const markers = [];

    // Add driver location marker
    if (userRole === "driver") {
      // Driver sees their own location
      markers.push({
        latitude: driverLocation?.latitude,
        longitude: driverLocation?.longitude,
        title: "Your Location",
        description: currentLocation
          ? "Current driver location"
          : "Default location",
        type: "driver",
        heading: driverLocation?.heading,
      });
    } else {
      // Non-driver users see the tracked driver's location
      if (trackedDriverLocation) {
        markers.push({
          latitude: trackedDriverLocation?.latitude,
          longitude: trackedDriverLocation?.longitude,
          title: "Driver Location",
          description: `Live driver location (${new Date(
            trackedDriverLocation.timestamp
          ).toLocaleTimeString()})`,
          type: "driver",
          heading: trackedDriverLocation?.heading,
        });
      } else {
        // Show default driver location if no tracked location yet
        markers.push({
          latitude: driverLocation?.latitude,
          longitude: driverLocation?.longitude,
          title: "Driver Location",
          description: "Waiting for driver location",
          type: "driver",
          heading: driverLocation?.heading,
        });
      }
    }

    // Add pickup location
    markers.push({
      latitude: jobToUse?.pickupLocation?.lat,
      longitude: jobToUse?.pickupLocation?.lng,
      title: "Pickup Location",
      description: jobToUse.pickupLocation.address,
      type: "pickup",
    });

    // Add delivery location
    markers.push({
      latitude: jobToUse?.dropoffLocation?.lat,
      longitude: jobToUse?.dropoffLocation?.lng,
      title: "Delivery Location",
      description: jobToUse.dropoffLocation.address,
      type: "delivery",
    });

    return markers.filter(
      (coord) => coord?.latitude !== 0 && coord?.longitude !== 0
    );
  }, [userRole, currentLocation, trackedDriverLocation, selectedJob]);

  // Function to send live location data with debouncing
  const sendLiveLocationData = (latitude: number, longitude: number) => {
    // Clear previous timeout
    if (liveLocationTimeoutRef.current) {
      clearTimeout(liveLocationTimeoutRef.current);
    }

    // Only send if user is a driver
    if (userRole === "driver") {
      // Debounce the API call to avoid too many requests
      liveLocationTimeoutRef.current = setTimeout(async () => {
        try {
          const locationData = {
            lat: latitude,
            lng: longitude,
            accuracy: 5.2,
            heading: 180,
            speed: 65.5,
            battery: 85,
            provider: "gps",
          };

          await sendLiveLocation(locationData);
        } catch (error) {
          console.error("Error sending live location:", error);
        }
      }, 2000);
    }
  };

  // Trip milestones based on job status
  const tripMilestones: TripMilestone[] = [
    {
      id: "start",
      title: "Trip Started",
      description: "Begin your delivery trip",
      status: "pending",
    },
    {
      id: "enroute_pickup",
      title: "En Route to Pickup",
      description: "Heading to pickup location",
      status: "pending",
    },
    {
      id: "arrived_pickup",
      title: "Arrived at Pickup",
      description: "Reached pickup location",
      status: "pending",
    },
    {
      id: "loaded",
      title: "Cargo Loaded",
      description: "Cargo has been loaded",
      status: "pending",
    },
    {
      id: "enroute_delivery",
      title: "En Route to Delivery",
      description: "Heading to delivery location",
      status: "pending",
    },
    {
      id: "arrived_delivery",
      title: "Arrived at Delivery",
      description: "Reached delivery location",
      status: "pending",
    },
    {
      id: "delivered",
      title: "Cargo Delivered",
      description: "Cargo has been delivered",
      status: "pending",
    },
  ];

  // Replace with your actual Google Maps API Key

  // Function to get route from Google Directions API (two points)
  // const getRouteFromDirectionsAPI = async (
  //   origin: { latitude: number; longitude: number },
  //   destination: { latitude: number; longitude: number }
  // ): Promise<RouteInfo | null> => {
  //   try {
  //     const originStr = `${origin?.latitude},${origin?.longitude}`;
  //     const destinationStr = `${destination?.latitude},${destination?.longitude}`;

  //     const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

  //     console.log("Fetching route from Directions API...");
  //     const response = await fetch(url);
  //     const data = await response.json();

  //     if (data.status === "OK") {
  //       const route = data.routes[0];
  //       const leg = route.legs[0];

  //       // Decode polyline points
  //       const points = route.overview_polyline.points;
  //       const coordinates = decodePolyline(points);

  //       console.log("🗺️ Individual route details:", {
  //         coordinatesCount: coordinates.length,
  //         distance: leg.distance.text,
  //         duration: leg.duration.text,
  //       });

  //       return {
  //         distance: leg.distance.text,
  //         duration: leg.duration.text,
  //         coordinates: coordinates,
  //       };
  //     } else {
  //       console.warn("Directions API error:", data.status, data.error_message);
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error("Error fetching route from Directions API:", error);
  //     return null;
  //   }
  // };
  const getRouteFromDirectionsAPI = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    waypoints: { latitude: number; longitude: number }[] = [],
    mapRef?: React.RefObject<MapView>
  ): Promise<RouteInfo | null> => {
    try {
      const body = {
        origin: {
          location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } },
        },
        destination: {
          location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } },
        },
        intermediates: waypoints.map((w) => ({
          location: { latLng: { latitude: w.latitude, longitude: w.longitude } },
        })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE_OPTIMAL",
        // ✅ Correct field name is `vehicleInfo` → `vehicleInfo`
        // ✅ but vehicle type must be inside `routeModifiers.vehicleInfo`
        routeModifiers: {
          avoidTolls: false,
          avoidFerries: true,
          avoidHighways: false,
          vehicleInfo: {
            vehicleType: "TRUCK",
            heightMeters: 4.2,
            widthMeters: 2.5,
            lengthMeters: 12,
            weightKilograms: 10000,
          },
        },
        polylineQuality: "HIGH_QUALITY",
        computeAlternativeRoutes: false,
        // Request more detailed polyline with more intermediate points
        fieldMask: "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs,routes.polyline",
        // ✅ departure_time should be RFC3339 timestamp (ISO string)
        // departureTime: new Date().toISOString(),
        languageCode: "en",
        units: "METRIC",
      };
  
      console.log("🚛 Fetching Truck Route (Fixed Routes API v2)...");
      
      // For now, let's force use Directions API v1 for better polyline detail
      console.log("🗺️ Using Directions API v1 for better polyline detail");
      const waypointsParam = waypoints.length > 0 ? `&waypoints=${waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')}` : '';
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&mode=driving&avoid=ferries&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(directionsUrl);
      const data = await response.json();
      
      console.log("🗺️ Directions API v1 Response:", data);
      
      if (data.status === "OK" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Use detailed step polylines from Directions API v1
        let allCoordinates: RouteCoordinates[] = [];
        
        for (const leg of route.legs) {
          if (leg.steps && leg.steps.length > 0) {
            for (const step of leg.steps) {
              if (step.polyline && step.polyline.points) {
                const stepCoordinates = decodePolyline(step.polyline.points);
                allCoordinates = allCoordinates.concat(stepCoordinates);
              }
            }
          }
        }
        
        // Fallback to overview if no detailed coordinates
        if (allCoordinates.length === 0) {
          console.log("⚠️ No detailed step coordinates, using overview");
          const points = route.overview_polyline.points;
          const rawCoordinates = decodePolyline(points);
          allCoordinates = interpolatePolyline(rawCoordinates, 0.0003);
        } else {
          console.log("✅ Using detailed step coordinates from Directions API v1");
          allCoordinates = interpolatePolyline(allCoordinates, 0.0003);
        }
        
        const coordinates = allCoordinates;
        
        const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
        const totalDurationSec = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
        
        console.log("🗺️ Directions API v1 - Step coordinates:", allCoordinates.length);
        console.log("🗺️ Directions API v1 - Interpolated coordinates:", coordinates.length);
        console.log("🗺️ Directions API v1 - First few coordinates:", coordinates.slice(0, 3));
        console.log("🗺️ Directions API v1 - Last few coordinates:", coordinates.slice(-3));

        if (mapRef?.current && coordinates.length > 0) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }
  
        const distanceKm = (totalDistance / 1000).toFixed(1) + " km";
        const durationMin = Math.round(totalDurationSec / 60);
  
        console.log("✅ Truck Route Summary:", {
          distance: distanceKm,
          duration: `${durationMin} mins`,
          coordinatesCount: coordinates.length,
        });
  
        return {
          distance: distanceKm,
          duration: `${durationMin} mins`,
          durationInTraffic: `${durationMin} mins`,
          coordinates,
        };
      } else {
        console.warn("⚠️ No truck route found in Routes API v2, trying Directions API v1 fallback");
        
        // Fallback to Google Directions API v1 for more detailed polylines
        try {
          const waypointsParam = waypoints.length > 0 ? `&waypoints=${waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')}` : '';
          const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&mode=driving&avoid=ferries&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;
          
          console.log("🗺️ Trying Directions API v1 fallback:", directionsUrl);
          const directionsResponse = await fetch(directionsUrl);
          const directionsData = await directionsResponse.json();
          
          if (directionsData.routes && directionsData.routes.length > 0) {
            const route = directionsData.routes[0];
            
            // Use detailed step polylines instead of overview
            let allCoordinates: RouteCoordinates[] = [];
            
            for (const leg of route.legs) {
              if (leg.steps && leg.steps.length > 0) {
                for (const step of leg.steps) {
                  if (step.polyline && step.polyline.points) {
                    const stepCoordinates = decodePolyline(step.polyline.points);
                    allCoordinates = allCoordinates.concat(stepCoordinates);
                  }
                }
              }
            }
            
            // Fallback to overview if no detailed coordinates
            if (allCoordinates.length === 0) {
              console.log("⚠️ No detailed step coordinates, using overview");
              const points = route.overview_polyline.points;
              const rawCoordinates = decodePolyline(points);
              allCoordinates = interpolatePolyline(rawCoordinates, 0.0003);
            } else {
              console.log("✅ Using detailed step coordinates from Directions API");
              allCoordinates = interpolatePolyline(allCoordinates, 0.0003);
            }
            
            const coordinates = allCoordinates;
            
            console.log("🗺️ Directions API v1 fallback - coordinates:", coordinates.length);
            
            const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
            const totalDuration = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
            const distanceKm = (totalDistance / 1000).toFixed(1) + " km";
            const durationMin = Math.round(totalDuration / 60);
            
            return {
              distance: distanceKm,
              duration: `${durationMin} mins`,
              durationInTraffic: `${durationMin} mins`,
              coordinates,
            };
          }
        } catch (fallbackError) {
          console.error("❌ Fallback Directions API also failed:", fallbackError);
        }
        
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching truck route:", error);
      return null;
    }
  };
  // Function to get complete route with waypoints (driver → pickup → drop-off)
  const getCompleteRouteWithWaypoints = async (
    driverLocation: { latitude: number; longitude: number },
    pickupLocation: { latitude: number; longitude: number },
    dropoffLocation: { latitude: number; longitude: number }
  ): Promise<{
    pickupRoute: RouteInfo | null;
    deliveryRoute: RouteInfo | null;
    completeRoute: RouteInfo | null;
  }> => {
    try {
      console.log("🗺️ Fetching complete route with waypoints...");

      // Get individual routes
      const pickupRoute = await getRouteFromDirectionsAPI(
        driverLocation,
        pickupLocation
      );
      const deliveryRoute = await getRouteFromDirectionsAPI(
        pickupLocation,
        dropoffLocation
      );

      // Get complete route with waypoints
      const originStr = `${driverLocation?.latitude},${driverLocation?.longitude}`;
      const waypointStr = `${pickupLocation?.latitude},${pickupLocation?.longitude}`;
      const destinationStr = `${dropoffLocation?.latitude},${dropoffLocation?.longitude}`;

      const completeUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&waypoints=${waypointStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

      console.log("🗺️ Fetching complete route with waypoints...");
      const response = await fetch(completeUrl);
      const data = await response.json();

      let completeRoute: RouteInfo | null = null;

      if (data.status === "OK") {
        const route = data.routes[0];
        const leg1 = route.legs[0]; // Driver to pickup
        const leg2 = route.legs[1]; // Pickup to drop-off

        // Use detailed polylines from individual legs instead of overview
        let allCoordinates: RouteCoordinates[] = [];
        
        // Process each leg with detailed polylines
        for (const leg of route.legs) {
          if (leg.steps && leg.steps.length > 0) {
            for (const step of leg.steps) {
              if (step.polyline && step.polyline.points) {
                const stepCoordinates = decodePolyline(step.polyline.points);
                allCoordinates = allCoordinates.concat(stepCoordinates);
              }
            }
          }
        }
        
        // If no detailed coordinates, fallback to overview polyline
        if (allCoordinates.length === 0) {
          console.log("⚠️ No detailed coordinates, using overview polyline");
          const points = route.overview_polyline.points;
          const rawCoordinates = decodePolyline(points);
          allCoordinates = interpolatePolyline(rawCoordinates, 0.0003);
        } else {
          console.log("✅ Using detailed leg coordinates");
          allCoordinates = interpolatePolyline(allCoordinates, 0.0003);
        }
        
        const coordinates = allCoordinates;

        console.log("🗺️ Route details:", {
          coordinatesCount: coordinates.length,
          firstCoordinate: coordinates[0],
          lastCoordinate: coordinates[coordinates.length - 1],
          leg1Distance: leg1.distance.text,
          leg2Distance: leg2.distance.text,
          leg1Duration: leg1.duration.text,
          leg2Duration: leg2.duration.text,
        });

        // Calculate total distance and duration
        const totalDistance = leg1.distance.value + leg2.distance.value;
        const totalDuration = leg1.duration.value + leg2.duration.value;

        completeRoute = {
          distance: `${Math.round(totalDistance / 1000)} km`, // Convert to km
          duration: `${Math.round(totalDuration / 60)} min`, // Convert to minutes
          coordinates: coordinates,
        };

        console.log("🗺️ Complete route calculated:", {
          totalDistance: completeRoute.distance,
          totalDuration: completeRoute.duration,
          coordinatesCount: coordinates.length,
        });
      } else {
        console.warn(
          "🗺️ Complete route API error:",
          data.status,
          data.error_message
        );
      }

      return {
        pickupRoute,
        deliveryRoute,
        completeRoute,
      };
    } catch (error) {
      console.error("🗺️ Error fetching complete route:", error);
      return {
        pickupRoute: null,
        deliveryRoute: null,
        completeRoute: null,
      };
    }
  };

  // Function to decode Google's polyline encoding
  const decodePolyline = (encoded: string): RouteCoordinates[] => {
    const points: RouteCoordinates[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  // Function to interpolate additional points for smoother polylines
  const interpolatePolyline = (coordinates: RouteCoordinates[], maxDistance: number = 0.001): RouteCoordinates[] => {
    if (coordinates.length < 2) return coordinates;
    
    const interpolated: RouteCoordinates[] = [coordinates[0]];
    
    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      
      // Calculate distance between points
      const distance = Math.sqrt(
        Math.pow(curr.latitude - prev.latitude, 2) + 
        Math.pow(curr.longitude - prev.longitude, 2)
      );
      
      // If distance is too large, interpolate intermediate points
      if (distance > maxDistance) {
        const steps = Math.ceil(distance / maxDistance);
        for (let j = 1; j < steps; j++) {
          const ratio = j / steps;
          interpolated.push({
            latitude: prev.latitude + (curr.latitude - prev.latitude) * ratio,
            longitude: prev.longitude + (curr.longitude - prev.longitude) * ratio,
          });
        }
      }
      
      interpolated.push(curr);
    }
    
    return interpolated;
  };

  // Utility function to calculate distance between two coordinates (fallback)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Utility function to calculate ETA based on distance and average speed (fallback)
  const calculateETA = (
    distance: number,
    averageSpeed: number = 30
  ): string => {
    const timeInHours = distance / averageSpeed;
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Utility function to calculate bearing between two points
  const calculateBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  // Cache for routes to prevent unnecessary API calls
  const routeCache = useRef<{
    pickupRoute?: any;
    deliveryRoute?: any;
    completeRoute?: any;
    lastJobId?: string;
    lastLocation?: string;
  }>({});

  // Update routes when location or job changes
  const updateRoutes = async () => {
    if (!selectedJob) return;

    const jobToUse = selectedJob;
    // Use appropriate location based on user role
    const driverLocation =
      userRole === "driver"
        ? currentLocation || { latitude: 40.7589, longitude: -73.9851 }
        : trackedDriverLocation || { latitude: 40.7589, longitude: -73.9851 };

    // Check if we need to update routes (job changed or significant location change)
    const currentJobId = jobToUse.id;
    const currentLocationKey = `${driverLocation?.latitude.toFixed(
      3
    )},${driverLocation.longitude.toFixed(3)}`;

    if (
      routeCache.current.lastJobId === currentJobId &&
      routeCache.current.lastLocation === currentLocationKey &&
      routeCache.current.pickupRoute &&
      routeCache.current.deliveryRoute
    ) {
      console.log("🗺️ Using cached routes, skipping API calls");

      // Restore cached route data
      if (routeCache.current.pickupRoute) {
        setPickupRouteInfo(routeCache.current.pickupRoute);
      }
      if (routeCache.current.deliveryRoute) {
        setDeliveryRouteInfo(routeCache.current.deliveryRoute);
      }
      if (routeCache.current.completeRoute) {
        setCompleteRouteInfo(routeCache.current.completeRoute);
        console.log("🗺️ Restored complete route from cache");
      }
      return;
    }

    console.log("🗺️ Fetching new routes from API");
    // Only show loading for initial load or significant changes
    if (isInitialLoad || !routeCache.current.lastJobId) {
      setIsLoadingRoutes(true);
    }

    let pickupRoute: any = null;
    let deliveryRoute: any = null;
    let completeRoute: any = null;

    try {
      // Get individual routes first (more reliable)
      const individualPickupRoute = await getRouteFromDirectionsAPI(
        driverLocation,
        {
          latitude: jobToUse.pickupLocation?.lat,
          longitude: jobToUse.pickupLocation?.lng,
        }
      );

      const individualDeliveryRoute = await getRouteFromDirectionsAPI(
        {
          latitude: jobToUse.pickupLocation?.lat,
          longitude: jobToUse.pickupLocation?.lng,
        },
        {
          latitude: jobToUse.dropoffLocation?.lat,
          longitude: jobToUse.dropoffLocation?.lng,
        }
      );

      // Try to get complete route with waypoints as well
      const routeData = await getCompleteRouteWithWaypoints(
        driverLocation,
        {
          latitude: jobToUse.pickupLocation?.lat,
          longitude: jobToUse.pickupLocation?.lng,
        },
        {
          latitude: jobToUse.dropoffLocation?.lat,
          longitude: jobToUse.dropoffLocation?.lng,
        }
      );

      // Set pickup route info - use individual route if complete route fails
      if (routeData.pickupRoute) {
        pickupRoute = routeData.pickupRoute;
        setPickupRouteInfo(pickupRoute);
        // Update distance and ETA from API response
        const distanceMatch = pickupRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToPickup(parseFloat(distanceMatch[1]));
        }
        setEtaToPickup(pickupRoute.duration);
      } else if (individualPickupRoute) {
        // Fallback to individual route
        pickupRoute = individualPickupRoute;
        setPickupRouteInfo(pickupRoute);
        const distanceMatch = pickupRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToPickup(parseFloat(distanceMatch[1]));
        }
        setEtaToPickup(pickupRoute.duration);
      } else {
        // Fallback to straight line calculation
        const pickupDistance = calculateDistance(
          driverLocation?.latitude,
          driverLocation?.longitude,
          jobToUse.pickupLocation?.lat,
          jobToUse.pickupLocation?.lng
        );
        setDistanceToPickup(pickupDistance);
        setEtaToPickup(calculateETA(pickupDistance));
      }

      // Set delivery route info
      if (routeData.deliveryRoute) {
        deliveryRoute = routeData.deliveryRoute;
        setDeliveryRouteInfo(deliveryRoute);
        // Update distance and ETA from API response
        const distanceMatch = deliveryRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToDelivery(parseFloat(distanceMatch[1]));
        }
        setEtaToDelivery(deliveryRoute.duration);
      } else if (individualDeliveryRoute) {
        // Fallback to individual route
        deliveryRoute = individualDeliveryRoute;
        setDeliveryRouteInfo(deliveryRoute);
        const distanceMatch = deliveryRoute.distance.match(/(\d+\.?\d*)/);
        if (distanceMatch) {
          setDistanceToDelivery(parseFloat(distanceMatch[1]));
        }
        setEtaToDelivery(deliveryRoute.duration);
      } else {
        // Fallback to straight line calculation
        const deliveryDistance = calculateDistance(
          jobToUse.pickupLocation?.lat,
          jobToUse.pickupLocation?.lng,
          jobToUse.dropoffLocation?.lat,
          jobToUse.dropoffLocation?.lng
        );
        setDistanceToDelivery(deliveryDistance);
        setEtaToDelivery(calculateETA(deliveryDistance));
      }

      // Store complete route for potential future use
      completeRoute = routeData.completeRoute;

      // Set complete route info for map rendering
      if (routeData.completeRoute) {
        setCompleteRouteInfo(routeData.completeRoute);
        console.log("🗺️ Complete route set for map rendering:", {
          coordinatesCount: routeData.completeRoute.coordinates.length,
          distance: routeData.completeRoute.distance,
          duration: routeData.completeRoute.duration,
          firstCoordinate: routeData.completeRoute.coordinates[0],
          lastCoordinate:
            routeData.completeRoute.coordinates[
              routeData.completeRoute.coordinates.length - 1
            ],
        });
      } else {
        console.warn(
          "🗺️ No complete route available, will use individual routes"
        );
      }

      console.log("🗺️ Route data updated:", {
        pickupRoute: !!routeData.pickupRoute,
        deliveryRoute: !!routeData.deliveryRoute,
        completeRoute: !!routeData.completeRoute,
      });
    } catch (error) {
      console.error("Error updating routes:", error);
      // Fallback calculations
      const jobToUse = selectedJob;
      const driverLocation = currentLocation || {
        latitude: 40.7589,
        longitude: -73.9851,
      };

      const pickupDistance = calculateDistance(
        driverLocation?.latitude,
        driverLocation?.longitude,
        jobToUse.pickupLocation?.lat,
        jobToUse.pickupLocation?.lng
      );
      const deliveryDistance = calculateDistance(
        driverLocation?.latitude,
        driverLocation?.longitude,
        jobToUse.dropoffLocation?.lat,
        jobToUse.dropoffLocation?.lng
      );

      setDistanceToPickup(pickupDistance);
      setDistanceToDelivery(deliveryDistance);
      setEtaToPickup(calculateETA(pickupDistance));
      setEtaToDelivery(calculateETA(deliveryDistance));
    } finally {
      setIsLoadingRoutes(false);
      setIsInitialLoad(false);

      // Update cache with successful results
      routeCache.current = {
        pickupRoute: pickupRoute,
        deliveryRoute: deliveryRoute,
        completeRoute: completeRoute,
        lastJobId: currentJobId,
        lastLocation: currentLocationKey,
      };
    }
  };

  // Update map region to fit all markers
  const fitMapToMarkers = () => {
    if (!mapRef.current) return;

    const jobToUse = selectedJob || {
      pickupLocation: { lat: 40.7505, lng: -73.9934 },
      dropoffLocation: { lat: 40.7282, lng: -73.9942 },
    };

    const locationToUse = currentLocation || {
      latitude: 40.7589,
      longitude: -73.9851,
    };

    const coordinates = [
      {
        latitude: locationToUse?.latitude,
        longitude: locationToUse?.longitude,
      },
      {
        latitude: jobToUse.pickupLocation?.lat,
        longitude: jobToUse.pickupLocation?.lng,
      },
      {
        latitude: jobToUse.dropoffLocation?.lat,
        longitude: jobToUse.dropoffLocation?.lng,
      },
    ].filter((coord) => coord?.latitude !== 0 && coord?.longitude !== 0);

    if (coordinates.length === 0) return;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  };

  // Get active jobs for the current user
  const activeJobs = jobs.filter((job) => {
    if (userRole === "driver") {
      return (
        job.assignedDriverId === userProfile?.id &&
        [
          "assigned",
          "in_progress",
          "arrived_pickup",
          "loaded",
          "in_transit",
          "arrived_delivery",
        ].includes(job.status)
      );
    } else {
      return (
        job.merchantId === userProfile?.id &&
        [
          "assigned",
          "in_progress",
          "arrived_pickup",
          "loaded",
          "in_transit",
          "arrived_delivery",
        ].includes(job.status)
      );
    }
  });

  // Mock data for UI demonstration
  const mockActiveJobs: Job[] = [
    {
      id: "mock-1",
      title: "Deliver Electronics to Downtown",
      description:
        "Transport electronic equipment from warehouse to downtown office",
      status: "in_progress",
      payAmount: "150.00",
      currency: "USD",
      assignedDriverId:
        userRole === "driver" ? userProfile?.id || "driver-1" : "driver-19", // Use different driver ID for non-drivers
      merchantId: "merchant-1",
      merchantName: "Tech Solutions Inc.",
      merchantRating: 4.5,
      compensation: 150.0,
      distance: 5.2,
      estimatedDuration: "2 hours",
      cargoType: "Electronics",
      cargoWeight: "150 kg",
      pickupLocation: {
        address: "123 Warehouse St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US",
        lat: 40.7589,
        lng: -73.9851,
        date: "2024-01-15",
        time: "09:00",
      },
      dropoffLocation: {
        address: "456 Business Ave",
        city: "New York",
        state: "NY",
        zipCode: "10002",
        country: "US",
        lat: 40.7505,
        lng: -73.9934,
        date: "2024-01-15",
        time: "11:00",
      },
      requiredTruckType: "Box Truck",
      specialRequirements: "Handle with care - fragile electronics",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Use mock data if no real active jobs
  const displayJobs = activeJobs.length > 0 ? activeJobs : mockActiveJobs;
  useEffect(() => {
    if (userRole !== "driver" || !currentLocation) {
      return;
    }

    const intervalId = setInterval(() => {
      sendLiveLocationFunction(
        currentLocation?.latitude,
        currentLocation?.longitude
      );
    }, 5000); // Send every 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [userRole, currentLocation?.latitude, currentLocation?.longitude]);
  const sendLiveLocationFunction = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const locationData = {
        lat: latitude,
        lng: longitude,
        accuracy: 5.2,
        heading: 180,
        speed: 65.5,
        battery: 85,
        provider: "gps",
      };
      await sendLiveLocation(locationData);
    } catch (err) {
      console.error("Error sending live location:", err);
    }
  };
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation?.latitude,
            longitude: currentLocation?.longitude,
          },
          pitch: 10,
          heading: 0,
          altitude: 1000,
          zoom: 100, // adjust zoom level
        },
        { duration: 1000 }
      ); // smooth animation
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]);
  // Timer effect for elapsed time
  useEffect(() => {
    if (tripStarted && !tripPaused && tripStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(
          Math.floor((Date.now() - tripStartTime.getTime()) / 1000)
        );
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tripStarted, tripPaused, tripStartTime]);

  // Cleanup function for live location timeout
  // useEffect(() => {
  //   return () => {
  //     if (liveLocationTimeoutRef.current) {
  //       clearTimeout(liveLocationTimeoutRef.current);
  //       liveLocationTimeoutRef.current = null;
  //     }
  //     if (continuousLocationRef.current) {
  //       clearInterval(continuousLocationRef.current);
  //       continuousLocationRef.current = null;
  //     }
  //     if (locationSendTimeoutRef.current) {
  //       clearTimeout(locationSendTimeoutRef.current);
  //       locationSendTimeoutRef.current = null;
  //     }
  //   };
  // }, []);

  // Location update handler function
  const handleLocationUpdate = (data: any) => {
    // Extract location data from the nested structure
    const locationData = data.location || data;
    const driverId = locationData.userId || data.userId;
    const latitude = parseFloat(locationData?.lat || locationData?.latitude);
    const longitude = parseFloat(locationData?.lng || locationData?.longitude);

    // Update driver location on map if we have valid coordinates
    if (
      driverId &&
      latitude &&
      longitude &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      // Different handling based on user role
      if (userRole === "driver") {
        // Driver should process their own location updates from socket
        if (driverId == profileData?.id) {
          // Update driver's location state with socket data
          const newDriverLocation = {
            latitude: latitude,
            longitude: longitude,
            timestamp: new Date(locationData.timestamp).getTime() || Date.now(),
            heading: parseFloat(locationData.heading) || undefined,
          };
          // Store for
          // ging
          setDriverSocketLocation(newDriverLocation);

          // Update the currentLocation state with socket data
          const heading = parseFloat(locationData.heading) || undefined;
          useLocationStore.getState().updateLocation(latitude, longitude, heading);
        }
      } else if (["carrier", "shipper", "broker"].includes(userRole)) {
        // Non-driver users should process location updates for the assigned driver
        const assignedDriverId = selectedJob?.assignedDriverId;
        const isAssignedDriver =
          driverId == assignedDriverId ||
          driverId == parseInt(assignedDriverId?.replace("driver-", "")) ||
          assignedDriverId?.includes(driverId.toString());

        if (isAssignedDriver || !assignedDriverId) {
          // Store the tracked driver's location
          const newTrackedLocation = {
            latitude: latitude,
            longitude: longitude,
            timestamp: new Date(locationData.timestamp).getTime() || Date.now(),
            heading: parseFloat(locationData.heading) || undefined,
          };

          setTrackedDriverLocation(newTrackedLocation);
        }
      }
    } else {
      console.warn("Invalid location data received:", data);
    }
  };

  // Socket event listeners setup
  useEffect(() => {
    if (!socketService.isSocketConnected()) {
      return;
    }

    // Handle different user roles for tracking
    if (profileData?.id) {
      if (userRole === "driver") {
        // Driver joins their own location room
        const roomData = {
          rooms: `user_location_${profileData?.id}`,
        };
        socketService.emitJoinRoom(roomData);
      } else if (["carrier", "shipper", "broker"].includes(userRole)) {
        // Other roles join the driver's location room to track them
        if (selectedJob?.assignedDriverId) {
          socketService.emitJoinTrackingRoom(
            selectedJob.assignedDriverId,
            userRole,
            profileData.id,
            selectedJob.id
          );
        } else {
          // For testing purposes, try to join a default driver room if no assigned driver
          const testDriverId = "19"; // Use the same driver ID from your Postman test
          socketService.emitJoinTrackingRoom(
            testDriverId,
            userRole,
            profileData.id,
            selectedJob?.id || "test-job"
          );
        }
      }
    }

    // Set up location update listener
    const socket = socketService.getSocket();
    if (socket) {
      socket.on("location_update", handleLocationUpdate);
    }
  }, [userRole, profileData, selectedJob]);

  // Update distances and ETAs when location or selected job changes - with debouncing
  useEffect(() => {
    const locationToUse = getLocationForMap;

    // Show local loading indicator for location updates
    if (locationToUse) {
      setIsLocationUpdating(true);
    }

    // Debounce location updates to prevent frequent API calls
    const debounceTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;

      const jobToUse = selectedJob || {
        pickupLocation: { lat: 40.7505, lng: -73.9934 },
        dropoffLocation: { lat: 40.7282, lng: -73.9942 },
      };

      const locationForMap = getLocationForMap;

      // Only update map region if location actually changed significantly
      if (locationForMap) {
        setMapRegion({
          latitude: locationForMap?.latitude,
          longitude: locationForMap?.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }

      // Only update routes if job changed or if it's the first time
      if (selectedJob) {
        console.log("🗺️ Updating routes due to job/location change");
        updateRoutes();
      }

      // Hide location updating indicator after a short delay
      setTimeout(() => {
        setIsLocationUpdating(false);
      }, 1000);
    }, 3000); // Debounce for 3 seconds to reduce API calls

    return () => clearTimeout(debounceTimeout);
  }, [currentLocation, trackedDriverLocation, selectedJob, userRole]);

  // Update map when tracked driver location changes (for non-driver users)
  useEffect(() => {
    if (trackedDriverLocation && userRole !== "driver") {
      // Update map region to show the tracked driver's location
      setMapRegion({
        latitude: trackedDriverLocation?.latitude,
        longitude: trackedDriverLocation?.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });

      // Animate map to tracked driver's location smoothly
      if (mapRef.current && isMountedRef.current) {
        try {
          mapRef.current.animateToRegion(
            {
              latitude: trackedDriverLocation?.latitude,
              longitude: trackedDriverLocation?.longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
            },
            1000
          ); // 1 second animation
        } catch (error) {
          console.warn(
            "📍 TripTracking: Error animating map to tracked driver location:",
            error
          );
        }
      }

      // Update routes when tracked driver location changes
      if (selectedJob) {
        updateRoutes();
      }
    }
  }, [trackedDriverLocation, userRole]);

  // Update map when driver's own location changes (for driver users)
  useEffect(() => {
    if (currentLocation && userRole === "driver") {
      console.log(
        "📍 TripTracking: Updating map for driver location:",
        currentLocation
      );

      // Update map region to follow the driver's movement
      setMapRegion({
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });

      // Animate map to new location smoothly
      if (mapRef.current && isMountedRef.current) {
        try {
          mapRef.current.animateToRegion(
            {
              latitude: currentLocation?.latitude,
              longitude: currentLocation?.longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
            },
            1000
          ); // 1 second animation
        } catch (error) {
          console.warn(
            "📍 TripTracking: Error animating map to driver location:",
            error
          );
        }
      }
    }
  }, [currentLocation, userRole]);

  // Fit map to markers when job changes
  useEffect(() => {
    setTimeout(() => {
      fitMapToMarkers();
    }, 1000);
  }, [selectedJob]);

  // Initialize with passed job or first available job
  useEffect(() => {
    if (passedJob) {
      setSelectedJob(passedJob);
    } else if (displayJobs.length > 0 && !selectedJob) {
      setSelectedJob(displayJobs[0]);
    }
  }, [passedJob, displayJobs, selectedJob]);

  // Auto-start location tracking for drivers
  useEffect(() => {
    if (userRole === "driver" && !tripStarted && locationPermission) {
      startLocationTracking();
    }
  }, [userRole, locationPermission]);

  // Initial route calculation for all users when component loads
  useEffect(() => {
    if (selectedJob) {
      updateRoutes();
    }
  }, [selectedJob]);

  // Update routes when tracked driver location is first received (for non-driver users)
  useEffect(() => {
    if (trackedDriverLocation && userRole !== "driver" && selectedJob) {
      updateRoutes();
    }
  }, [trackedDriverLocation, userRole, selectedJob]);

  // Location-based sending for drivers (only when location changes, with debouncing)
  useEffect(() => {
    if (userRole === "driver" && currentLocation) {
      // Clear any existing timeout
      if (locationSendTimeoutRef.current) {
        clearTimeout(locationSendTimeoutRef.current);
      }

      // Debounce location sending to avoid too frequent API calls
      locationSendTimeoutRef.current = setTimeout(() => {
        sendLiveLocationData(
          currentLocation?.latitude,
          currentLocation?.longitude
        );
      }, 1000); // Wait 2 seconds after last location change
    }
  }, [userRole, currentLocation?.latitude, currentLocation?.longitude]);

  const handleStartTrip = () => {
    setTripStarted(true);
    setTripStartTime(new Date());
    setCurrentMilestone(0);
    startLocationTracking();
  };

  const handlePauseTrip = () => {
    setTripPaused(!tripPaused);
  };

  const handleStopTrip = () => {
    setTripStarted(false);
    setTripPaused(false);
    setTripStartTime(null);
    setElapsedTime(0);
    setCurrentMilestone(0);
  };

  const handleNextMilestone = () => {
    if (currentMilestone < tripMilestones.length - 1) {
      setCurrentMilestone(currentMilestone + 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const renderMapView = () => {
    const jobToUse = selectedJob || {
      pickupLocation: {
        lat: 40.7505,
        lng: -73.9934,
        address: "456 Business Ave, New York, NY 10002",
      },
      dropoffLocation: {
        lat: 40.7282,
        lng: -73.9942,
        address: "321 Corporate Plaza, Manhattan, NY 10003",
      },
    };

    // Use the coordinates calculated at component level
    const darkMapStyle = [
      {
        elementType: "geometry",
        stylers: [{ color: "#212121" }],
      },
      {
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }],
      },
      {
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
      },
      {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#212121" }],
      },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#383838" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8a8a8a" }],
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#373737" }],
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f2f2f" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#000000" }],
      },
    ];
    return (
      <View style={styles.mapViewContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          provider="google"
         
          onRegionChangeComplete={setMapRegion}
          customMapStyle={darkMapStyle} // ← dark mode applied here
          userInterfaceStyle="dark"
          showsUserLocation={userRole === "driver"}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
          
          initialRegion={mapRegion}
          onMapReady={() => {
            console.log("Trip tracking map is ready!");
            setTimeout(() => {
              fitMapToMarkers();
            }, 1000);
          }}
        >
          {coordinates.map((coord, index) => {
            const getPinColor = () => {
              if (coord.type === "driver") return "#00FF00";
              if (coord.type === "pickup") return Colors.statusDelivered;
              return Colors.info;
            };

            const pinColor = getPinColor();

            // Use custom truck marker for driver
            if (coord.type === "driver") {
              // Calculate bearing for truck direction
              let bearing = 0;
              const jobToUse = selectedJob || {
                pickupLocation: { lat: 40.7505, lng: -73.9934 },
                dropoffLocation: { lat: 40.7282, lng: -73.9942 },
              };

              // First try to use heading from location data if available
              if (driverSocketLocation?.heading !== undefined) {
                bearing = driverSocketLocation.heading;
                console.log("Using heading from location data:", bearing);
              } else if (
                completeRouteInfo &&
                completeRouteInfo.coordinates.length > 1
              ) {
                // Find the closest point on the route to the driver
                let closestIndex = 0;
                let minDistance = Infinity;

                completeRouteInfo.coordinates.forEach((routePoint, index) => {
                  const distance = Math.sqrt(
                    Math.pow(routePoint?.latitude - coord?.latitude, 2) +
                      Math.pow(routePoint?.longitude - coord?.longitude, 2)
                  );
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                  }
                });

                // Calculate bearing to the next point on the route
                if (closestIndex < completeRouteInfo.coordinates.length - 1) {
                  const nextPoint =
                    completeRouteInfo.coordinates[closestIndex + 1];
                  bearing = calculateBearing(
                    coord?.latitude,
                    coord?.longitude,
                    nextPoint?.latitude,
                    nextPoint?.longitude
                  );
                }
              } else if (jobToUse.pickupLocation) {
                // Fallback to pickup location if no route available
                bearing = calculateBearing(
                  coord?.latitude,
                  coord?.longitude,
                  jobToUse.pickupLocation?.lat,
                  jobToUse.pickupLocation?.lng
                );
              }

              // Adjust bearing for truck icon orientation
              // Based on the screenshot, try different adjustments
              let adjustedBearing = bearing + 180;
              // Ensure bearing is between 0 and 360
              adjustedBearing = (adjustedBearing + 360) % 360;

              // Debug bearing calculation
              console.log(
                "Truck bearing:",
                bearing,
                "degrees, adjusted:",
                adjustedBearing,
                "degrees"
              );
              console.log(
                "Direction:",
                bearing < 45 || bearing > 315
                  ? "North"
                  : bearing < 135
                  ? "East"
                  : bearing < 225
                  ? "South"
                  : "West"
              );
console.log("coord?.heading", coord?.heading);
              return (
                <MarkerAnimated
                  // ref={driverMarkerRef}
              position={'center'}
                  rotation={coord?.heading}
                  coordinate={{
                    latitude: coord?.latitude,
                    longitude: coord?.longitude,
                  }}
                  image={require("../../../assets/longtruck121.png")}
                  flat
                  title={coord.title}
                  description={`${coord.description} `}
                />
                //   <Marker
                //   key={`${coord.type}-${index}`}
                //   coordinate={{
                //     latitude: coord?.latitude,
                //     longitude: coord?.longitude,
                //   }}
                //   title={coord.title}
                //   description={`${coord.description} (Bearing: ${Math.round(bearing)}°)`}
                //   image={require("../../../assets/longtruck121.png")}

                // />
              );
            }

            return (
              <Marker
                key={`${coord.type}-${index}`}
                coordinate={{
                  latitude: coord?.latitude,
                  longitude: coord?.longitude,
                }}
                title={coord.title}
                description={coord.description}
                pinColor={pinColor}
              />
            );
          })}

          {/* Complete Route from Driver to Pickup to Delivery (with waypoints) */}
          {completeRouteInfo && completeRouteInfo.coordinates.length >= 2 && (
            <Polyline
              coordinates={completeRouteInfo.coordinates}
              strokeColor={Colors.primary}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Individual routes if complete route is not available */}
          {!completeRouteInfo &&
            pickupRouteInfo &&
            pickupRouteInfo.coordinates.length >= 2 && (
              <Polyline
                coordinates={pickupRouteInfo.coordinates}
                strokeColor={Colors.primary}
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            )}

          {!completeRouteInfo &&
            deliveryRouteInfo &&
            deliveryRouteInfo.coordinates.length >= 2 && (
              <Polyline
                coordinates={deliveryRouteInfo.coordinates}
                strokeColor={Colors.primary}
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            )}
        </MapView>

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  ...mapRegion,
                  latitudeDelta: mapRegion?.latitudeDelta * 0.5,
                  longitudeDelta: mapRegion?.longitudeDelta * 0.5,
                });
              }
            }}
          >
            <ZoomIn size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  ...mapRegion,
                  latitudeDelta: mapRegion?.latitudeDelta * 2,
                  longitudeDelta: mapRegion?.longitudeDelta * 2,
                });
              }
            }}
          >
            <ZoomOut size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              const locationToUse = getLocationForMap;
              if (locationToUse && mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    latitude: locationToUse?.latitude,
                    longitude: locationToUse?.longitude,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                  },
                  1000
                ); // 1 second smooth zoom
              }
            }}
          >
            <Locate size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={fitMapToMarkers}
          >
            <Route size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Loading Overlay - Only show for initial load or significant changes */}
        {isLoadingRoutes && isInitialLoad && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading routes...</Text>
          </View>
        )}

        {/* Location Update Indicator - Local loading for location updates */}
        {/* {isLocationUpdating && (
          <View style={styles.locationUpdateIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.locationUpdateText}>Updating location...</Text>
          </View>
        )} */}

        {/* Trip Status Overlay */}
      </View>
    );
  };

  const renderTripControls = () => (
    <View style={styles.tripControlsContainer}>
      <View style={styles.tripControlsHeader}>
        <Text style={styles.tripControlsTitle}>Trip Controls</Text>
        {tripStarted && (
          <Text style={styles.tripTimeText}>{formatTime(elapsedTime)}</Text>
        )}
      </View>

      <View style={styles.tripControlsButtons}>
        {!tripStarted ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTrip}
          >
            <Play size={20} color={Colors.white} />
            <Text style={styles.startButtonText}>Start Trip</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                tripPaused ? styles.resumeButton : styles.pauseButton,
              ]}
              onPress={handlePauseTrip}
            >
              {tripPaused ? (
                <Play size={20} color={Colors.white} />
              ) : (
                <Pause size={20} color={Colors.white} />
              )}
              <Text style={styles.controlButtonText}>
                {tripPaused ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleNextMilestone}
            >
              <CheckCircle size={20} color={Colors.white} />
              <Text style={styles.controlButtonText}>Next Step</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStopTrip}
            >
              <Square size={20} color={Colors.white} />
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderTripMilestones = () => (
    <View style={styles.milestonesContainer}>
      <Text style={styles.milestonesTitle}>Trip Progress</Text>
      <ScrollView
        style={styles.milestonesScrollView}
        showsVerticalScrollIndicator={false}
      >
        {tripMilestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.milestoneItem}>
            <View
              style={[
                styles.milestoneIcon,
                index < currentMilestone && styles.milestoneIconCompleted,
                index === currentMilestone && styles.milestoneIconActive,
              ]}
            >
              {index < currentMilestone ? (
                <CheckCircle size={16} color={Colors.white} />
              ) : (
                <Text style={styles.milestoneNumber}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.milestoneContent}>
              <Text
                style={[
                  styles.milestoneTitle,
                  index < currentMilestone && styles.milestoneTitleCompleted,
                  index === currentMilestone && styles.milestoneTitleActive,
                ]}
              >
                {milestone.title}
              </Text>
              <Text style={styles.milestoneDescription}>
                {milestone.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderDistanceInfo = () => (
    <View style={styles.distanceInfoContainer}>
      <View style={styles.distanceInfoItem}>
        <Package size={20} color={Colors.primary} />
        <View style={styles.distanceInfoContent}>
          <Text style={styles.distanceInfoLabel}>To Pickup</Text>
          <Text style={styles.distanceInfoValue}>
            {pickupRouteInfo
              ? pickupRouteInfo.distance
              : distanceToPickup
              ? `${distanceToPickup.toFixed(1)} km`
              : "--"}
          </Text>
          <Text style={styles.distanceInfoEta}>
            {pickupRouteInfo
              ? pickupRouteInfo.duration
              : `ETA: ${etaToPickup || "--"}`}
          </Text>
        </View>
      </View>

      <View style={styles.distanceInfoItem}>
        <Home size={20} color={Colors.secondary} />
        <View style={styles.distanceInfoContent}>
          <Text style={styles.distanceInfoLabel}>To Delivery</Text>
          <Text style={styles.distanceInfoValue}>
            {deliveryRouteInfo
              ? deliveryRouteInfo.distance
              : distanceToDelivery
              ? `${distanceToDelivery.toFixed(1)} km`
              : "--"}
          </Text>
          <Text style={styles.distanceInfoEta}>
            {deliveryRouteInfo
              ? deliveryRouteInfo.duration
              : `ETA: ${etaToDelivery || "--"}`}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!locationPermission) {
    return (
      <View style={styles.permissionContainer}>
        <AlertCircle
          size={40}
          color={Colors.warning}
          style={styles.permissionIcon}
        />
        <Text style={styles.permissionTitle}>Location Permission Required</Text>
        <Text style={styles.permissionText}>
          Please enable location access to track your trip
        </Text>
        <Button
          title="Enable Location"
          variant="primary"
          onPress={requestLocationPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  if (displayJobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Truck size={40} color={Colors.gray400} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No Active Trips</Text>
        <Text style={styles.emptyText}>
          You don't have any active trips to track
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {renderMapView()}
        {/* {renderTripControls()} */}
        {renderDistanceInfo()}
        {/* {renderTripMilestones()} */}
      </View>
    </View>
  );
}

export { TripTrackingScreen };
