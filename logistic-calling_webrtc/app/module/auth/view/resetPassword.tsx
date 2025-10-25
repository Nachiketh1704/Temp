import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

// Components
import { Input } from "@app/components/Input";
import { Button } from "@app/components/Button";

// Styles
import { useThemedStyle, Colors } from "@app/styles";
import { getStyles } from "./resetPasswordStyle";

// Redux
import { resetPassword } from "../slice";
import { selectLoader } from "@app/module/common";

// Navigation
import { Routes } from "@app/navigator";

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const styles = useThemedStyle(getStyles);
  const loading = useSelector(selectLoader);

  // Get token from route params
  const { token } = (route?.params as any) || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = () => {
    // Validation
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token. Please try again.");
      return;
    }

    setError("");

    // Call reset password API
    dispatch(
      resetPassword({
        token,
        newPassword: password,
        onSuccess: (response: any) => {
          Alert.alert(
            "Password Reset Successful",
            "Your password has been reset successfully. You can now login with your new password.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate(Routes.LoginScreen as never),
              },
            ]
          );
        },
        onError: (error: any) => {
          setError(
            error?.message || "Failed to reset password. Please try again."
          );
        },
      })
    );
  };

  return (
    <ImageBackground
      source={require("../../../assets/bg1.jpeg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/logisticLogo.jpeg")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>

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

            <View style={{ marginVertical: 40 }}>
              {/* <Input
                label="New Password"
                placeholder="Enter your new password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={20} color={Colors.gray400} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color={Colors.gray400} />
                    ) : (
                      <Eye size={20} color={Colors.gray400} />
                    )}
                  </TouchableOpacity>
                }
              /> */}
                   <Input
                label="New Password"
                placeholder="Enter your new password"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={<Lock size={20} color={Colors.gray400} />}
              />
              <Input
                label="Confirm Password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                leftIcon={<Lock size={20} color={Colors.gray400} />}
              />
              {/* <Input
                label="Confirm Password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                leftIcon={<Lock size={20} color={Colors.gray400} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={Colors.gray400} />
                    ) : (
                      <Eye size={20} color={Colors.gray400} />
                    )}
                  </TouchableOpacity>
                }
                style={{ marginTop: 20 }}
              /> */}
            </View>

            <Button
              title="Reset Password"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleResetPassword}
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ResetPasswordScreen;
