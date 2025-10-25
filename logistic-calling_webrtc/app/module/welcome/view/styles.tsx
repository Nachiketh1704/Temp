/**
 * Welcome Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from "@app/styles";

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    background: {
      // height: '10%',
      position: "relative",
      // backgroundColor:'red'
    },
    backgroundImage: {
      ...ScaledSheet.absoluteFillObject,
      opacity: 0.7,
    },
    overlay: {
      ...ScaledSheet.absoluteFillObject,
    },
    languageContainer: {
      position: "absolute",
      // top: "50@ms",
      right: "20@ms",
      zIndex: 10,
    },
    logo: {
      height: "150@ms",
      width: "150@ms",
            borderRadius: '30@ms',

    },
    logoContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    logoCircle: {
      width: "100@ms",
      height: "100@ms",
      borderRadius: "50@ms",
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: "2@ms",
      borderColor: Colors.primary,
    },
    appName: {
      fontSize: "32@ms",
      fontWeight: "bold",
      color: Colors.white,
      // marginTop: '16@ms',
    },
    tagline: {
      fontSize: "16@ms",
      color: Colors.white,
      opacity: 0.9,
      // marginTop: '8@ms',
    },
    content: {
      flex: 1,
      // height:'70%',
      paddingHorizontal: "24@ms",
      paddingVertical: "20@ms",
      // marginTop: "10@ms",
      // backgroundColor:'red'
    },
    welcomeTitle: {
      fontSize: "24@ms",
      fontWeight: "bold",
      color: Colors.white,
      marginBottom: "12@ms",
    },
    welcomeText: {
      fontSize: "16@ms",
      color: Colors.textSecondary,
      marginBottom: "14@ms",
      lineHeight: "24@ms",
    },
    featuresContainer: {
      // marginTop: '4@ms',
    },
    featureItem: {
      flexDirection: "row",
      marginBottom: "12@ms",
      alignItems: "center",
    },
    featureIconContainer: {
      width: "48@ms",
      height: "48@ms",
      borderRadius: "24@ms",
      backgroundColor: Colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginRight: "16@ms",
    },
    featureTextContainer: {
      flex: 1,
    },
    featureTitle: {
      fontSize: "16@ms",
      fontWeight: "600",
      color: Colors.white,
      marginBottom: "4@ms",
    },
    featureDescription: {
      fontSize: "14@ms",
      color: Colors.textSecondary,
      lineHeight: "20@ms",
    },
    footer: {
      padding: "24@ms",
      paddingBottom: "26@ms",
    },
    signInButton: {
      // marginBottom: "16@ms",
    },
    registerButton: {
      alignItems: "center",
      padding: "8@ms",
    },
    registerText: {
      fontSize: "14@ms",
      color: Colors.textSecondary,
    },
    registerTextBold: {
      fontWeight: "600",
      color: Colors.primary,
    },
   
      overlayNew: 
      {backgroundColor:'rgba(0, 0, 0, 0.6)',position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 1,
    },
      slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: Colors.black,
  },
  image: {
    width: '100%',
    height: '70%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,

  },
  bottomContent: {
    // flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 20
  },
  title: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#444",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 25,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  });
