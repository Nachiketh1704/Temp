/**
 * Register Screen
 * @format
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActionSheetIOS,
  Image,
  PermissionsAndroid,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Linking,
} from "react-native";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Search,
  X,
} from "lucide-react-native";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { Input } from "@app/components/Input";
import { Button } from "@app/components/Button";
import { createLoader, uploadFile } from "../../common";
import { getStyles } from "./styles";
import { Routes } from "@app/navigator";
import DropDownPicker from "react-native-dropdown-picker";
import { useRoute } from "@react-navigation/native";
import { signUp } from "../slice";
import ImageCropPicker from "react-native-image-crop-picker";
import { showMessage } from "react-native-flash-message";
import { COUNTRIES, findCountryByCallingCode, filterCountries } from "@app/constants/countries";

const loader = createLoader();

function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation();
  const route = useRoute();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    {
      label: t("profile.merchantTypes.shipper"),
      value: 2,
    },
    {
      label: t("profile.merchantTypes.broker"),
      value: 1,
    },
    {
      label: t("profile.merchantTypes.carrier"),
      value: 3,
    },
  ]);
  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  // Country picker state
  const [countryCode, setCountryCode] = useState("+1");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter countries based on search query
  const filteredCountries = filterCountries(searchQuery);

  // Country picker functions
  const onCountrySelect = (country: any) => {
    setSelectedCountry(country);
    setCountryCode(`+${country.callingCode[0]}`);
    setCountryPickerVisible(false);
    setSearchQuery("");
  };

  const handleRegister = async () => {
    // Validate inputs
    const isMerchant = (route?.params as any)?.type === "merchant";
    if (!name || !email || !phone || !password || !confirmPassword || (isMerchant && !companyName)) {
      setError(t("auth.register.errors.fillFields"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"));
      return;
    }

    // If there's a local image but no uploaded URL, wait for upload to complete
    if (localImageUri && !uploadedImageUrl && isUploading) {
      setError("Please wait for image upload to complete");
      return;
    }

    setLoading(true);
    setError("");
    const payload = {
      userName: name,
      email: email,
      password: password,
      phoneNumber: phone,
      phoneCountryCode: countryCode,
      callbackUrl: "string",
      companyTypeId: value,
      companyName: isMerchant ? companyName : name,
      profileImage: uploadedImageUrl || localImageUri
    };
console.log(payload,'payloadddddddd')
    try {
      const response = await dispatch(signUp(payload));
      console.log("Signup dispatch completed:", response);
      
      // Navigation is now handled in the saga
      // No need to check response here as saga handles success/error
      
    } catch (err) {
      // Handle any unexpected errors
      const errorMessage = err?.message || t("auth.register.errors.registerError");
      setError(errorMessage);
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };
  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs access to your camera",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            "Permission Required",
            "Camera permission is required. Please enable it in app settings.",
            [
              { text: "Cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const permission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission, {
          title: "Storage Permission",
          message: "App needs access to your files",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        });

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            "Permission Required",
            "Storage permission is required. Please enable it in app settings.",
            [
              { text: "Cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      } catch (err) {
        console.warn("Permission error:", err);
        return false;
      }
    }
    return true;
  };
  const handleImagePicker = async (
    source: "camera" | "library",
    uploadType: "COVER" | "PROFILE"
  ) => {
    try {
      setMediaLoading(true);
      let result;

      const options = {
        cropping: true,
        cropperToolbarTitle: `Crop ${
          uploadType === "COVER" ? "Cover" : "Profile"
        } Image`,
        width: uploadType === "COVER" ? 1600 : 800,
        height: uploadType === "COVER" ? 900 : 800,
        compressImageQuality: 0.8,
        multiple: false,
      };

      if (source === "camera") {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;
        result = await ImageCropPicker.openCamera(options);
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) return;
        result = await ImageCropPicker.openPicker(options);
      }

      if (!result?.path) return;

      setLocalImageUri(result.path);
      
      // Create file data for upload
      const fileData = {
        uri: result.path,
        type: result.mime || "image/jpeg",
        name: `${uploadType.toLowerCase()}_${Date.now()}.jpg`,
      };

      setIsUploading(true);
      
      // Upload the file using the correct upload function
    const response =  dispatch(uploadFile(
        fileData,
        (response) => {
          // Success callback
          showMessage({
            message: `${
              uploadType === "COVER" ? "Cover" : "Profile"
            } image uploaded successfully!`,
            type: "success",
          });

          // Store the uploaded image URL from server response
          console.log("Upload response:", response);
          if (response?.data?.url) {
            setUploadedImageUrl(response.data.url);
            console.log("Uploaded image URL:", response.data.url);
          } else if (response?.url) {
            setUploadedImageUrl(response.url);
            console.log("Uploaded image URL (direct):", response.url);
          } else if (response?.payload?.url) {
            setUploadedImageUrl(response.payload.url);
            console.log("Uploaded image URL (payload):", response.payload.url);
          } else if (response?.payload?.data?.url) {
            setUploadedImageUrl(response.payload.data.url);
            console.log("Uploaded image URL (payload.data):", response.payload.data.url);
          } else {
            console.log("No URL found in response:", response);
          }
          setIsUploading(false);
          setMediaLoading(false);
        },
        (error) => {
          // Error callback
          console.log("Upload error:", error);
          showMessage({
            message: `Failed to upload ${
              uploadType === "COVER" ? "cover" : "profile"
            } image. Please try again.`,
            type: "warning",
          });
          setIsUploading(false);
          setMediaLoading(false);
        }
      ));
      console.log(response, "response upload file");
    } catch (error) {
      console.error("Media Picker Error:", error);
      showMessage({
        message: `Failed to upload ${
          uploadType === "COVER" ? "cover" : "profile"
        } image. Please try again.`,
        type: "warning",
      });
      setIsUploading(false);
      setMediaLoading(false);
    }
  };
  const showUploadOptions = (type: "COVER" | "PROFILE") => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleImagePicker("camera", type);
          } else if (buttonIndex === 2) {
            await handleImagePicker("library", type);
          }
        }
      );
    } else {
      Alert.alert("Upload Media", "Choose an option", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Take Photo",
          onPress: async () => await handleImagePicker("camera", type),
        },
        {
          text: "Choose from Library",
          onPress: async () => await handleImagePicker("library", type),
        },
      ]);
    }
  };

  // Custom Country Picker Modal
  const renderCountryPicker = () => (
    <Modal
      visible={countryPickerVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCountryPickerVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity 
              onPress={() => {
                setCountryPickerVisible(false);
                setSearchQuery("");
              }}
              style={styles.closeButton}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.gray400} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.gray400}
            />
          </View>
          
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.cca2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => onCountrySelect(item)}
              >
                <Text style={styles.countryFlag}>{item.emoji}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>+{item.callingCode[0]}</Text>
              </TouchableOpacity>
            )}
            style={styles.countryList}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ ...styles.container, backgroundColor: Colors.black }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        {/* <Header title="Call History" /> */}

        <View style={styles.formContainer}>
          <Text style={styles.title}>{t("auth.register.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.register.subtitle")}</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <AlertCircle
                size={18}
                color={Colors.error}
                style={styles.errorIcon}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => showUploadOptions("PROFILE")} disabled={isUploading}>
              {" "}
              <Image
                source={
                  localImageUri
                    ? { uri: localImageUri }
                    : require("../../../assets/dummyImage.png")
                }
                style={styles.profileImage}
                // loaderShown={true}
              />
              <View style={styles.editButton}>
      <Text style={styles.editIcon}>✎</Text> 
      {/* You can use an Icon from react-native-vector-icons instead */}
    </View>
            </TouchableOpacity>
            {isUploading && (
              <View style={styles.uploadIndicator}>
                <Text style={styles.uploadText}>Uploading...</Text>
              </View>
            )}
            {uploadedImageUrl && (
              <View style={styles.uploadSuccessIndicator}>
                <Text style={styles.uploadSuccessText}>✓ Uploaded</Text>
              </View>
            )}
          </View>
          {(route?.params as any)?.type == "merchant" && (
            <View style={styles.containerDropdown}>
              <Text style={[styles.label]}>
                {t("profile.merchantTypes.merchantType")}
              </Text>

              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                ArrowDownIconComponent={() => (
                  <ChevronDown color={Colors.text} size={24} />
                )}
                ArrowUpIconComponent={() => (
                  <ChevronUp color={Colors.text} size={24} />
                )}
                placeholder={t("buttons.select")}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
              />
            </View>
          )}

          {(route?.params as any)?.type == "merchant" && (
            <Input
              label={t("auth.register.companyName")}
              placeholder={t("auth.register.companyNamePlaceholder")}
              value={companyName}
              onChangeText={setCompanyName}
              leftIcon={<Building2 size={20} color={Colors.gray400} />}
            />
          )}

          <Input
            label={t("auth.register.fullName")}
            placeholder={t("auth.register.fullNamePlaceholder")}
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={Colors.gray400} />}
          />

          <Input
            label={t("auth.register.email")}
            placeholder={t("auth.register.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={Colors.gray400} />}
          />

          {/* Country Selection */}
          <View style={styles.countryContainer}>
            <Text style={styles.label}>{t("forms.country")}</Text>
            <TouchableOpacity
              style={styles.countryPickerButton}
              onPress={() => setCountryPickerVisible(true)}
            >
              <View style={styles.countryPickerContent}>
                <Text style={styles.countryFlag}>{selectedCountry.emoji}</Text>
                <Text style={styles.countryNameText}>
                  {selectedCountry.name} (+{selectedCountry.callingCode[0]})
                </Text>
              </View>
              <ChevronDown size={16} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Phone Number Input */}
          <Input
            label={t("auth.register.phone")}
            placeholder={t("auth.register.phonePlaceholder")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>{countryCode}</Text>
              </View>
            }
          />

          <Input
            label={t("auth.register.password")}
            placeholder={t("auth.register.passwordPlaceholder")}
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={20} color={Colors.gray400} />}
          />

          <Input
            label={t("auth.register.confirmPassword")}
            placeholder={t("auth.register.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            leftIcon={<Lock size={20} color={Colors.gray400} />}
          />

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              {t("auth.register.termsText").split("Terms of Service")[0]}
              <Text
                onPress={() => navigation.navigate(Routes.TermsScreen)}
                style={styles.termsLink}
              >
                {t("auth.register.termsService")}
              </Text>{" "}
              and{" "}
              <Text
                onPress={() => navigation.navigate(Routes.PrivacyPolicyScreen)}
                style={styles.termsLink}
              >
                {t("auth.register.privacyPolicy")}
              </Text>
            </Text>
          </View>

          <Button
            title={t("auth.register.createAccount")}
            variant="primary"
            fullWidth
            loading={loading || isUploading}
            onPress={handleRegister}
            style={styles.registerButton}
            disabled={isUploading}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              {t("auth.register.haveAccount")}{" "}
              <Text
                style={styles.loginLink}
                onPress={() => navigation.navigate(Routes.LoginScreen)}
              >
                {t("auth.login.signIn")}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Custom Country Picker Modal */}
      {renderCountryPicker()}
    </KeyboardAvoidingView>
  );
}

export { RegisterScreen };
