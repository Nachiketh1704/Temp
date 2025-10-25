/**
 * Document Screen
 * @format
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectDocumentTypes,
  fetchDocumentTypes,
  selectProfile,
  uploadDocument,
  uploadFile,
} from "@app/module/common";
import { DocumentUploader } from "@app/components/DocumentUploader";
import { Document, DocumentType } from "@app/types";
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./documentStyle";
import { ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "@app/store/authStore";
import Header from "@app/components/Header";

function DocumentsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { updateProfile } = useAuthStore();
  const dispatch = useDispatch();
  const documentTypes = useSelector(selectDocumentTypes);
  const userProfile = useSelector(selectProfile) as any; // Type assertion for now

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);

  // Load documents from document types response when it changes
  // The /document/required endpoint returns existing user documents
  useEffect(() => {
    if (documentTypes && documentTypes.length > 0) {
      console.log(
        "Loading documents from document types response:",
        documentTypes
      );

      // Filter out documents that are just types (no fileUrl) vs actual uploaded documents
      const existingDocuments = documentTypes.filter(
        (doc: any) => doc.fileUrl && doc.isUploaded
      );
      const documentTypeDefinitions = documentTypes.filter(
        (doc: any) => !doc.fileUrl
      );

      console.log("Existing documents:", existingDocuments);
      console.log("Document type definitions:", documentTypeDefinitions);

      setDocuments(existingDocuments);
    }
  }, [documentTypes]);

  // Fetch document types on component mount
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingDocumentTypes(true);
      try {
        dispatch(fetchDocumentTypes());
      } catch (error) {
        console.error("Error fetching document types:", error);
      } finally {
        setLoadingDocumentTypes(false);
      }
    };

    fetchTypes();
  }, [dispatch]);

  const handleUploadDocument = (
    newDocument: Omit<Document, "id" | "verified">,
    documentTypeId: number,
    expiryDate?: string
  ) => {
    // Check file size before upload (limit to 5MB to avoid 413 errors)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    // For local files, we can't get size directly, but we can warn
    if (newDocument.url.startsWith("file://")) {
      console.log("Local file selected, proceeding with upload...");
    }

    // Detect file type from URL
    const getFileType = (url: string) => {
      if (url.includes(".jpg") || url.includes(".jpeg")) return "image/jpeg";
      if (url.includes(".png")) return "image/png";
      if (url.includes(".pdf")) return "application/pdf";
      return "image/jpeg"; // default
    };

    const getFileName = (url: string) => {
      const fileName = url.split("/").pop() || `document_${Date.now()}`;
      return fileName.includes(".") ? fileName : `${fileName}.jpg`;
    };

    // First, upload the file to get a URL
    const fileData = {
      uri: newDocument.url,
      type: getFileType(newDocument.url),
      name: getFileName(newDocument.url),
    };

    // Call the file upload API first
    dispatch(
      uploadFile(
        fileData,
        (uploadResponse) => {
          // File uploaded successfully, now call document upload API
          console.log("File uploaded successfully:", uploadResponse);
          dispatch(fetchDocumentTypes());

          const fileUrl = uploadResponse?.data?.url || uploadResponse?.url;

          if (!fileUrl) {
            Alert.alert(
              "Error",
              "File uploaded but no URL received. Please try again."
            );
            return;
          }

          // Now prepare the document data with the file URL
          const documentData = {
            documentTypeId: documentTypeId,
            fileUrl: fileUrl,
            expiryDate: expiryDate || null,
          };

          // Call the document upload API
          dispatch(
            uploadDocument(
              documentData,
              (response) => {
                // On successful document upload
                console.log("Document uploaded successfully:", response);

                // Create the new document with API response data
                const uploadedDocument: Document = {
                  id: response?.data?.id?.toString() || `doc_${Date.now()}`,
                  type: newDocument.type,
                  title: newDocument.title,
                  url: fileUrl, // Use the uploaded file URL
                  verified: false,
                  uploadedAt: new Date().toISOString(),
                  // Add new API fields
                  documentId: response?.data?.id,
                  name: newDocument.type,
                  description: newDocument.title,
                  expiryDate: expiryDate,
                  fileUrl: fileUrl,
                  isUploaded: true,
                  requiresExpiry: !!expiryDate,
                };

                // Update local state with the uploaded document
                const updatedDocuments = [...documents, uploadedDocument];
                setDocuments(updatedDocuments);

                // Update the user profile
                if (userProfile) {
                  updateProfile({
                    ...userProfile,
                    documents: updatedDocuments,
                  } as any);
                }

                Alert.alert(
                  t("documents.uploadSuccessTitle") || "Success",
                  t("documents.uploadSuccessMessage") ||
                    "Document uploaded successfully!"
                );
              },
              (error) => {
                // On document upload failure
                console.error("Document upload failed:", error);
                Alert.alert(
                  t("errors.general") || "Error",
                  t("documents.uploadErrorMessage") ||
                    "Failed to upload document. Please try again."
                );
              }
            )
          );
        },
        (uploadError) => {
          // On file upload failure
          console.error("File upload failed:", uploadError);

          // Check if it's a 413 error (file too large)
          if (uploadError?.status === 413) {
            Alert.alert(
              "File Too Large",
              "The selected file is too large. Please choose a smaller image or compress it before uploading.",
              [
                { text: "OK" },
                {
                  text: "Help",
                  onPress: () => {
                    Alert.alert(
                      "File Size Tips",
                      "• Use images smaller than 5MB\n• Compress images before uploading\n• Avoid high-resolution photos\n• Consider using PDF for documents"
                    );
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              t("errors.general") || "Error",
              "Failed to upload file. Please try again."
            );
          }
        }
      )
    );
  };

  // Render all document types without filtering
  const renderAllDocuments = () => {
    if (loadingDocumentTypes) {
      return (
        <View style={styles.noDocumentsContainer}>
          <Text style={styles.noDocumentsText}>Loading document types...</Text>
        </View>
      );
    }

    if (!documentTypes || documentTypes.length === 0) {
      return (
        <View style={styles.noDocumentsContainer}>
          <Text style={styles.noDocumentsText}>
            {t("documents.noDocumentTypes") || "No document types available."}
          </Text>
        </View>
      );
    }

    console.log("Rendering documents. Current documents state:", documents);
    console.log("Document types response:", documentTypes);

    return (
      <View style={styles.documentsContainer}>
        {documentTypes.map((docType: any) => {
          // Find existing document for this type
          const existingDocument = documents.find(
            (doc) => doc.name === docType.name
          );

          console.log(`Looking for document type: ${docType.name}`);
          console.log(`Found existing document:`, existingDocument);

          // Check if document is pending (uploaded but not verified)
          const isPending =
            existingDocument?.status === "pending" &&
            existingDocument?.isUploaded;
          const isVerified = existingDocument?.verified === true;
          const isRejected = existingDocument?.status === "rejected";

          // Allow re-upload if:
          // 1. No document exists, OR
          // 2. Document exists but is NOT approved/verified
          const canUpload = !existingDocument || !existingDocument?.verified;

          return (
            <View key={docType.id} style={styles.documentItem}>
              <DocumentUploader
                documentType={docType.name}
                title={docType.displayName}
                description={docType.description}
                requiresExpiry={docType.requiresExpiry}
                onUpload={(document, expiryDate) => {
                  handleUploadDocument(document, docType.id, expiryDate);
                }}
                onDelete={(documentId) => {
                  // Remove the deleted document from local state
                  setDocuments((prev) =>
                    prev.filter((doc) => doc.documentId !== documentId)
                  );
                  // Update user profile
                  if (userProfile) {
                    updateProfile({
                      ...userProfile,
                      documents: documents.filter(
                        (doc) => doc.documentId !== documentId
                      ),
                    } as any);
                  }
                }}
                existingDocument={existingDocument}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t("profile.documents.title")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{t("documents.subtitle")}</Text>

        {renderAllDocuments()}
      </ScrollView>
    </View>
  );
}

export { DocumentsScreen };
