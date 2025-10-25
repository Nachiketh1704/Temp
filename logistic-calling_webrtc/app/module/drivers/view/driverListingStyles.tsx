/**
 * Driver Listing Styles
 * @format
 */

import { ScaledSheet } from 'react-native-size-matters';
import { Colors } from '@app/styles';

export const getStyles = () =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.background,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: Colors.text,
      paddingVertical: 4,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    driverCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    driverInfoSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    profileIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    driverDetails: {
      flex: 1,
    },
    driverName: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors.text,
      marginBottom: 4,
    },
    ratingSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    ratingText: {
      fontSize: 14,
      color: Colors.text,
      marginLeft: 4,
      fontWeight: '500',
    },
    separator: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.gray400,
      marginHorizontal: 8,
    },
    jobsText: {
      fontSize: 14,
      color: Colors.text,
    },
    vehicleType: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 2,
    },
    location: {
      fontSize: 12,
      color: Colors.gray400,
    },
    actionButtonSection: {
      alignItems: 'center',
    },
    assignButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.success,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 24,
      minWidth: 250,
    },
    disabledButton: {
      backgroundColor: Colors.gray300,
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '500',
      color: Colors.white,
      marginLeft: 6,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 32,
    },
  });
