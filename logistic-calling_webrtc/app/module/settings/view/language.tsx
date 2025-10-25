import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";

//Screens
import { Colors } from "@app/styles";
import { languages } from "@app/constants/languages";
import { useAuthStore } from "@app/store/authStore";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { useNavigation } from "@react-navigation/native";
import { Language, useLanguageStore } from "@app/store/languageStore";
import i18n from "@app/language/i18n";
import Header from "@app/components/Header";
export default function LanguageSettingsScreen() {
  const styles = useThemedStyle(getStyles);
  const { currentLanguage, setLanguage } = useLanguageStore();

  const navigation = useNavigation();
  const handleSelectLanguage = (language: Language) => {
    i18n.changeLanguage(language); // ✅ Tell i18n to switch language

    setLanguage(language);
  };

  const renderLanguageItem = ({ item }: { item: (typeof languages)[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        item.code === currentLanguage && styles.selectedLanguage,
      ]}
      onPress={() => handleSelectLanguage(item.code)}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.languageFlag}>{item.flag}</Text>
        <Text
          style={[
            styles.languageName,
            item.code === currentLanguage && styles.selectedLanguageText,
          ]}
        >
          {item.name}
        </Text>
      </View>

      {item.code === currentLanguage && (
        <CheckCircle2 size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
            <Header title={'Language Settinga'} />

      {/* <View style={styles.headerBack}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Language Settings</Text>
        <TouchableOpacity style={[styles.filterButton]}></TouchableOpacity>
      </View> */}
      <View style={styles.header}>
        {/* <Text style={styles.title}>Language Settings</Text> */}
        <Text style={styles.subtitle}>
          Choose your preferred language for the app interface
        </Text>
      </View>

      <FlatList
        data={languages}
        keyExtractor={(item) => item.code}
        renderItem={renderLanguageItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

export { LanguageSettingsScreen };
