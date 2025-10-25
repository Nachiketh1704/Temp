import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import {
  MapPin,
  Clock,
  TrendingUp,
  ChevronRight,
  Search,
  Filter,
  PlusIcon,
  MessageCircle,
  User,
} from "lucide-react-native";
import { useAuthStore } from "@app/store/authStore";
import { useLocationStore } from "@app/store/locationStore";
import { JobCard } from "@app/components/JobCard";
import { useTranslation } from "react-i18next";
import { Colors, useThemedStyle } from "@app/styles";
import { Routes } from "@app/navigator";
import { getStyles } from "./styles";
import DrawerHeader from "@app/components/DrawerHeader";
import { useDispatch, useSelector } from "react-redux";
import { selectJobs, selectProfile, selectUser } from "@app/module/common";
import { fetchProfile } from "@app/module/profile/slice";
import { fetchContractJobs, fetchJobs } from "@app/module/jobs/slice";
import { fetchContractInvitations } from "@app/module/contract-invitations";
import { useFocusEffect } from "@react-navigation/native";
import {
  reverseGeocode,
  formatLocationDisplay,
  LocationInfo,
} from "@app/utils/geocoding";

interface HomeScreenProps {
  readonly navigation: any;
}

function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const user = useSelector(selectUser);

  console.log("useruser", user);
  const { userProfile } = useAuthStore();
  const {
    requestLocationPermission,
    currentLocation,
    startLocationTracking,
    locationPermission,
    error: locationError,
  } = useLocationStore();
  const styles = useThemedStyle(getStyles);
  const profileData = useSelector(selectProfile);
  console.log(profileData, "userprofillleeee");
  const userRole = profileData?.roles?.[0]?.role?.name;
  const jobs = useSelector(selectJobs);
console.log(jobs, "jobs in home screen");
  // Contract invitations state
  const contractInvitations = useSelector(
    (state: any) => state.contractInvitationsReducer
  );
  const pendingInvitationsCount = contractInvitations?.pendingCount || 0;

  // Debug contract invitations
  console.log("HomeScreen - Contract invitations state:", contractInvitations);
  console.log(
    "HomeScreen - Pending invitations count:",
    pendingInvitationsCount
  );

  // Location state
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(false);

  // Use real contract invitations data
  const pendingInvitations = pendingInvitationsCount;
  console.log("HomeScreen - Current jobs count:", jobs?.length || 0);

  // Fetch location info when coordinates change
  const fetchLocationInfo = useCallback(
    async (latitude: number, longitude: number) => {
      console.log("🏠 HomeScreen: Starting to fetch location info for:", {
        latitude,
        longitude,
      });
      setLocationLoading(true);
      try {
        const locationData = await reverseGeocode(latitude, longitude);
        console.log("🏠 HomeScreen: Received location data:", locationData);
        setLocationInfo(locationData);
      } catch (error) {
        console.error("🏠 HomeScreen: Error fetching location info:", error);
      } finally {
        setLocationLoading(false);
      }
    },
    []
  );

  // Effect to fetch location info when currentLocation changes
  useEffect(() => {
    console.log("🏠 HomeScreen: currentLocation changed:", currentLocation);
    if (currentLocation) {
      console.log(
        "🏠 HomeScreen: Fetching location info for coordinates:",
        currentLocation
      );
      fetchLocationInfo(currentLocation?.latitude, currentLocation?.longitude);
    } else {
      console.log("🏠 HomeScreen: No current location available");
    }
  }, [ ]);

  // Initialize location tracking
  useEffect(() => {
    const initializeLocation = async () => {
      console.log("🏠 HomeScreen: Initializing location tracking...");
      console.log(
        "🏠 HomeScreen: Current location permission:",
        locationPermission
      );

      if (!locationPermission) {
        console.log("🏠 HomeScreen: Requesting location permission...");
        const granted = await requestLocationPermission();
        console.log("🏠 HomeScreen: Permission granted:", granted);
        if (granted) {
          console.log("🏠 HomeScreen: Starting location tracking...");
          startLocationTracking();
        }
      } else {
        console.log(
          "🏠 HomeScreen: Permission already granted, starting location tracking..."
        );
        startLocationTracking();
      }
    };

    initializeLocation();
  }, [locationPermission, requestLocationPermission, startLocationTracking]);

  // Helper function to get location display text
  const getLocationDisplayText = () => {
    if (locationLoading) {
      return "Getting location...";
    }
    if (locationInfo) {
      return formatLocationDisplay(locationInfo);
    }
    if (locationError) {
      return "Location unavailable";
    }
    return userProfile?.location || "Location not available";
  };

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProfile({}));
    requestLocationPermission();

    // Fetch contract invitations for drivers
    if (userRole === "driver" || userRole === "carrier" || userRole === "broker" || userRole === "shipper") {
      dispatch(fetchContractInvitations());
    }
  }, [dispatch, userRole]);

  // Fetch jobs only once when screen first loads
  useFocusEffect(
    useCallback(() => {
      dispatch(
        fetchContractJobs({
          status: "active",
          isMine: false, // Show all jobs, not just user's jobs
          lat: currentLocation?.latitude || null,
          lng: currentLocation?.longitude || null,
        })
      );
      dispatch(
        fetchJobs({
          status: "active",
          isMine: false, // Show all jobs, not just user's jobs
          lat: currentLocation?.latitude || null,
          lng: currentLocation?.longitude || null,
        })
      );

      // Fetch contract invitations for drivers when screen comes into focus
      if (
        userRole === "driver" ||
        userRole === "carrier" ||
        userRole === "broker" ||
        userRole === "shipper"
      ) {
        dispatch(fetchContractInvitations());
      }
    }, [dispatch, userRole])
  );

  // Debug: Log when jobs change (including socket updates)
  useEffect(() => {
    console.log("HomeScreen - Jobs updated:", {
      count: jobs?.length || 0,
      firstJob: jobs?.[0]?.title || "No jobs",
      timestamp: new Date().toISOString(),
    });
  }, [jobs]);

  // Limit jobs to 10 for home screen display
  const limitedJobs = jobs?.slice(0, 10) || [];

  // Recent Jobs: Show most recently created jobs (all statuses, sorted by date)
  const recentJobs = limitedJobs
    .sort((a, b) => {
      // Sort by createdAt or updatedAt, whichever is more recent
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    })
    .slice(0, 5);
    
  // Active Jobs: Show only active jobs (no sorting by date)
  const activeJobs = limitedJobs
    .filter((job) => job.status === "active")
    .slice(0, 5);

  const renderDriverDashboard = () => (
    <>
 
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate(Routes.JobsScreen)}
        >
          <Search size={20} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>{t("home.searchJobs")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: Colors.primary + "30" },
            ]}
          >
            <Clock size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{activeJobs.length}</Text>
          <Text style={styles.statLabel}>{t("home.activeJobs")}</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: Colors.success + "30" },
            ]}
          >
            <TrendingUp size={20} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>
            {userProfile?.completedJobs || 0}
          </Text>
          <Text style={styles.statLabel}>{t("home.completedJobs")}</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: Colors.warning + "30" },
            ]}
          >
            <MapPin size={20} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>
            {userProfile?.rating.toFixed(1) || "0.0"}
          </Text>
          <Text style={styles.statLabel}>{t("home.rating")}</Text>
        </View>
      </View>

      {activeJobs.length > 0 && userRole !== "driver" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.activeJobs")}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(Routes.JobsScreen)}
            >
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {activeJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.recentJobs")}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
          </TouchableOpacity>
        </View>

        {recentJobs.length > 0 ? (
          recentJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <Text style={styles.emptyText}>{t("home.noRecentJobs")}</Text>
        )}
      </View>
    </>
  );

  const renderMerchantDashboard = () => {
    return (
      <>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => navigation.navigate(Routes.CreateJobScreen)}
          >
            <Text style={styles.primaryActionButtonText}>
              {t("home.postNewJob")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Text style={styles.secondaryActionButtonText}>
              {t("home.manageJobs")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.primary + "30" },
              ]}
            >
              <Clock size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>{t("home.activeJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.success + "30" },
              ]}
            >
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>
              {userProfile?.completedJobs || 0}
            </Text>
            <Text style={styles.statLabel}>{t("home.completedJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.warning + "30" },
              ]}
            >
              <MapPin size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>
              {userProfile?.rating.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.statLabel}>{t("home.rating")}</Text>
          </View>
        </View>

        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("home.activeJobs")}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(Routes.JobsScreen)}
              >
                <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
              </TouchableOpacity>
            </View>

            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.DriverListingScreen)}
          >
            <View style={styles.quickActionIcon}>
              <Search size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.findDrivers.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.findDrivers.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.ProfileScreen)}
          >
            <View style={styles.quickActionIcon}>
              <TrendingUp size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.analytics.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.analytics.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </>
    );
  };
  const renderCarrierDashboard = () => {
    return (
      <>
        {/* Primary Actions (Merchant only) */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => navigation.navigate(Routes.CreateJobScreen)}
          >
            <PlusIcon size={20} color={Colors.white} />
            <Text style={styles.primaryActionButtonText}>
              {t("home.postNewJob")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Text style={styles.secondaryActionButtonText}>
              {t("home.manageJobs")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar (Driver only) */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate(Routes.JobsScreen)}
          >
            <Search size={20} color={Colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>{t("home.searchJobs")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Shared Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.primary + "30" },
              ]}
            >
              <Clock size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>{t("home.activeJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.success + "30" },
              ]}
            >
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>
              {userProfile?.completedJobs || 0}
            </Text>
            <Text style={styles.statLabel}>{t("home.completedJobs")}</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.warning + "30" },
              ]}
            >
              <MapPin size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>
              {userProfile?.rating.toFixed(1) || "0.0"}
            </Text>
            <Text style={styles.statLabel}>{t("home.rating")}</Text>
          </View>
        </View>

        {/* Active Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.activeJobs")}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(Routes.JobsScreen)}
            >
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {activeJobs.length > 0 ? (
            activeJobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <Text style={styles.emptyText}>{t("home.noActiveJobs")}</Text>
          )}
        </View>

        {/* Recent Jobs (Driver only) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.recentJobs")}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(Routes.JobsScreen)}
            >
              <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            </TouchableOpacity>
          </View>

          {recentJobs.length > 0 ? (
            recentJobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <Text style={styles.emptyText}>{t("home.noRecentJobs")}</Text>
          )}
        </View>

        {/* Quick Actions (Merchant only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.DriverListingScreen)}
          >
            <View style={styles.quickActionIcon}>
              <Search size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.findDrivers.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.findDrivers.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => navigation.navigate(Routes.DriverListingScreen)}
          >
            <View style={styles.quickActionIcon}>
              <TrendingUp size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>
                {t("home.analytics.title")}
              </Text>
              <Text style={styles.quickActionDescription}>
                {t("home.analytics.description")}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderDashboard = () => {
    if (userRole === "merchant") {
      return renderMerchantDashboard();
    } else if (userRole === "driver") {
      return renderDriverDashboard();
    } else if (
      userRole === "carrier" ||
      userRole === "broker" ||
      userRole === "shipper"
    ) {
      return renderCarrierDashboard();
    } else {
      return <Text style={{ color: Colors.primary }}>{t("common.error")}</Text>;
    }
  };
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <DrawerHeader title="Home" />
      <View style={styles.header}>
        <View
          style={{
            borderRadius: 10,
            backgroundColor: Colors.backgroundCard,
            flexDirection: "row",
            padding: 10,
            width: "48%",
            height: 80,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate(Routes.ProfileScreen)}
          >
            {profileData?.profileImage ? (
           <Image
           source={
             error || !profileData?.profileImage
               ? require("../../../assets/dummyImage.png") // fallback local image
               : { uri: profileData.profileImage }
           }
           style={styles.avatar}
           onError={() => setError(true)}
         />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={32} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ width: "60%" }}>
            <Text style={styles.greeting}>{profileData?.userName}</Text>
            <Text style={styles.userRole}>
              {profileData?.roles?.[0]?.role?.name?.toUpperCase()}
            </Text>
          </View>
        </View>
        <View
          style={{
            borderRadius: 10,
            backgroundColor: Colors.backgroundCard,
            flexDirection: "row",
            padding: 10,
            width: "48%",
            height: 80,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              fetchLocationInfo(
                currentLocation?.latitude,
                currentLocation?.longitude
              );
            }}
          >
            <View
              style={[
                styles.statIconContaineNew,
                { backgroundColor: Colors.secondaryLight },
              ]}
            >
              <MapPin size={25} color={Colors.primaryLight} />
            </View>
          </TouchableOpacity>
          <View style={{ width: "60%" }}>
            <Text style={styles.greeting}>{t("home.currentLocation")}</Text>
            <Text
              style={styles.userRole}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getLocationDisplayText()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          {userRole !== "shipper" && pendingInvitations > 0 && (
        <TouchableOpacity
          style={styles.jobInvitationsTile}
          onPress={() => navigation.navigate(Routes.JobInvitationsScreen)}
        >
          <View style={styles.jobInvitationsContent}>
            <View style={styles.jobInvitationsLeft}>
              <View style={styles.jobInvitationsIconContainer}>
                <MessageCircle size={24} color={Colors.white} />
                <View style={styles.jobInvitationsBadge}>
                  <Text style={styles.jobInvitationsBadgeText}>
                    {pendingInvitations}
                  </Text>
                </View>
              </View>
              <View style={styles.jobInvitationsTextContainer}>
                <Text style={styles.jobInvitationsTitle}>
                  New Job Invitations
                </Text>
                <Text style={styles.jobInvitationsSubtitle}>
                  You have {pendingInvitations} pending job invitation
                  {pendingInvitations > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.white} />
          </View>
        </TouchableOpacity>
      )}
        {renderDashboard()}
      </ScrollView>
    </View>
  );
}

export { HomeScreen };
