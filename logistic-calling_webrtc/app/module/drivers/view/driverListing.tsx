/**
 * Driver Listing Screen
 * @format
 */

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from "react-native";
import { User, Star, CheckCircle, Search } from "lucide-react-native";
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./driverListingStyles";
import Header from "@app/components/Header";
import { useDispatch, useSelector } from "react-redux";
import { selectDrivers } from "@app/module/common";
import { fetchDrivers, assignDriver, changeDriver } from "../slice";
import { ChangeDriverModal } from "@app/components/ChangeDriverModal";

interface Driver {
  id: string;
  name: string;
  rating: number;
  jobsCompleted: number;
  vehicleType: string;
  profileImage?: string;
  isAvailable: boolean;
  location?: string;
}

function DriverListingScreen({ navigation, route }) {
  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const drivers = useSelector(selectDrivers);
  
  const { jobId, contractId, onDriverSelect, currentDriverId, currentDriver } = route.params || {};
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Modal state for change driver
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedNewDriver, setSelectedNewDriver] = useState<Driver | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);

  console.log('DriverListingScreen - Route params:', {
    jobId,
    contractId,
    currentDriverId,
    currentDriver,
    hasOnDriverSelect: !!onDriverSelect
  });
  
  console.log('DriverListingScreen - currentDriver details:', {
    currentDriver,
    userName: currentDriver?.userName,
    user: currentDriver?.user,
    userUserName: currentDriver?.user?.userName,
    name: currentDriver?.name
  });
  useEffect(() => {
    // Fetch drivers from API
    console.log('DriverListingScreen - useEffect - dispatching fetchDrivers');
    dispatch(fetchDrivers({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    console.log('DriverListingScreen - drivers updated:', drivers);
  }, [drivers]);

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    dispatch(fetchDrivers({ page: 1, limit: 10 }));
  };

  const handleCloseModal = () => {
    setShowChangeModal(false);
    setSelectedNewDriver(null);
    setChangeLoading(false);
  };

  const handleDriverChange = (reason: string) => {
    if (!selectedNewDriver || !currentDriver || !contractId) {
      console.error('Missing required data for driver change');
      return;
    }

    setChangeLoading(true);
    
    dispatch(changeDriver({
      contractId: contractId.toString(),
      currentDriverUserId: currentDriver.id,
      newDriverUserId: selectedNewDriver.id,
      reason: reason,
      onSuccess: () => {
        console.log('Driver change successful');
        setChangeLoading(false);
        setShowChangeModal(false);
        setSelectedNewDriver(null);
        // Navigate back to driver assignment screen
        navigation.goBack();
      },
      onError: (error: string) => {
        console.error('Driver change failed:', error);
        setChangeLoading(false);
        Alert.alert('Error', error);
      }
    }));
  };

  const handleAssignDriver = (driver: Driver) => {
    console.log('Driver selected:', driver);
    console.log('onDriverSelect available:', !!onDriverSelect);
    
    if (onDriverSelect && !!currentDriver) {
      // If called from Driver Assignment screen for change driver, show modal
      console.log('Setting up change driver modal with driver:', driver);
      setSelectedNewDriver(driver);
      setShowChangeModal(true);
      return;
    }
    
    if (onDriverSelect) {
      // If called from Driver Assignment screen for assignment, just select the driver
      console.log('Calling onDriverSelect with driver:', driver);
      onDriverSelect(driver);
      return;
    }

    // Original assignment logic for direct assignment
    Alert.alert(
      'Assign Driver',
      `Assign ${driver.name} to this job?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            const jobId = route?.params?.jobId;
            
            if (jobId) {
              dispatch(assignDriver({ driverId: driver.id, jobId, contractId }));
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Job ID not found');
            }
          }
        }
      ]
    );
  };

  const renderDriverCard = ({ item: driver }: { item: Driver }) => (
    <View style={styles.driverCard}>
      {/* Driver Info Section */}
      <View style={styles.driverInfoSection}>
        <View style={styles.profileIcon}>
          <User size={24} color={Colors.white} />
        </View>
        
        <View style={styles.driverDetails}>
          <Text style={styles.driverName}>{driver.name}</Text>
          
          <View style={styles.ratingSection}>
            <Star size={16} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.ratingText}>{driver.rating}</Text>
            <View style={styles.separator} />
            <Text style={styles.jobsText}>{driver.jobsCompleted} jobs</Text>
          </View>
          
          <Text style={styles.vehicleType}>{driver.vehicleType}</Text>
          {!!driver.location && (
            <Text style={styles.location}>{driver.location}</Text>
          )}
        </View>
      </View>

      {/* Action Button Section */}
      <View style={styles.actionButtonSection}>
        <TouchableOpacity
          style={[
            styles.assignButton,
            !driver.isAvailable && styles.disabledButton
          ]}
          onPress={() => handleAssignDriver(driver)}
          disabled={!driver.isAvailable}
        >
          <CheckCircle size={16} color={Colors.white} />
          <Text style={styles.buttonText}>Assign</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <User size={64} color={Colors.gray400} />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No Drivers Found' : 'No Drivers Available'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery 
          ? `No drivers found matching "${searchQuery}". Try a different search term.`
          : 'No available drivers found. Pull down to refresh.'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Available Drivers" />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drivers by name..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredDrivers}
        renderItem={renderDriverCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={handleRefresh}
      />

      {/* Change Driver Modal */}
      <ChangeDriverModal
        visible={showChangeModal}
        onClose={handleCloseModal}
        onConfirm={handleDriverChange}
        currentDriverName={(() => {
          const name = currentDriver?.user?.userName || currentDriver?.userName || currentDriver?.name || 'Unknown Driver';
          console.log('Modal currentDriverName resolved to:', name);
          return name;
        })()}
        newDriverName={selectedNewDriver?.name || ''}
        loading={changeLoading}
      />
    </View>
  );
}

export default DriverListingScreen;
