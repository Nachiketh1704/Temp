/**
 * DocumentUploaded Screen
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Upload, X, FileText, Check, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from "react-native-date-picker";
import { useDispatch } from 'react-redux';
import { deleteDocument } from '@app/module/common';

//Screens
import { Colors, ScaledSheet } from '@app/styles';
import { Document } from '@app/types';

interface DocumentUploaderProps {
  documentType: Document['type'];
  title: string;
  description?: string;
  onUpload: (document: Omit<Document, 'id' | 'verified'>, expiryDate?: string) => void;
  onDelete?: (documentId: number) => void;
  existingDocument?: Document;
  requiresExpiry?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentType,
  title,
  description,
  onUpload,
  onDelete,
  existingDocument,
  requiresExpiry = false,
}) => {
  const [document, setDocument] = useState<Document | null>(
    existingDocument || null,
  );
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<Date | null>(null);

  // Update local state when existingDocument changes
  useEffect(() => {
    if (existingDocument) {
      setDocument(existingDocument);
      // Set existing expiry date if available
      if (existingDocument.expiryDate) {
        setSelectedExpiryDate(new Date(existingDocument.expiryDate));
      }
    }
  }, [existingDocument]);

  // Use the current document state for display
  const currentDocument = document || existingDocument;

  const pickImage = async () => {
    // Check if expiry date is required but not set
    if (requiresExpiry && !selectedExpiryDate) {
      Alert.alert(
        'Expiry Date Required',
        'This document requires an expiry date. Please set the expiry date before uploading.',
        [
          { text: 'OK' },
          { 
            text: 'Set Date Now', 
            onPress: () => setShowDatePicker(true) 
          }
        ]
      );
      return;
    }

    setUploading(true);

    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.5,
      },
      async response => {
        if (response.didCancel || response.errorCode) {
          Alert.alert('Cancelled or Error', 'No image was selected.');
          setUploading(false);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const newDocument: Document = {
            id: `doc_${Date.now()}`,
            type: documentType,
            title: title,
            url: asset.uri!,
            verified: false,
            uploadedAt: new Date().toISOString(),
          };

          setDocument(newDocument);
          onUpload({
            type: documentType,
            title: title,
            url: asset.uri!,
            uploadedAt: new Date().toISOString(),
          }, selectedExpiryDate?.toISOString().split('T')[0]);
        }

        setUploading(false);
      },
    );
  };

  const takePhoto = async () => {
    // Check if expiry date is required but not set
    if (requiresExpiry && !selectedExpiryDate) {
      Alert.alert(
        'Expiry Date Required',
        'This document requires an expiry date. Please set the expiry date before uploading.',
        [
          { text: 'OK' },
          { 
            text: 'Set Date Now', 
            onPress: () => setShowDatePicker(true) 
          }
        ]
      );
      return;
    }

    setUploading(true);

    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.5,
      },
      async response => {
        if (response.didCancel || response.errorCode) {
          Alert.alert('Cancelled or Error', 'Camera was cancelled.');
          setUploading(false);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const newDocument: Document = {
            id: `doc_${Date.now()}`,
            type: documentType,
            title: title,
            url: asset.uri!,
            verified: false,
            uploadedAt: new Date().toISOString(),
          };

          setDocument(newDocument);
          onUpload({
            type: documentType,
            title: title,
            url: asset.uri!,
            uploadedAt: new Date().toISOString(),
          }, selectedExpiryDate?.toISOString().split('T')[0]);
        }

        setUploading(false);
      },
    );
  };

  const removeDocument = () => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (document?.documentId) {
              dispatch(deleteDocument(
                document.documentId,
                () => {
                  // On successful deletion
                  setDocument(null);
                  if (onDelete) {
                    onDelete(document.documentId);
                  }
                },
                (error) => {
                  // On deletion error, show error but don't remove from UI
                  console.error('Failed to delete document:', error);
                  Alert.alert(
                    'Delete Failed',
                    'Failed to delete document. Please try again.',
                    [{ text: 'OK' }]
                  );
                }
              ));
            } else {
              // If no documentId, just remove from local state
              setDocument(null);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{description}</Text>
      {description && <Text style={styles.description}>{description}</Text>}

      {/* Expiry date requirement notice */}
      {requiresExpiry && (
        <View style={styles.expiryNotice}>
          <Calendar size={18} color={Colors.warning} />
          <Text style={styles.expiryNoticeText}>
            This document requires an expiry date
          </Text>
        </View>
      )}

      {/* Show selected expiry date if available */}
      {selectedExpiryDate && (
        <View style={styles.expiryDateDisplay}>
          <Calendar size={18} color={Colors.success} />
          <Text style={styles.expiryDateText}>
            Expires: {selectedExpiryDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.changeDateButton}
          >
            <Text style={styles.changeDateText}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Set expiry date button for documents that require it */}
      {requiresExpiry && !selectedExpiryDate && (
        <TouchableOpacity
          style={[styles.setExpiryButton, styles.setExpiryButtonWarning]}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={18} color={Colors.warning} />
          <Text style={[styles.setExpiryText, styles.setExpiryTextWarning]}>
            ⚠️ Set Expiry Date (Required)
          </Text>
        </TouchableOpacity>
      )}

      {document ? (
        <View style={styles.documentContainer}>
          {document?.fileUrl?.startsWith('http') ||
          document?.fileUrl?.startsWith('file') ||
          document?.url?.startsWith('http') ||
          document?.url?.startsWith('file') ? (
            <Image
              source={{ uri: document.fileUrl || document.url }}
              style={styles.documentImage}
            />
          ) : (
            <View style={styles.documentIcon}>
              <FileText size={40} color={Colors.gray500} />
            </View>
          )}

          <View style={styles.documentInfo}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentTitle} numberOfLines={1}>
                {document.title || document.description || title}
              </Text>
              <TouchableOpacity
                onPress={removeDocument}
                style={styles.removeButton}
              >
                <X size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>

           

            <View
              style={[
                styles.verificationBadge,
                document.status === 'verified' ? styles.verifiedBadge : 
                document.status === 'expired' ? styles.expiredBadge :
                document.status === 'rejected' ? styles.rejectedBadge :
                styles.pendingBadge,
              ]}
            >
              {document.status === 'verified' ? (
                <>
                  <Check size={12} color={Colors.white} />
                  <Text style={styles.verificationText}>Verified</Text>
                </>
              ) : (
                <Text style={styles.verificationText}>
                  {document?.status || 'Pending'}
                </Text>
              )}
            </View>

            {/* Change Document Button */}
            <TouchableOpacity
              style={styles.changeDocumentButton}
              onPress={() => {
                // Check if expiry date is required but not set
                if (requiresExpiry && !selectedExpiryDate) {
                  Alert.alert(
                    'Expiry Date Required',
                    'This document requires an expiry date. Please set the expiry date before uploading.',
                    [
                      { text: 'OK' },
                      { 
                        text: 'Set Date Now', 
                        onPress: () => setShowDatePicker(true) 
                      }
                    ]
                  );
                  return;
                }
                pickImage();
              }}
              disabled={uploading}
            >
              <Upload size={16} color={Colors.text} />
              <Text style={styles.changeDocumentText}>
                {uploading ? 'Uploading...' : 'Change Document'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Upload size={20} color={Colors.text} />
            <Text style={styles.uploadText}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Text>
          </TouchableOpacity>

          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={takePhoto}
              disabled={uploading}
            >
              <Text style={styles.cameraText}>
                {uploading ? 'Uploading...' : 'Take Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Inline Date Picker */}
      {showDatePicker && (
               <DatePicker
               modal
               open={showDatePicker}
               date={selectedExpiryDate || new Date()}
               mode="date"
               onConfirm={(date) => {
                if (date) {
                        setSelectedExpiryDate(date);
                        setShowDatePicker(false);
                        
                        // If we have an existing document, call onUpload to update the expiry date
                        if (currentDocument) {
                          onUpload({
                            type: documentType,
                            title: title,
                            url: currentDocument.url || currentDocument.fileUrl || '',
                            uploadedAt: currentDocument.uploadedAt,
                          }, date.toISOString().split('T')[0]);
                        }
                      }
               }}
               onCancel={() => {
                 setShowDatePicker(false);
               }}
             />
        // <DateTimePicker
        // value={selectedExpiryDate || new Date()}
        // mode="date"
        //   display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        //   // onChange={onChange}
        //   onChange={(event, date) => {
        //     if (date) {
        //       setSelectedExpiryDate(date);
        //     }
        //   }}
        //   minimumDate={new Date()}
        // />
      )}

      {/* {showDatePicker && (
        <View style={styles.datePickerWrapper}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Expiry Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={styles.closeButton}
            >
              <X size={20} color={Colors.gray500} />
            </TouchableOpacity>
          </View>
          
          <DateTimePicker
            value={selectedExpiryDate || new Date()}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              if (date) {
                setSelectedExpiryDate(date);
              }
            }}
            minimumDate={new Date()}
            style={styles.datePicker}
          />
          
          <View style={styles.datePickerButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                if (selectedExpiryDate) {
                  setShowDatePicker(false);
                  // Call onUpload with the selected expiry date
                  if (currentDocument) {
                    onUpload({
                      type: documentType,
                      title: title,
                      url: currentDocument.url,
                      uploadedAt: currentDocument.uploadedAt,
                    }, selectedExpiryDate.toISOString().split('T')[0]);
                  }
                }
              }}
              disabled={!selectedExpiryDate}
            >
              <Text style={styles.confirmButtonText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      )} */}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    padding: '16@ms',
    borderRadius: '8@ms',
  },
  title: {
    fontSize: '16@ms',
    fontWeight: '600',
    color: Colors.text,
    marginBottom: '4@ms',
  },
  description: {
    fontSize: '14@ms',
    color: Colors.gray600,
    marginBottom: '12@ms',
  },
  uploadContainer: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
    borderRadius: '8@ms',
    padding: '16@ms',
    alignItems: 'center',
    // backgroundColor: Colors.gray50,
    backgroundColor: Colors.backgroundCard,

  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: '10@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: '8@ms',
  },
  uploadText: {
    color: Colors.text,
    fontWeight: '500',
    marginLeft: '8@ms',
  },
  cameraButton: {
    paddingVertical: '8@ms',
  },
  cameraText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  documentContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 8,
    padding: '12@ms',
    backgroundColor: Colors.backgroundCard,
  },
  documentImage: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '8@ms',
    marginRight: '12@ms',
  },
  documentIcon: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '8@ms',
    marginRight: '12@ms',
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: '15@ms',
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  removeButton: {
    padding: '4@ms',
  },
  documentDate: {
    fontSize: '13@ms',
    color: Colors.gray500,
    marginBottom: '8@ms',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8@ms',
    paddingVertical: '4@ms',
    borderRadius: '4@ms',
    alignSelf: 'flex-start',
  },
  verifiedBadge: {
    backgroundColor: Colors.success,
  },
  pendingBadge: {
    backgroundColor: Colors.warning,
  },
  expiredBadge: {
    backgroundColor: Colors.error,
  },
  rejectedBadge: {
    backgroundColor: Colors.error,
  },
  verificationText: {
    fontSize: '12@ms',
    fontWeight: '500',
    color: Colors.white,
    marginLeft: '4@ms',
  },
  expiryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingVertical: '8@ms',
    paddingHorizontal: '12@ms',
    borderRadius: '6@ms',
    marginBottom: '12@ms',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  expiryNoticeText: {
    fontSize: '13@ms',
    color: Colors.warning,
    marginLeft: '8@ms',
  },
  expiryDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: '8@ms',
    paddingHorizontal: '12@ms',
    borderRadius: '6@ms',
    marginBottom: '12@ms',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  expiryDateText: {
    fontSize: '14@ms',
    color: Colors.success,
    marginLeft: '8@ms',
    marginRight: '8@ms',
  },
  changeDateButton: {
    paddingVertical: '4@ms',
    paddingHorizontal: '8@ms',
    borderRadius: '4@ms',
    backgroundColor: Colors.primaryLight,
  },
  changeDateText: {
    fontSize: '13@ms',
    color: Colors.white,
    fontWeight: '500',
  },
  setExpiryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: '10@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginVertical: '12@ms',
  },
  setExpiryText: {
    color: Colors.white,
    fontWeight: '500',
    marginLeft: '8@ms',
  },
  setExpiryButtonWarning: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  setExpiryTextWarning: {
    color: Colors.warning,
  },
  changeDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: '10@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: '12@ms',
  },
  changeDocumentText: {
    color: Colors.white,
    fontWeight: '500',
    marginLeft: '8@ms',
  },
  datePickerWrapper: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: '16@ms',
    marginTop: '12@ms',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12@ms',
  },
  datePickerTitle: {
    fontSize: '16@ms',
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: '4@ms',
  },
  datePicker: {
    width: '100%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: '12@ms',
    marginBottom: '12@ms',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: '12@ms',
  },
  cancelButton: {
    paddingVertical: '8@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray100,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: '8@ms',
    paddingHorizontal: '16@ms',
    borderRadius: '6@ms',
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  confirmButtonText: {
    color: Colors.white,
    fontWeight: '500',
  },
});
