// components/CustomHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { ArrowLeft, Bell, Menu, Route } from "lucide-react-native";
import { Colors } from "@app/styles";
import { ms } from "react-native-size-matters";
import { Routes } from "@app/navigator";

type Props = {
  title: string;
};

const DrawerHeader: React.FC<Props> = ({ title }) => {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Menu size={ms(30)} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(Routes.NotificationScreen);
        }}
      >
        <Bell size={ms(30)} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ms(20),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    // backgroundColor: Colors.primary,
    // top:ms(10)
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
  },
});

export default DrawerHeader;
