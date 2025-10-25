/**
 * Trip Tracking Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    mainContent: {
      flex: 1,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
    },
    permissionIcon: {
      marginBottom: '16@ms',
    },
    permissionTitle: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '8@ms',
      textAlign: 'center',
    },
    permissionText: {
      fontSize: '16@ms',
      color: Colors.gray600,
      textAlign: 'center',
      marginBottom: '24@ms',
    },
    permissionButton: {
      width: '200@ms',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
    },
    emptyIcon: {
      marginBottom: '16@ms',
    },
    emptyTitle: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '8@ms',
    },
    emptyText: {
      fontSize: '16@ms',
      color: Colors.gray600,
      textAlign: 'center',
    },
    mockDataIndicator: {
      backgroundColor: Colors.warning,
      padding: '8@ms',
      alignItems: 'center',
    },
    mockDataText: {
      fontSize: '12@ms',
      color: Colors.white,
      fontWeight: '600',
    },
    // Map View Styles
    mapViewContainer: {
      flex: 1,
      position: 'relative',
    },
    map: {
      flex: 1,
      width: '100%',
      height: '100%',
      minHeight: '300@ms',
    },
    backButtonContainer: {
      position: 'absolute',
      top: '16@ms',
      left: '16@ms',
      zIndex: 1000,
    },
    backButton: {
      backgroundColor: Colors.primary,
      width: '44@ms',
      height: '44@ms',
      borderRadius: '22@ms',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    mapControls: {
      position: 'absolute',
      right: '16@ms',
      top: '16@ms',
      flexDirection: 'column',
      gap: '8@ms',
    },
    mapControlButton: {
      backgroundColor: Colors.primary,
      width: '44@ms',
      height: '44@ms',
      borderRadius: '22@ms',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    tripStatusOverlay: {
      position: 'absolute',
      top: '16@ms',
      left: '16@ms',
      backgroundColor: Colors.white,
      borderRadius: '12@ms',
      padding: '16@ms',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minWidth: '150@ms',
    },
    tripStatusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '8@ms',
    },
    tripStatusTitle: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.text,
      marginLeft: '8@ms',
    },
    tripStatusText: {
      fontSize: '14@ms',
      color: Colors.gray600,
      marginBottom: '4@ms',
    },
    tripTimeText: {
      fontSize: '18@ms',
      fontWeight: 'bold',
      color: Colors.primary,
    },
    routeInfoOverlay: {
      position: 'absolute',
      top: '16@ms',
      right: '16@ms',
      backgroundColor: Colors.white,
      borderRadius: '12@ms',
      padding: '16@ms',
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minWidth: '150@ms',
    },
    routeInfoTitle: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '12@ms',
    },
    routeInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '8@ms',
    },
    routeInfoDot: {
      width: '12@ms',
      height: '12@ms',
      borderRadius: '6@ms',
      marginRight: '8@ms',
    },
    routeInfoText: {
      fontSize: '12@ms',
      color: Colors.gray600,
    },
    // Trip Controls
    tripControlsContainer: {
      backgroundColor: Colors.backgroundCard,
      padding: '16@ms',
      borderTopWidth: 1,
      borderTopColor: Colors.gray200,
    },
    tripControlsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16@ms',
    },
    tripControlsTitle: {
      fontSize: '18@ms',
      fontWeight: 'bold',
      color: Colors.text,
    },
    tripControlsButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: '12@ms',
    },
    startButton: {
      flex: 1,
      backgroundColor: Colors.success,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: '16@ms',
      paddingHorizontal: '24@ms',
      borderRadius: '12@ms',
    },
    startButtonText: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: '600',
      marginLeft: '8@ms',
    },
    controlButton: {
      flex: 1,
      backgroundColor: Colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: '12@ms',
      paddingHorizontal: '16@ms',
      borderRadius: '8@ms',
    },
    pauseButton: {
      backgroundColor: Colors.warning,
    },
    resumeButton: {
      backgroundColor: Colors.success,
    },
    stopButton: {
      backgroundColor: Colors.error,
    },
    controlButtonText: {
      color: Colors.white,
      fontSize: '14@ms',
      fontWeight: '600',
      marginLeft: '8@ms',
    },
    // Distance Info
    distanceInfoContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.backgroundCard,
      padding: '16@ms',
      borderTopWidth: 1,
      borderTopColor: Colors.gray200,
    },
    distanceInfoItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: '8@ms',
    },
    distanceInfoContent: {
      marginLeft: '12@ms',
      flex: 1,
    },
    distanceInfoLabel: {
      fontSize: '12@ms',
      color: Colors.gray500,
      marginBottom: '4@ms',
      fontWeight: '500',
    },
    distanceInfoValue: {
      fontSize: '16@ms',
      color: Colors.text,
      fontWeight: 'bold',
      marginBottom: '2@ms',
    },
    distanceInfoEta: {
      fontSize: '12@ms',
      color: Colors.gray600,
    },
    // Milestones
    milestonesContainer: {
      backgroundColor: Colors.backgroundCard,
      padding: '16@ms',
      borderTopWidth: 1,
      borderTopColor: Colors.gray200,
      maxHeight: '200@ms',
    },
    milestonesTitle: {
      fontSize: '16@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '12@ms',
    },
    milestonesScrollView: {
      flex: 1,
    },
    milestoneItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '12@ms',
    },
    milestoneIcon: {
      width: '32@ms',
      height: '32@ms',
      borderRadius: '16@ms',
      backgroundColor: Colors.gray300,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12@ms',
    },
    milestoneIconActive: {
      backgroundColor: Colors.primary,
    },
    milestoneIconCompleted: {
      backgroundColor: Colors.success,
    },
    milestoneNumber: {
      fontSize: '14@ms',
      fontWeight: 'bold',
      color: Colors.gray600,
    },
    milestoneContent: {
      flex: 1,
    },
    milestoneTitle: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '2@ms',
    },
    milestoneTitleActive: {
      color: Colors.primary,
    },
    milestoneTitleCompleted: {
      color: Colors.success,
    },
    milestoneDescription: {
      fontSize: '12@ms',
      color: Colors.gray500,
    },
    locationUpdateIndicator: {
      position: 'absolute',
      top: '20@ms',
      left: '50%',
      transform: [{ translateX: '-50%' }],
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderRadius: '16@ms',
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1000,
    },
    locationUpdateText: {
      color: Colors.white,
      fontSize: '12@ms',
      fontWeight: '500',
      marginLeft: '6@ms',
    },
    trackingStatusIndicator: {
      position: 'absolute',
      top: '60@ms',
      left: '50%',
      transform: [{ translateX: '-50%' }],
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      paddingHorizontal: '16@ms',
      paddingVertical: '8@ms',
      borderRadius: '20@ms',
      zIndex: 1000,
    },
    trackingStatusText: {
      color: Colors.white,
      fontSize: '14@ms',
      fontWeight: '600',
      textAlign: 'center',
    },
    customMarkerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#121212', // Temporary red background to see if container is visible
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
    },
    truckMarker: {
      width: '100@ms',
      height: '40@ms',
    },
  });
