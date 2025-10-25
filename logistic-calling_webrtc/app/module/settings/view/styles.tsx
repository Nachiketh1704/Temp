/**
 * Setting Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    // Language screen style
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      padding: '20@ms',
      borderBottomWidth: 1,
      borderBottomColor: Colors.gray200,
      backgroundColor: Colors.background,
    },
    title: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      // marginBottom: '8@ms',
    },
    subtitle: {
      fontSize: '16@ms',
      color: Colors.gray600,
    },
    listContent: {
      padding: '20@ms',
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: '12@ms',
      padding: '16@ms',
      marginBottom: '12@ms',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    selectedLanguage: {
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    languageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageFlag: {
      fontSize: '24@ms',
      marginRight: '16@ms',
    },
    languageName: {
      fontSize: '16@ms',
      color: Colors.white,
    },
    selectedLanguageText: {
      fontWeight: '600',
      color: Colors.primary,
    },

    // Terms screen style
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: '20@ms',
      paddingBottom: '40@ms',
    },
    date: {
      fontSize: '14@ms',
      color: Colors.gray500,
      marginBottom: '24@ms',
    },
    section: {
      marginBottom: '24@ms',
    },
    sectionTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '12@ms',
    },
    paragraph: {
      fontSize: '16@ms',
      color: Colors.gray500,
      lineHeight: '24@ms',
      marginBottom: '12@ms',
    },
    listItem: {
      fontSize: '16@ms',
      color: Colors.gray800,
      lineHeight: '24@ms',
      marginBottom: '8@ms',
      paddingLeft: '16@ms',
    },
    bold: {
      fontWeight: '600',
    },
    headerBack: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: '20@ms',
      paddingTop: '40@ms',
      paddingBottom: '20@ms',
      backgroundColor: Colors.backgroundLight,
    },
    backButton: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
