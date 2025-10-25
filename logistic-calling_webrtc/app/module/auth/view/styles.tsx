/**
 * Auth Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet, Typography } from "@app/styles";

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      // backgroundColor: Colors.background,
      // opacity:0.5
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: "24@ms",
    },
    header: {
      paddingTop: "10@ms",
      paddingHorizontal: "24@ms",
      // marginBottom: '32@ms',
    },
    headerRole: {
      paddingTop: "30@ms",
      paddingHorizontal: "24@ms",
      // marginBottom: '32@ms',
    },
    backButton: {
      width: "40@ms",
      height: "40@ms",
      borderRadius: "20@ms",
      backgroundColor: Colors.backgroundCard,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      // marginBottom: "24@ms",
    },
    logoContainer: {
      alignItems: "center",
    },
    logoImage: {
      width: "100@ms",
      height: "100@ms",
      borderRadius: "20@ms",
    },
    formContainer: {
      paddingHorizontal: "24@ms",
    },
    title: {
      fontSize: "28@ms",
      fontWeight: "bold",
      color: Colors.text,
      marginBottom: "8@ms",
      textAlign: "center",
    },
    subtitle: {
      fontSize: "16@ms",
      color: Colors.white,
      marginBottom: "10@ms",
      textAlign: "center",
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.error + "15",
      padding: "12@ms",
      borderRadius: "8@ms",
      marginBottom: "16@ms",
    },
    errorIcon: {
      marginRight: "8@ms",
    },
    errorText: {
      color: Colors.error,
      fontSize: "14@ms",
      flex: 1,
    },
    optionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24@ms",
    },
    rememberMeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    rememberMeText: {
      marginLeft: "8@ms",
      color: Colors.white,
      fontSize: "14@ms",
    },
    forgotPasswordContainer: {
      alignSelf: "flex-end",
    },
    forgotPasswordText: {
      color: Colors.primary,
      fontSize: "14@ms",
    },
    loginButton: {
      marginBottom: "24@ms",
    },
    demoHelper: {
      backgroundColor: Colors.gray100,
      padding: "16@ms",
      borderRadius: "8@ms",
      marginBottom: "24@ms",
    },
    demoHelperTitle: {
      fontWeight: "600",
      marginBottom: "12@ms",
      color: Colors.text,
      fontSize: "15@ms",
    },
    demoAccount: {
      marginBottom: "10@ms",
    },
    demoHelperText: {
      color: Colors.gray700,
      marginBottom: "2@ms",
    },
    demoCredential: {
      color: Colors.primary,
      fontWeight: "500",
    },
    demoHelperDescription: {
      color: Colors.gray600,
      fontSize: "13@ms",
      marginLeft: "10@ms",
    },
    demoHelperNote: {
      color: Colors.gray700,
      marginTop: "6@ms",
      fontStyle: "italic",
      fontSize: "13@ms",
    },
    registerContainer: {
      alignItems: "center",
    },
    registerText: {
      fontSize: "14@ms",
      color: Colors.white,
    },
    registerLink: {
      color: Colors.primary,
      fontWeight: "600",
    },

    // Register
    termsContainer: {
      marginBottom: "24@ms",
    },
    termsText: {
      fontSize: "14@ms",
      color: Colors.gray600,
      lineHeight: "20@ms",
    },
    termsLink: {
      color: Colors.primary,
      fontWeight: "500",
    },
    registerButton: {
      marginBottom: "24@ms",
    },
    loginContainer: {
      alignItems: "center",
    },
    loginText: {
      fontSize: "14@ms",
      color: Colors.gray600,
    },
    loginLink: {
      color: Colors.primary,
      fontWeight: "600",
    },

    // Role_Select
    content: {
      flex: 1,
      paddingHorizontal: "24@ms",
    },
    rolesContainer: {
      flexDirection: "row",
      gap: "20@ms",
    },
    roleCard: {
      backgroundColor: Colors.white,
      borderRadius: "16@ms",
      padding: "20@ms",
      height: 350,
      width: "48%",
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 2,
      borderColor: "transparent",
    },
    selectedRoleCard: {
      borderColor: Colors.primary,
    },
    roleImageContainer: {
      position: "relative",
      height: "120@ms",
      marginBottom: "16@ms",
      borderRadius: "8@ms",
      overflow: "hidden",
    },
    roleImage: {
      width: "100%",
      height: "100%",
    },
    checkmarkContainer: {
      position: "absolute",
      top: "8@ms",
      right: "8@ms",
      width: "32@ms",
      height: "32@ms",
      borderRadius: "16@ms",
      backgroundColor: Colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    roleIconContainer: {
      width: "48@ms",
      height: "48@ms",
      borderRadius: "24@ms",
      backgroundColor: Colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "16@ms",
    },
    merchantIconContainer: {
      backgroundColor: Colors.secondary,
    },
    roleName: {
      fontSize: "20@ms",
      fontWeight: "bold",
      color: Colors.white,
      marginBottom: "8@ms",
    },
    roleDescription: {
      fontSize: "14@ms",
      color: Colors.gray600,
      marginBottom: "16@ms",
      lineHeight: "20@ms",
    },
    roleFeatures: {
      marginTop: "8@ms",
    },
    roleFeatureItem: {
      fontSize: "14@ms",
      color: Colors.gray700,
      marginBottom: "6@ms",
      lineHeight: "20@ms",
    },
    footer: {
      padding: "24@ms",
      paddingBottom: "36@ms",
    },
    formWrapper: {
      paddingHorizontal: "24@ms",
      backgroundColor: "rgba(0, 0, 0, 0.6)", // dark semi-transparent
      borderRadius: "12@ms",
      marginHorizontal: "12@ms",
      paddingVertical: "24@ms",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    containerDropdown: {
      // padding: 20,
      marginVertical: 15,
      zIndex: 999, // IMPORTANT if used with other positioned components
      // backgroundColor: Colors.backgroundCard,
    },
    dropdown: {
      // borderColor: '#ccc',
      backgroundColor: Colors.backgroundCard,
    },
    dropdownContainer: {
      // borderColor: '#ccc',
      backgroundColor: Colors.backgroundCard,
    },
    label: {
      fontSize: "14@ms",
      fontWeight: "500",
      marginBottom: "6@ms",
      color: Colors.white,
    },
    dropdownText: {
      color: Colors.text, // 👈 change this to your desired color
      fontSize: "16@ms",
    },
    profileImageContainer: {
      alignItems: "center",
    },
    profileImage: {
      width: "100@ms",
      height: "100@ms",
      borderRadius: "50@ms",
      borderWidth: 4,
      borderColor: Colors.backgroundCard,
    },
    changeProfileButton: {
      marginTop: "8@ms",
    },
     editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor:Colors.primary, // iOS blue or your theme color
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff", // white border to separate from image
  },
  editIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Country picker styles
  countryContainer: {
    marginBottom: 16,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.gray300,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'space-between',
  },
  countryPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryNameText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  phonePrefix: {
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.gray300,
    marginRight: 8,
  },
  phonePrefixText: {
    color: Colors.text,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  countryCode: {
    fontSize: 14,
    color: Colors.gray500,
  },
  });
