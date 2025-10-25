import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Search, Filter, Plus, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { JobCard } from "@app/components/JobCard";
import { Button } from "@app/components/Button";
import { Routes } from "../../../navigator";
import { useThemedStyle, Colors } from "@app/styles";
import { getStyles } from "./jobsStyle";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTruckTypes,
  selectJobs,
  selectProfile,
} from "@app/module/common";
import {
  fetchTruckTypes,
  fetchJobs,
  fetchMyApplications,
  fetchContractJobs,
} from "@app/module/jobs/slice";
import { useLocationStore } from "@app/store/locationStore";
function JobsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const truckTypes = useSelector(selectTruckTypes);
  const jobs = useSelector(selectJobs);

  console.log(jobs, "jobs in jobs screen");
  const profileData = useSelector(selectProfile);
  const userRole = profileData?.roles?.[0]?.role?.name;
  const { currentLocation } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [truckTypeFilter, setTruckTypeFilter] = useState<string>("");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("");
  const [distanceFilter, setDistanceFilter] = useState<number>(0); // Default 5 miles
  const [activeTab, setActiveTab] = useState<
    "all" | "my" | "picked" | "applied" | "completed"
  >("all"); // Default to 'all' jobs
  const [loading, setLoading] = useState(false);

  // Reset to Available tab whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab("all"); // Set to Available tab
    }, [])
  );

  // Function to refetch jobs with custom parameters
  const refetchJobsWithParams = (customParams: any = {}) => {
    setLoading(true);

    // Determine status and isMine based on active tab
    let status = jobStatusFilter || "";
    let isMine = false;

    if (activeTab === "all") {
      status = "active";
    } else if (activeTab === "my") {
      isMine = true;
    } else if (activeTab === "picked") {
      // For picked jobs, we'll fetch contract jobs
      // This will be handled separately in useEffect
      console.log(
        "Picked tab - skipping refetchJobsWithParams, will use fetchContractJobs"
      );
      return;
    } else if (activeTab === "applied") {
      // For applied jobs, we'll fetch user's applications
      // This will be handled separately in useEffect
      console.log(
        "Applied tab - skipping refetchJobsWithParams, will use fetchMyApplications"
      );
      return;
    } else if (activeTab === "completed") {
      status = "completed";
      isMine = true;
    }

    const defaultParams = {
      status: status,
      // jobType: "short",
      // minPay: 100,
      // maxPay: 10000,
      location: "",
      showNearby: distanceFilter,
      lat: currentLocation?.latitude || null,
      lng: currentLocation?.longitude || null,
      isMine: isMine,
      limit: 10,
      page: 1,
      truckTypeIds: null,
    };

    const params = { ...defaultParams, ...customParams };
    console.log("Refetching jobs with params:", params);
    dispatch(fetchJobs(params));
  };

  useEffect(() => {
    // Fetch jobs on component mount with parameters matching your curl request
    refetchJobsWithParams();
  }, [dispatch]);

  useEffect(() => {
    if (!truckTypes || truckTypes.length === 0) {
      dispatch(fetchTruckTypes());
    }
  }, [dispatch, truckTypes]);

  // Refetch jobs when job status filter changes
  useEffect(() => {
    refetchJobsWithParams();
  }, [jobStatusFilter]);

  // Refetch jobs when distance filter changes
  useEffect(() => {
    refetchJobsWithParams();
  }, [distanceFilter]);

  // Refetch jobs when location changes
  useEffect(() => {
    if (currentLocation) {
      console.log(
        "Location changed, refetching jobs with new coordinates:",
        currentLocation
      );
      refetchJobsWithParams();
    }
  }, []);

  // Refetch jobs when active tab changes
  useEffect(() => {
    if (activeTab === "picked") {
      // Fetch contract jobs for picked jobs
      setLoading(true);
      dispatch(
        fetchContractJobs({
          lat: currentLocation?.latitude || null,
          lng: currentLocation?.longitude || null,
        })
      );
    } else if (activeTab === "applied") {
      // Fetch user's job applications for applied jobs
      setLoading(true);
      dispatch(fetchMyApplications());
    } else {
      refetchJobsWithParams();
    }
  }, [activeTab]);

  // Update loading state when jobs change
  useEffect(() => {
    console.log("Jobs received:", jobs?.length || 0);
    console.log("Active tab:", activeTab);
    if (activeTab === "picked") {
      console.log("Picked jobs data:", JSON.stringify(jobs, null, 2));
    } else if (activeTab === "applied") {
      console.log("Applied jobs data:", JSON.stringify(jobs, null, 2));
    }
    setLoading(false);
  }, [jobs, activeTab]);

  // Update filtered jobs when jobs or filters change
  useEffect(() => {
    let filtered = jobs || [];

    // Apply search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(
        (job) =>
          job.pickupLocation?.city === locationFilter ||
          job.dropoffLocation?.city === locationFilter
      );
    }

    // Apply truck type filter
    if (truckTypeFilter) {
      filtered = filtered.filter((job) =>
        job.cargo?.requiredTruckTypeIds?.some(
          (typeId: number) =>
            truckTypes.find((t) => t.name === truckTypeFilter)?.id === typeId
        )
      );
    }

    // Apply distance filter (miles only)
    if (distanceFilter > 0) {
      filtered = filtered.filter((job) => {
        const jobDistance = job.cargo?.distance || 0;
        // Convert job distance from km to miles
        const jobDistanceInMiles = jobDistance * 0.621371;

        return jobDistanceInMiles <= distanceFilter;
      });
    }
    // If distanceFilter is 0, show all jobs (no distance filtering)

    setFilteredJobs(filtered);
  }, [
    jobs,
    searchQuery,
    locationFilter,
    truckTypeFilter,
    truckTypes,
    distanceFilter,
  ]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // The filtering logic is now handled by the useEffect hook
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const applyLocationFilter = (location: string) => {
    // Toggle: if already selected, unselect it
    if (locationFilter === location) {
      setLocationFilter("");
    } else {
      setLocationFilter(location);
    }
    // The filtering logic is now handled by the useEffect hook
  };

  const applyTruckTypeFilter = (truckType: string) => {
    // Toggle: if already selected, unselect it
    if (truckTypeFilter === truckType) {
      setTruckTypeFilter("");
    } else {
      setTruckTypeFilter(truckType);
    }
    // The filtering logic is now handled by the useEffect hook
  };

  const applyJobStatusFilter = (status: string) => {
    // Toggle: if already selected, unselect it
    if (jobStatusFilter === status) {
      setJobStatusFilter("");
    } else {
      setJobStatusFilter(status);
    }
  };

  const handleTabChange = (
    tab: "all" | "my" | "picked" | "applied" | "completed"
  ) => {
    setActiveTab(tab);
    // Close filters when switching to "My Jobs", "Picked Jobs", or "Applied Jobs" tab
    if (tab === "my" || tab === "picked" || tab === "applied") {
      setShowFilters(false);
    }
  };

  // Format distance for display
  const formatDistance = (distance: number) => {
    if (distance >= 1000000) {
      return `${(distance / 1000000).toFixed(1)}M miles`;
    } else if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}K miles`;
    } else {
      return `${distance} miles`;
    }
  };

  const resetFilters = () => {
    setLocationFilter("");
    setTruckTypeFilter("");
    setJobStatusFilter("");
    setSearchQuery("");
    setDistanceFilter(0); // Reset to 0 miles
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Search
          size={20}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t("jobs.searchPlaceholder")}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={Colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {activeTab !== "my" &&
        activeTab !== "picked" &&
        activeTab !== "applied" && (
          <TouchableOpacity
            style={[
              styles.filterButton,
              showFilters && styles.filterButtonActive,
            ]}
            onPress={toggleFilters}
          >
            <Filter
              size={20}
              color={showFilters ? Colors.white : Colors.primary}
            />
          </TouchableOpacity>
        )}

      {userRole === "merchant" && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate(Routes.CreateJobScreen)}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.tabsScrollContainer}
      contentContainerStyle={styles.tabsContainer}
      bounces={false}
      alwaysBounceHorizontal={false}
      alwaysBounceVertical={false}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      scrollEnabled={true}
      directionalLockEnabled={true}
      nestedScrollEnabled={false}
    >
      <TouchableOpacity
        style={[styles.tab, activeTab === "all" && styles.activeTab]}
        onPress={() => handleTabChange("all")}
      >
        <Text
          style={[styles.tabText, activeTab === "all" && styles.activeTabText]}
        >
          Available
        </Text>
      </TouchableOpacity>
      {userRole !== "driver" && (
        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.activeTab]}
          onPress={() => handleTabChange("my")}
        >
          <Text
            style={[styles.tabText, activeTab === "my" && styles.activeTabText]}
          >
            Posted
          </Text>
        </TouchableOpacity>
      )}
      {userRole !== "shipper" && (
        <TouchableOpacity
          style={[styles.tab, activeTab === "picked" && styles.activeTab]}
          onPress={() => handleTabChange("picked")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "picked" && styles.activeTabText,
            ]}
          >
            Picked
          </Text>
        </TouchableOpacity>
      )}
      {userRole !== "shipper" && (
        <TouchableOpacity
          style={[styles.tab, activeTab === "applied" && styles.activeTab]}
          onPress={() => handleTabChange("applied")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "applied" && styles.activeTabText,
            ]}
          >
            Applied
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.tab, activeTab === "completed" && styles.activeTab]}
        onPress={() => handleTabChange("completed")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "completed" && styles.activeTabText,
          ]}
        >
          Completed
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFilters = () =>
    showFilters &&
    activeTab !== "my" &&
    activeTab !== "picked" &&
    activeTab !== "applied" ? (
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>{t("jobs.filters.title")}</Text>
        <ScrollView
          style={styles.filtersScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t('jobs.filters.location')}</Text>
          <View style={styles.filterOptions}>
            {Object.entries(t('jobs.locations', { returnObjects: true })).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  locationFilter === value && styles.filterChipActive,
                ]}
                onPress={() => applyLocationFilter(value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    locationFilter === value && styles.filterChipTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Job Status</Text>
            <View style={styles.filterOptions}>
              {[
                "draft",
                "active",
                "assigned",
                "in_progress",
                "completed",
                "cancelled",
                "partially_completed",
              ].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    jobStatusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => applyJobStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      jobStatusFilter === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t("jobs.filters.truckType")}
            </Text>
            <View style={styles.filterOptions}>
              {truckTypes && truckTypes.length > 0 ? (
                truckTypes.map((truckType: any) => (
                  <TouchableOpacity
                    key={truckType.id}
                    style={[
                      styles.filterChip,
                      truckTypeFilter === truckType.name &&
                        styles.filterChipActive,
                    ]}
                    onPress={() => applyTruckTypeFilter(truckType.name)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        truckTypeFilter === truckType.name &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {truckType.name ||
                        truckType.label ||
                        `Truck Type ${truckType.id}`}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.loadingText}>Loading truck types...</Text>
              )}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Distance Range (Miles)</Text>

            <View style={styles.distanceContainer}>
              <View style={styles.distanceHeader}>
                <Text style={styles.distanceValue}>
                  {formatDistance(distanceFilter)}
                </Text>
              </View>

              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1000000}
                  value={distanceFilter}
                  onValueChange={setDistanceFilter}
                  step={1}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.gray300}
                  thumbTintColor={Colors.primary}
                />
                <View style={styles.sliderButtons}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => {
                      const newValue = Math.max(0, distanceFilter - 1000);
                      setDistanceFilter(newValue);
                    }}
                  >
                    <Text style={styles.sliderButtonText}>-1K</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => {
                      const newValue = Math.max(0, distanceFilter - 100);
                      setDistanceFilter(newValue);
                    }}
                  >
                    <Text style={styles.sliderButtonText}>-100</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => {
                      const newValue = Math.min(1000000, distanceFilter + 100);
                      setDistanceFilter(newValue);
                    }}
                  >
                    <Text style={styles.sliderButtonText}>+100</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => {
                      const newValue = Math.min(1000000, distanceFilter + 1000);
                      setDistanceFilter(newValue);
                    }}
                  >
                    <Text style={styles.sliderButtonText}>+1K</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.distanceLabels}>
                <Text style={styles.distanceLabel}>0 miles</Text>
                <Text style={styles.distanceLabel}>1M miles</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <Button
          title={t("jobs.filters.resetFilters")}
          variant="outline"
          onPress={resetFilters}
          style={styles.resetButton}
        />
      </View>
    ) : null;

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Loading jobs...</Text>
          <Text style={styles.emptyDescription}>
            Please wait while we fetch available jobs
          </Text>
        </View>
      );
    }

    if (!jobs || jobs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t("jobs.noJobsFound")}</Text>
          <Text style={styles.emptyDescription}>
            {userRole === "driver"
              ? t("jobs.noJobsDriver")
              : t("jobs.noJobsMerchant")}
          </Text>

          {userRole === "merchant" && (
            <Button
              title={t("home.postNewJob")}
              variant="primary"
              onPress={() =>
                (navigation as any).navigate(Routes.CreateJobScreen)
              }
              style={styles.emptyButton}
            />
          )}
        </View>
      );
    }

    if (filteredJobs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No jobs match your filters</Text>
          <Text style={styles.emptyDescription}>
            Try adjusting your search criteria or filters
          </Text>
          <Button
            title="Clear Filters"
            variant="outline"
            onPress={resetFilters}
            style={styles.emptyButton}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      {renderFilters()}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

export { JobsScreen };
