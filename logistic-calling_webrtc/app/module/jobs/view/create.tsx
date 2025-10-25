import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { selectTruckTypes, selectProfile } from "@app/module/common";
import { fetchTruckTypes, createJob } from "@app/module/jobs/slice";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Truck,
  DollarSign,
  Package,
  Info,
} from "lucide-react-native";
import { showMessage } from "react-native-flash-message";

// Screens
import { Colors, useThemedStyle } from "@app/styles";
import { Input } from "@app/components/Input";
import { MultiSelect } from "@app/components/MultiSelect";
import { AddressDropdown } from "@app/components/AddressDropdown";
import { getStyles } from './createStyle';
import Header from "@app/components/Header";
import DatePicker from "react-native-date-picker";
import { httpRequest, endPoints } from "@app/service";
import { ParsedAddress } from "@app/utils";

function CreateJobScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const userProfile = useSelector(selectProfile);

  const userRole = userProfile?.role;
  console.log({ userProfile, userRole }, "userprofile in create job");
  const truckTypes = useSelector(selectTruckTypes);


  // Fetch truck types when component mounts
  useEffect(() => {
    if (!truckTypes || truckTypes.length === 0) {
      dispatch(fetchTruckTypes());
    }
  }, [dispatch, truckTypes]);

  // Dynamic role ID - can be set in multiple ways:
  // 1. From user profile: userProfile?.role
  // 2. From props/route params: route.params?.roleId
  // 3. From user input (see Input field below)
  // 4. From another dropdown selection
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Set role ID from user profile when available
  useEffect(() => {
    console.log('User profile in create job:', userProfile);
    if (userProfile?.roles && userProfile.roles.length > 0) {
      const roleId = userProfile.roles[0].id;
      console.log('Setting selected role ID:', roleId);
      setSelectedRoleId(roleId);
    } else {
      console.log('No roles found in user profile');
    }
  }, [userProfile]);

  // Fetch role posting permissions when component mounts or role ID changes
  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePostingPermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  // Function to fetch role posting permissions
  const fetchRolePostingPermissions = async (roleId: number) => {
    try {
      setLoadingRolePermissions(true);
      console.log('Fetching role posting permissions for role ID:', roleId);
      console.log('API endpoint:', endPoints.roleTypes(roleId));
      
      const response = await httpRequest.get(endPoints.roleTypes(roleId));
      console.log('Role posting permissions response for role ID', roleId, ':', response);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log('Role permissions data:', response.data);
        console.log('Number of permissions:', response.data.length);
        if (response.data.length > 0) {
          console.log('First permission sample:', response.data[0]);
        }
        setRolePermissions(response.data);
      } else {
        console.error('Failed to fetch role posting permissions - invalid response:', response);
        setRolePermissions([]);
      }
    } catch (error) {
      console.error('Error fetching role posting permissions:', error);
      console.error('Error details:', error?.response?.data);
      setRolePermissions([]);
    } finally {
      setLoadingRolePermissions(false);
    }
  };

  const [title, setTitle] = useState("Test Job Title");
  const [description, setDescription] = useState("Test job description");
  const [compensation, setCompensation] = useState("100");

  const [pickupAddress, setPickupAddress] = useState("123 Test St");
  const [pickupCity, setPickupCity] = useState("Test City");
  const [pickupState, setPickupState] = useState("CA");
  const [pickupZipCode, setPickupZipCode] = useState("12345");
  const [pickupLat, setPickupLat] = useState(0);
  const [pickupLng, setPickupLng] = useState(0);
  const [pickupAddressInput, setPickupAddressInput] = useState("");
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickupTimeWindow, setPickupTimeWindow] = useState("09:00");
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState("456 Test Ave");
  const [deliveryCity, setDeliveryCity] = useState("Test City 2");
  const [deliveryState, setDeliveryState] = useState("CA");
  const [deliveryZipCode, setDeliveryZipCode] = useState("54321");
  const [deliveryLat, setDeliveryLat] = useState(0);
  const [deliveryLng, setDeliveryLng] = useState(0);
  const [deliveryAddressInput, setDeliveryAddressInput] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState("17:00");
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);

  const [distance, setDistance] = useState("50");
  const [estimatedDuration, setEstimatedDuration] = useState("2 hours");
  const [cargoType, setCargoType] = useState("General");
  const [cargoWeight, setCargoWeight] = useState("1000");
  const [requiredTruckType, setRequiredTruckType] = useState<string[]>([]);
  const [specialRequirements, setSpecialRequirements] = useState("");

  // Role posting permissions state
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);

  // Truck type options for the multiselect - use real data from API
  const truckTypeOptions = truckTypes?.map((truckType: any) => ({
    id: truckType.id,
    label: truckType.name || truckType.label || `Truck Type ${truckType.id}`,
    value: truckType.id.toString(),
  })) || [];

  // Role permission options for the multiselect - using viewerRole data
  const rolePermissionOptions = rolePermissions?.map((permission: any) => {
    console.log('Processing permission:', permission);
    const viewerRole = permission.viewerRole;
    const roleName = viewerRole?.name || permission.name || `Role ${permission.id}`;
    const roleDescription = viewerRole?.description || '';
    const isCompanyRole = viewerRole?.isCompanyRole || false;
    
    const option = {
      id: viewerRole?.id || permission.id,
      label: roleName + (roleDescription ? ` - ${roleDescription}` : '') + (isCompanyRole ? ' (Company Role)' : ''),
      value: (viewerRole?.id || permission.id).toString(),
      description: roleDescription,
      isCompanyRole: isCompanyRole,
    };
    console.log('Created option:', option);
    return option;
  }) || [];

  // Debug: Log the processed role options
  useEffect(() => {
    console.log('Role permissions state:', rolePermissions);
    console.log('Role permission options:', rolePermissionOptions);
    console.log('Selected role permissions:', selectedRolePermissions);
    console.log('Loading role permissions:', loadingRolePermissions);
  }, [rolePermissions, rolePermissionOptions, selectedRolePermissions, loadingRolePermissions]);

  // Remove the getRoleId function since we don't need it
  // visibleToRoles will use the selected truck type IDs

  const [loading, setLoading] = useState(false);


  // Handle pickup address selection from Google Places
  const handlePickupAddressSelect = (address: ParsedAddress) => {
    console.log('Pickup address selected:', address);
    console.log('Pickup coordinates from address:', { 
      latitude: address.latitude, 
      longitude: address.longitude 
    });
    setPickupAddress(address.address);
    setPickupCity(address.city);
    setPickupState(address.state);
    setPickupZipCode(address.pincode);
    setPickupLat(address.latitude);
    setPickupLng(address.longitude);
    console.log('Pickup state updated:', { 
      pickupLat: address.latitude, 
      pickupLng: address.longitude 
    });
  };

  // Handle delivery address selection from Google Places
  const handleDeliveryAddressSelect = (address: ParsedAddress) => {
    console.log('Delivery address selected:', address);
    console.log('Delivery coordinates from address:', { 
      latitude: address.latitude, 
      longitude: address.longitude 
    });
    setDeliveryAddress(address.address);
    setDeliveryCity(address.city);
    setDeliveryState(address.state);
    setDeliveryZipCode(address.pincode);
    setDeliveryLat(address.latitude);
    setDeliveryLng(address.longitude);
    console.log('Delivery state updated:', { 
      deliveryLat: address.latitude, 
      deliveryLng: address.longitude 
    });
  };

  const validateForm = () => {
    if (
      !title ||
      !description ||
      !compensation ||
      !pickupAddressInput ||
      !pickupCity ||
      !pickupState ||
      !pickupZipCode ||
      !pickupDate ||
      !deliveryAddressInput ||
      !deliveryCity ||
      !deliveryState ||
      !deliveryZipCode ||
      !deliveryDate ||
      !distance ||
      !cargoType ||
      !cargoWeight ||
      !requiredTruckType || requiredTruckType.length === 0
    ) {
      showMessage({
        message: "Missing Information",
        description: t('errors.fillAllFields'),
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    // Validate role selection
    if (!selectedRolePermissions || selectedRolePermissions.length === 0) {
      showMessage({
        message: "Role Selection Required",
        description: "Please select at least one role to make this job visible to.",
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    // Validate coordinates
    if (pickupLat === 0 && pickupLng === 0) {
      showMessage({
        message: "Invalid Pickup Address",
        description: "Please select a valid pickup address from the suggestions",
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    if (deliveryLat === 0 && deliveryLng === 0) {
      showMessage({
        message: "Invalid Delivery Address",
        description: "Please select a valid delivery address from the suggestions",
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  const handleCreateJob = async () => {
    console.log("handleCreateJob called");
    console.log("Selected role permissions:", selectedRolePermissions);
    console.log("Role permissions length:", selectedRolePermissions?.length);
    
    // Validate form first - if validation fails, don't proceed with API call
    if (!validateForm()) {
      console.log("Form validation failed - not calling API");
      return;
    }

    console.log("Form validation passed - starting job creation...");
    setLoading(true);

    try {
      // Format data according to API specification
      const jobData = {
        title,
        description,
        payAmount: parseFloat(compensation),
        jobType: "short", // Default value, can be made configurable
        assignmentType: "auto", // Default value, can be made configurable
        startDate: new Date(pickupDate).toISOString(),
        endDate: new Date(deliveryDate).toISOString(),
        tonuAmount: 0, // Default value, can be made configurable
        isTonuEligible: true, // Default value, can be made configurable
        pickupLocation: {
          address: pickupAddress,
          city: pickupCity,
          state: pickupState,
          country: "US", // Default value, can be made configurable
          zipCode: pickupZipCode,
          lat: pickupLat,
          lng: pickupLng,
          date: pickupDate.toISOString().split('T')[0],
          time: pickupTimeWindow,
        },
        dropoffLocation: {
          address: deliveryAddress,
          city: deliveryCity,
          state: deliveryState,
          country: "US", // Default value, can be made configurable
          zipCode: deliveryZipCode,
          lat: deliveryLat,
          lng: deliveryLng,
          date: deliveryDate.toISOString().split('T')[0],
          time: deliveryTimeWindow,
        },
        cargo: {
          distance: parseFloat(distance),
          estimatedDuration,
          cargoType,
          cargoWeight: parseFloat(cargoWeight),
          cargoWeightUnit: "kg", // Default value, can be made configurable
          requiredTruckTypeIds: requiredTruckType.map(typeValue => parseInt(typeValue)),
        },
        specialRequirements: specialRequirements || "",
        visibleToRoles: selectedRolePermissions.map(roleValue => parseInt(roleValue)), // Use selected role permission IDs for visibleToRoles
      };

      console.log(jobData,'payload create job');
      console.log("Pickup coordinates:", { lat: pickupLat, lng: pickupLng });
      console.log("Delivery coordinates:", { lat: deliveryLat, lng: deliveryLng });
      console.log("About to dispatch createJob action");
      
      // Create the action first to verify it
      const action = createJob(
        jobData,
        (response) => {
          console.log("Job creation success:", response);
          // On success
          showMessage({
            message: "Job Created Successfully",
            description: "Your job has been posted and is now visible to selected roles.",
            type: "success",
            duration: 4000,
          });
          navigation.goBack();
          setLoading(false);
        },
        (error) => {
          console.log("Job creation error:", error);
          // On error
          setLoading(false);
          console.error("Error creating job:", error);
          showMessage({
            message: "Job Creation Failed",
            description: t('errors.jobCreationFailed'),
            type: "danger",
            duration: 5000,
          });
        }
      );
      
      console.log("Created action:", action);
      console.log("Action type:", action.type);
      console.log("Action payload:", action.payload);
      
      // Dispatch create job action
      dispatch(action);

    } catch (error) {
      console.error("Error in handleCreateJob:", error);
      showMessage({
        message: "Job Creation Failed",
        description: t('errors.jobCreationFailed'),
        type: "danger",
        duration: 5000,
      });
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('home.postNewJob')} />
 
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.jobDetails')}</Text>

          <Input
            label={t('jobs.jobTitle')}
            placeholder={t('jobs.jobTitlePlaceholder')}
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>{t('jobs.description')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('jobs.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={Colors.gray400}
            />
          </View>

          <Input
            label={t('jobs.compensation')}
            placeholder={t('jobs.amountPlaceholder')}
            value={compensation}
            onChangeText={setCompensation}
            keyboardType="numeric"
            leftIcon={<DollarSign size={20} color={Colors.gray400} />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.pickupInfo')}</Text>

          <AddressDropdown
            label={t('jobs.streetAddress')}
            placeholder={t('jobs.pickupAddressPlaceholder')}
            value={pickupAddressInput}
            onAddressSelect={handlePickupAddressSelect}
            onTextChange={setPickupAddressInput}
          />

          <Text style={styles.autoFillNote}>
            💡 City, State, and Zip Code will be auto-filled when you select an address
          </Text>

          <View style={styles.rowInputs}>
            <Input
              label={t('jobs.city')}
              placeholder={t('jobs.city')}
              value={pickupCity}
              onChangeText={setPickupCity}
              containerStyle={styles.rowInput}
            />

            <Input
              label={t('jobs.state')}
              placeholder={t('jobs.state')}
              value={pickupState}
              onChangeText={setPickupState}
              containerStyle={styles.rowInput}
            />

            <Input
              label={t('jobs.zipCode')}
              placeholder={t('jobs.zipCode')}
              value={pickupZipCode}
              onChangeText={setPickupZipCode}
              keyboardType="numeric"
              containerStyle={styles.rowInput}
            />
          </View>

          <View style={styles.rowInputs}>
            <Input
              label={t('jobs.date')}
              placeholder="MM/DD/YYYY"
              value={pickupDate.toLocaleDateString()}
              onChangeText={() => {}}
              leftIcon={<Calendar size={20} color={Colors.gray400} />}
              containerStyle={styles.dateInput}
              onPress={() => setShowPickupDatePicker(true)}
            />

            <Input
              label={t('jobs.timeWindow')}
              placeholder={t('jobs.timeWindowPlaceholder')}
              value={pickupTimeWindow}
              onChangeText={setPickupTimeWindow}
              containerStyle={styles.timeInput}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.deliveryInfo')}</Text>

          <AddressDropdown
            label={t('jobs.streetAddress')}
            placeholder={t('jobs.deliveryAddressPlaceholder')}
            value={deliveryAddressInput}
            onAddressSelect={handleDeliveryAddressSelect}
            onTextChange={setDeliveryAddressInput}
          />

          <Text style={styles.autoFillNote}>
            💡 City, State, and Zip Code will be auto-filled when you select an address
          </Text>

          <View style={styles.rowInputs}>
            <Input
              label={t('jobs.city')}
              placeholder={t('jobs.city')}
              value={deliveryCity}
              onChangeText={setDeliveryCity}
              containerStyle={styles.rowInput}
            />

            <Input
              label={t('jobs.state')}
              placeholder={t('jobs.state')}
              value={deliveryState}
              onChangeText={setDeliveryState}
              containerStyle={styles.rowInput}
            />

            <Input
              label={t('jobs.zipCode')}
              placeholder={t('jobs.zipCode')}
              value={deliveryZipCode}
              onChangeText={setDeliveryZipCode}
              keyboardType="numeric"
              containerStyle={styles.rowInput}
            />
          </View>

          <View style={styles.rowInputs}>
            <Input
              label={t('jobs.date')}
              placeholder="MM/DD/YYYY"
              value={deliveryDate.toLocaleDateString()}
              onChangeText={() => {}}
              leftIcon={<Calendar size={20} color={Colors.gray400} />}
              containerStyle={styles.dateInput}
              onPress={() => setShowDeliveryDatePicker(true)}
            />

            <Input
              label={t('jobs.timeWindow')}
              placeholder={t('jobs.timeWindowPlaceholder')}
              value={deliveryTimeWindow}
              onChangeText={setDeliveryTimeWindow}
              containerStyle={styles.timeInput}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.cargoInfo')}</Text>

          <View style={styles.rowInputs}>
            <Input
              label={t('jobs.distance')}
              placeholder={t('jobs.distancePlaceholder')}
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
              containerStyle={styles.rowInput}
            />

            <Input
              label={t('jobs.estimatedDuration')}
              placeholder={t('jobs.durationPlaceholder')}
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              containerStyle={styles.rowInput}
            />
          </View>

          <Input
            label={t('jobs.cargoType')}
            placeholder={t('jobs.cargoTypePlaceholder')}
            value={cargoType}
            onChangeText={setCargoType}
            leftIcon={<Package size={20} color={Colors.gray400} />}
          />

          <Input
            label={t('jobs.cargoWeight')}
            placeholder={t('jobs.weightPlaceholder')}
            value={cargoWeight}
            onChangeText={setCargoWeight}
          />

          <MultiSelect
            label={t('jobs.requiredTruckType')}
            placeholder={t('jobs.truckTypePlaceholder')}
            options={truckTypeOptions}
            selectedValues={requiredTruckType}
            onSelectionChange={setRequiredTruckType}
            leftIcon={<Truck size={20} color={Colors.gray400} />}
          />


          <MultiSelect
            label="Role Permissions *"
            placeholder={loadingRolePermissions ? "Loading..." : "Select role permissions"}
            options={rolePermissionOptions}
            selectedValues={selectedRolePermissions}
            onSelectionChange={setSelectedRolePermissions}
            leftIcon={<Info size={20} color={Colors.gray400} />}
            disabled={loadingRolePermissions}
            required={true}
          />
        </View>

      

        {/* <TouchableOpacity
          style={styles.advancedToggle}
          onPress={toggleAdvancedOptions}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvancedOptions
              ? t('jobs.hideAdvancedOptions')
              : t('jobs.showAdvancedOptions')}
          </Text>
          {showAdvancedOptions ? (
            <ChevronUp size={20} color={Colors.primary} />
          ) : (
            <ChevronDown size={20} color={Colors.primary} />
          )}
        </TouchableOpacity> */}

        {/* {showAdvancedOptions && ( */}
          <View style={styles.section}>
            <View style={styles.textAreaContainer}>
              <Text style={styles.label}>{t('jobs.specialRequirements')}</Text>
              <TextInput
                style={styles.textArea}
                placeholder={t('jobs.specialRequirementsPlaceholder')}
                value={specialRequirements}
                onChangeText={setSpecialRequirements}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={Colors.gray400}
              />
            </View>
          </View>
        {/* )} */}

        <View style={styles.termsContainer}>
          <Info size={16} color={Colors.warning} style={styles.termsIcon} />
          <Text style={styles.termsText}>
            {t('jobs.termsAgreement')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: Colors.primary, padding: 16, borderRadius: 8, alignItems: 'center' }]}
          onPress={handleCreateJob}
          disabled={loading}
        >
          <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Creating...' : t('home.postNewJob')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <DatePicker
        modal
        open={showPickupDatePicker}
        date={pickupDate}
        onConfirm={(date) => {
          setPickupDate(date);
          setShowPickupDatePicker(false);
        }}
        onCancel={() => {
          setShowPickupDatePicker(false);
        }}
      />

      <DatePicker
        modal
        open={showDeliveryDatePicker}
        date={deliveryDate}
        onConfirm={(date) => {
          setDeliveryDate(date);
          setShowDeliveryDatePicker(false);
        }}
        onCancel={() => {
          setShowDeliveryDatePicker(false);
        }}
      />
    </View>
  );
}

export { CreateJobScreen };