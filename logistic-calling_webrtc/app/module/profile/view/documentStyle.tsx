import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = () =>
    ScaledSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors.background,
          },
          scrollView: {
            flex: 1,
          },
          scrollContent: {
            padding: 20,
            paddingBottom: '100@ms',
          },
          title: {
            fontSize: '18@ms',
            fontWeight: '600',
            color: Colors.text,
          },
          subtitle: {
            fontSize: 16,
            color: Colors.gray600,
            marginBottom: 24,
            lineHeight: 22,
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
          documentsContainer: {
            // backgroundColor: Colors.backgroundCard,
            

          },
          documentItem: {
            marginBottom: '16@ms',
            position: 'relative',
          },
          pendingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '8@ms',
            zIndex: 1,
          },
          pendingText: {
            color: Colors.white,
            fontSize: '14@ms',
            fontWeight: '600',
            backgroundColor: Colors.warning,
            paddingHorizontal: '12@ms',
            paddingVertical: '6@ms',
            borderRadius: '16@ms',
          },
          statusOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '8@ms',
            zIndex: 1,
          },
          verifiedOverlay: {
            backgroundColor: 'rgba(76, 175, 80, 0.3)', // Green with transparency
          },
          rejectedOverlay: {
            backgroundColor: 'rgba(255, 77, 77, 0.3)', // Red with transparency
          },
          statusText: {
            fontSize: '14@ms',
            fontWeight: '600',
            paddingHorizontal: '12@ms',
            paddingVertical: '6@ms',
            borderRadius: '16@ms',
          },
          verifiedText: {
            color: Colors.white,
            backgroundColor: Colors.success,
          },
          rejectedText: {
            color: Colors.white,
            backgroundColor: Colors.error,
          },
          reuploadHint: {
            color: Colors.white,
            fontSize: '12@ms',
            marginTop: '4@ms',
            opacity: 0.8,
          },
          noDocumentsContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: '40@ms',
          },
          noDocumentsText: {
            fontSize: '16@ms',
            color: Colors.gray600,
            textAlign: 'center',
          },
});