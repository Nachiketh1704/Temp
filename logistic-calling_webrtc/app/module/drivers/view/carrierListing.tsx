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
import { selectCarriers } from "@app/module/common";
import { changeDriver, fetchCarriers, assignCarrier } from "../slice";
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

interface Carrier {
  id: string;
  name: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  rating: number;
  jobsCompleted: number;
  vehicleType: string;
  profileImage?: string;
  isAvailable: boolean;
  location?: string;
}

function CarrierListingScreen({ navigation, route }) {
  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const carriers = useSelector(selectCarriers);
  
  const { jobId, contractId, onDriverSelect, currentDriverId, currentDriver } = route.params || {};
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Modal state for change carrier
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedNewDriver, setSelectedNewDriver] = useState<Driver | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);

  console.log('carrierListingScreen - Route params:', {
    jobId,
    contractId,
    currentDriverId,
    currentDriver,
    hasOnDriverSelect: !!onDriverSelect
  });
  
  console.log('DriverListingScreen - Full route object:', route);
  console.log('DriverListingScreen - route.params:', route?.params);
  
  console.log('DriverListingScreen - currentDriver details:', {
    currentDriver,
    userName: currentDriver?.userName,
    user: currentDriver?.user,
    userUserName: currentDriver?.user?.userName,
    name: currentDriver?.name
  });
  useEffect(() => {
    // Fetch carriers from API
    console.log('DriverListingScreen - useEffect - dispatching fetchDrivers');
    dispatch(fetchCarriers({ page: 1, limit: 10 }));
  }, [dispatch]);

  // Filter carriers based on search query
  const filteredDrivers = (carriers || []).filter((carrier) => {
    if (!carrier) {
      console.log('DriverListingScreen - filtering out null/undefined carrier');
      return false;
    }
    
    // Get the name from various possible fields
    const carrierName = carrier.name || 
                       carrier.userName || 
                       `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim() ||
                       'Unknown Carrier';
    
    // Check if search query matches name, vehicle type, or location
    const searchLower = searchQuery.toLowerCase();
    const matches = carrierName.toLowerCase().includes(searchLower) ||
           (carrier.vehicleType?.toLowerCase().includes(searchLower)) ||
           (carrier.location?.toLowerCase().includes(searchLower));
    
    if (searchQuery && matches) {
      console.log('DriverListingScreen - carrier matches search:', carrierName, 'query:', searchQuery);
    }
    
    return matches;
  });

  useEffect(() => {
    console.log('DriverListingScreen - carriers updated:', carriers);
    console.log('DriverListingScreen - carriers length:', carriers?.length || 0);
    console.log('DriverListingScreen - search query:', searchQuery);
    console.log('DriverListingScreen - filtered drivers length:', filteredDrivers?.length || 0);
    
    // Log first carrier structure for debugging
    if (carriers && carriers.length > 0) {
      console.log('DriverListingScreen - First carrier structure:', carriers[0]);
      console.log('DriverListingScreen - First carrier ID:', carriers[0]?.id);
      console.log('DriverListingScreen - First carrier ID type:', typeof carriers[0]?.id);
    }
  }, [carriers, searchQuery, filteredDrivers]);

  const handleRefresh = () => {
    dispatch(fetchCarriers({ page: 1, limit: 10 }));
  };

  const handleCloseModal = () => {
    setShowChangeModal(false);
    setSelectedNewDriver(null);
    setChangeLoading(false);
  };

  const handleDriverChange = (reason: string) => {
    if (!selectedNewDriver || !currentDriver || !contractId) {
      console.error('Missing required data for carrier change');
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
        // Navigate back to carrier assignment screen
        navigation.goBack();
      },
      onError: (error: string) => {
        console.error('Driver change failed:', error);
        setChangeLoading(false);
        Alert.alert('Error', error);
      }
    }));
  };

  const handleAssignDriver = (carrier: Carrier) => {
    console.log('DriverListingScreen - handleAssignDriver called with carrier:', carrier);
    console.log('DriverListingScreen - carrier.id:', carrier?.id);
    console.log('DriverListingScreen - carrier type:', typeof carrier?.id);
    console.log('DriverListingScreen - onDriverSelect available:', !!onDriverSelect);
    console.log('DriverListingScreen - currentDriver exists:', !!currentDriver);
    
    if (onDriverSelect && !!currentDriver) {
      // If called from Driver Assignment screen for change carrier, show modal
      console.log('Setting up change carrier modal with carrier:', carrier);
      setSelectedNewDriver(carrier);
      setShowChangeModal(true);
      return;
    }
    
    if (onDriverSelect) {
      // If called from Driver Assignment screen for assignment, just select the carrier
      console.log('Calling onDriverSelect with carrier:', carrier);
      onDriverSelect(carrier);
      return;
    }

    // Original assignment logic for direct assignment
    const carrierName = carrier.name || 
                       carrier.userName || 
                       `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim() ||
                       'Unknown Carrier';
                       
    Alert.alert(
      'Assign Carrier',
      `Assign ${carrierName} to this job?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            const contractId = route?.params?.contractId;
            
            console.log('DriverListingScreen - Assignment attempt:');
            console.log('DriverListingScreen - contractId from route:', contractId);
            console.log('DriverListingScreen - contractId type:', typeof contractId);
            console.log('DriverListingScreen - carrier.id:', carrier.id);
            console.log('DriverListingScreen - carrier.id type:', typeof carrier.id);
            console.log('DriverListingScreen - route.params:', route?.params);
            
            if (contractId && carrier.id) {
              console.log('DriverListingScreen - Both IDs found, dispatching assignCarrier');
              dispatch(assignCarrier({
                carrierUserId: carrier.id,
                contractId: contractId.toString(),
                onSuccess: () => {
                  console.log('Carrier assignment successful');
                  navigation.goBack();
                },
                onError: (error: string) => {
                  console.error('Carrier assignment failed:', error);
                  Alert.alert('Error', error);
                }
              }));
            } else {
              console.log('DriverListingScreen - Missing IDs - contractId:', contractId, 'carrier.id:', carrier.id);
              Alert.alert('Error', `Contract ID or Carrier ID not found. ContractId: ${contractId}, CarrierId: ${carrier.id}`);
            }
          }
        }
      ]
    );
  };

  const renderDriverCard = ({ item: carrier }: { item: Carrier }) => {
    if (!carrier) {
      console.log('DriverListingScreen - renderDriverCard - carrier is null/undefined');
      return null;
    }

    // Get the name from various possible fields
    const carrierName = carrier.name || 
                       carrier.userName || 
                       `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim() ||
                       'Unknown Carrier';

    return (
      <View style={styles.driverCard}>
        {/* Driver Info Section */}
        <View style={styles.driverInfoSection}>
          <View style={styles.profileIcon}>
            <User size={24} color={Colors.white} />
          </View>
          
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{carrierName}</Text>
            
            <View style={styles.ratingSection}>
              <Star size={16} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.ratingText}>{carrier.rating || 0}</Text>
              <View style={styles.separator} />
              <Text style={styles.jobsText}>{carrier.jobsCompleted || 0} jobs</Text>
            </View>
            
            <Text style={styles.vehicleType}>{carrier.vehicleType || 'Truck Info.'}</Text>
            {!!carrier.location && (
              <Text style={styles.location}>{carrier.location}</Text>
            )}
          </View>
        </View>

        {/* Action Button Section */}
        <View style={styles.actionButtonSection}>
          <TouchableOpacity
            style={[
              styles.assignButton,
              !carrier.isAvailable && styles.disabledButton
            ]}
            onPress={() => handleAssignDriver(carrier)}
            disabled={!carrier.isAvailable}
          >
            <CheckCircle size={16} color={Colors.white} />
            <Text style={styles.buttonText}>Assign</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <User size={64} color={Colors.gray400} />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No carriers Found' : 'No carriers Available'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {searchQuery 
          ? `No carriers found matching "${searchQuery}". Try a different search term.`
          : 'No available carriers found. Pull down to refresh.'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Available carriers" />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search carriers by name..."
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

export default CarrierListingScreen;
