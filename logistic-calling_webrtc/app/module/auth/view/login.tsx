import React, { useState ,useEffect} from "react";
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
} from "react-native"; // ✅ Added ImageBackground
import {
  Mail,
  Lock,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react-native";
import { useDispatch ,useSelector} from "react-redux";

import { Colors, useThemedStyle } from "@app/styles";
import { createLoader, selectLoader } from "@app/module/common";
import { Input } from "@app/components/Input";
import { Button } from "@app/components/Button";
import { getStyles } from "./loginStyle";
import { login, roles } from "../slice";
import { useAuthStore } from "@app/store/authStore";
import { Routes } from "@app/navigator";
import { useTranslation } from "react-i18next";
const loader = createLoader();

function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();

  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const { login: mockLogin } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const loading = useSelector(selectLoader);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t("auth.login.errors.fillFields"));

      return;
    }
    setError("");
    const payload = {
      email: email,
      password: password,
    };
    
    // Call the actual login API - saga will handle loading state
    dispatch(login(payload));
  };
  useEffect(() => {
    dispatch(roles());
  }, [dispatch]);

  return (
    <ImageBackground
      source={require("../../../assets/bg1.jpeg")} // ✅ Your image path here
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
            
            {/* <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity> */}

            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/logisticLogo.jpeg")} // ✅ Your image path here
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>{t("auth.login.title")}</Text>

            <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>

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

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={Colors.gray400} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Lock size={20} color={Colors.gray400} />}
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                {rememberMe ? (
                  <CheckSquare size={20} color={Colors.primary} />
                ) : (
                  <Square size={20} color={Colors.gray400} />
                )}
                <Text style={styles.rememberMeText}>
                  {t("auth.login.rememberMe")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate(Routes.ForgetPassword)}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>
                  {t("auth.login.forgotPassword")}?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={t("auth.login.signIn")}
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            />

            {/* {demoHelperText()} */}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                {t("auth.login.noAccount")}{" "}
                <Text
                  style={styles.registerLink}
                  onPress={() => navigation.navigate(Routes.RoleSelectScreen)}
                >
                  {t("auth.login.register")}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

export { LoginScreen };
