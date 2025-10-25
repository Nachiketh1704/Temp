/**
 * RoleSelector Screen
 * @format
 */

import React, { useState, useEffect, use } from "react";
import { View, Text, StatusBar, TouchableOpacity, Image } from "react-native";
import { ArrowLeft, Truck, Building2, CheckCircle2 } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
//Screens
import { Colors } from "@app/styles";
import { Button } from "@app/components/Button";
// import { useAuthStore } from '@app/store/authStore';
import { useThemedStyle } from "@app/styles";
import { UserRole } from "@app/types";
import { createLoader, selectRoles, selectUser } from "../../common";
import { getStyles } from "./styles";
import { Routes } from "@app/navigator";
import { roles } from "../slice";

const loader = createLoader();

function RoleSelectScreen({ navigation }: any) {
  const styles = useThemedStyle(getStyles);
  const disptach = useDispatch();
  const rolesCat = useSelector(selectRoles);

  // const { setUserRole, login } = useAuthStore();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const features = t("auth.roleSelect.driver.features", {
    returnObjects: true,
  });
  console.log(rolesCat, "rolesCatrolesCatrolesCatrolesCatrolesCatrolesCat");
  // useEffect(() => {
  //   disptach(roles());
  // }, [disptach]);
  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      disptach(loader.present());
      // Set the user role in the store
      setUserRole(selectedRole);

      // In a real app, we would call an API to complete registration
      // For this demo, we'll simulate a login with a demo account

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Login with a demo account based on the selected role
      if (selectedRole === "driver") {
        await login("driver@example.com", "password");
      } else {
        await login("merchant@example.com", "password");
      }

      // Navigation will happen automatically via the _layout.tsx effect
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ ...styles.container, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.headerRole}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t("auth.roleSelect.title")}</Text>
        <Text style={styles.subtitle}>{t("auth.roleSelect.subtitle")}</Text>

        <View style={styles.rolesContainer}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: Colors.background,
                borderColor: Colors.gray700,
              },

              selectedRole === "driver" && styles.selectedRoleCard,
            ]}
            onPress={() => setSelectedRole("driver")}
            activeOpacity={0.8}
          >
            <Text style={styles.roleName}>
              {rolesCat[1]?.name}
              {/* {t("auth.roleSelect.driver.title")} */}
            </Text>
            <Text style={styles.roleDescription}>
                            {rolesCat[1]?.description}

              {/* {t("auth.roleSelect.driver.description")} */}
            </Text>

            {/* <View style={styles.roleFeatures}>
              {features.map((feature, index) => (
                <Text key={index} style={styles.roleFeatureItem}>
                  • {feature}
                </Text>
              ))}{" "}
        
            </View> */}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                marginTop: 50,
                backgroundColor: Colors.background,
                borderColor: Colors.gray700,
              },

              selectedRole === "merchant" && styles.selectedRoleCard,
            ]}
            onPress={() => setSelectedRole("merchant")}
            activeOpacity={0.8}
          >
            <Text style={styles.roleName}>
              {rolesCat[0]?.name}

              {/* {t("profile.merchantTypes.shipper")} */}
            </Text>
            <Text style={styles.roleDescription}>
              {rolesCat[0]?.description}

              {/* {t("auth.roleSelect.merchant.description")} */}
            </Text>
            {/* <View style={styles.roleFeatures}>
            
              <Text style={styles.roleFeatureItem}>Merchant</Text>
            </View> */}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={t("auth.roleSelect.continue")}
          variant="primary"
          fullWidth
          disabled={!selectedRole}
          loading={loading}
          onPress={() =>
            navigation.navigate(Routes.RegisterScreen, { type: selectedRole })
          }

          // onPress={handleContinue}
        />
      </View>
    </View>
  );
}

export { RoleSelectScreen };
