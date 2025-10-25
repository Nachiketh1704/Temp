/**
 * Profile Screen
 * @format
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  User,
  Settings,
  FileText,
  Star,
  Truck,
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  LogOut,
  CreditCard,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Wallet,
  BanknoteIcon,
  CreditCardIcon,
  Plus,
  Check,
  Trash2,
  Edit,
  Bell,
  Activity,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { logoutApp, selectCompany, selectProfile, selectDocumentTypes, fetchDocumentTypes } from "@app/module/common";
import { disconnectSocket } from "@app/service";
import { fetchProfile } from "../index";
import { useTranslation } from "react-i18next";

//Screens
import { Colors } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { usePaymentStore } from "@app/store/paymentStore";
import { Button } from "@app/components/Button";
import { DriverProfile, MerchantProfile, CarrierProfile } from "@app/types";
import { formatCurrency } from "@app/utils/formatters";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { Routes } from "../../../navigator";
import { profile } from "../slice";

function ProfileScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const {  logout } = useAuthStore();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userProfile = useSelector(selectProfile);
  const userRole = userProfile?.roles?.[0]?.role?.name || null;
  console.log({ userProfile, userRole }, "userprofile");
  const companyProfile = useSelector(selectCompany);
  const documentTypes = useSelector(selectDocumentTypes);
  const [error, setError] = useState(false);

  // Safety check - if no user profile, show loading or redirect
  if (!userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.white }}>Loading profile...</Text>
      </View>
    );
  }

  const {
    balance,
    pendingBalance,
    paymentMethods,
    transactions,
    setDefaultPaymentMethod,
    removePaymentMethod,
  } = usePaymentStore();

  const [activeTab, setActiveTab] = useState<
    "profile" | "transactions" | "payment"
  >("profile");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Fetch document types when component mounts

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        dispatch(fetchProfile({}));
        dispatch(fetchDocumentTypes());

      }, 500);
  
      // Cleanup to clear timeout if screen is unfocused
      return () => clearTimeout(timer);
    }, [dispatch])
  );

  // Function to render uploaded documents
  const renderUploadedDocuments = () => {
    console.log("renderUploadedDocuments called with documentTypes:", documentTypes);
    
    if (!documentTypes || documentTypes.length === 0) {
      console.log("No document types available");
      return (
        <View style={styles.documentItem}>
          <View style={styles.documentIcon}>
            <FileText size={20} color={Colors.white} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>No documents uploaded</Text>
            <Text style={styles.documentSubtitle}>Upload your documents to get started</Text>
          </View>
          <ChevronRight size={20} color={Colors.gray400} />
        </View>
      );
    }

    // Filter documents that are actually uploaded
    const uploadedDocuments = documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded);
    console.log("Filtered uploaded documents:", uploadedDocuments);
    
    if (uploadedDocuments.length === 0) {
      console.log("No uploaded documents found");
      return (
        <View style={styles.documentItem}>
          <View style={styles.documentIcon}>
            <FileText size={20} color={Colors.white} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>No documents uploaded</Text>
            <Text style={styles.documentSubtitle}>Upload your documents to get started</Text>
          </View>
          <ChevronRight size={20} color={Colors.gray400} />
        </View>
      );
    }

    // Show first 3 uploaded documents
    console.log("Rendering", uploadedDocuments.length, "uploaded documents");
    return uploadedDocuments.slice(0, 3).map((doc: any, index: number) => (
      <View key={doc.id || index} style={styles.documentItem}>
        <View style={styles.documentIcon}>
          <FileText size={20} color={Colors.white} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>
            {doc.displayName || doc.description || doc.name}
          </Text>
         {doc.expiryDate && <Text style={styles.documentSubtitle}>
            {doc.expiryDate ? `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}` : 'No expiry date'}
          </Text>}
          <View style={styles.documentStatus}>
            <Text style={[
              styles.statusText,
              doc.status === 'verified' ? styles.statusVerified : 
              doc.status === 'rejected' ? styles.statusRejected : 
              doc.status === 'expired' ? styles.statusExpired :
              styles.statusPending
            ]}>
              {doc.status || 'Pending'}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={Colors.gray400} />
      </View>
    ));
  };

  const handleLogout = () => {
    try {
      // Disconnect socket
      disconnectSocket();
      // Clear Zustand store
      logout();
      // Clear Redux store
      dispatch(logoutApp());
      // Navigate to login screen
      navigation.navigate(Routes.LoginScreen as never);
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: just clear stores and navigate
      disconnectSocket();
      logout();
      dispatch(logoutApp());
      navigation.navigate(Routes.LoginScreen as never);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const NotificationService = await import('@app/service/notification-service');
      const granted = await NotificationService.default.requestPermission();
      if (granted) {
        // Show success message
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleSetDefault = (methodId: string) => {
    setDefaultPaymentMethod(methodId);
  };

  const handleRemoveMethod = (methodId: string) => {
    removePaymentMethod(methodId);
  };

  const renderTransactionIcon = (type: string, status: string) => {
    if (status === "failed") {
      return <AlertCircle size={20} color={Colors.error} />;
    }

    if (type === "payment") {
      return userRole === "driver" ? (
        <ArrowDownLeft size={20} color={Colors.success} />
      ) : (
        <ArrowUpRight size={20} color={Colors.error} />
      );
    } else if (type === "withdrawal") {
      return <ArrowUpRight size={20} color={Colors.error} />;
    } else if (type === "deposit") {
      return <ArrowDownLeft size={20} color={Colors.success} />;
    } else if (type === "refund") {
      return userRole === "driver" ? (
        <ArrowUpRight size={20} color={Colors.error} />
      ) : (
        <ArrowDownLeft size={20} color={Colors.success} />
      );
    }

    return <DollarSign size={20} color={Colors.primary} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return Colors.success;
      case "pending":
        return Colors.warning;
      case "processing":
        return Colors.info;
      case "failed":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "failed":
        return "Failed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderTransactionItem = (transaction: any) => {
    const isIncoming =
      (userRole === "driver" && transaction.type === "payment") ||
      (userRole === "merchant" && transaction.type === "refund") ||
      transaction.type === "deposit";

    const isOutgoing =
      (userRole === "merchant" && transaction.type === "payment") ||
      (userRole === "driver" && transaction.type === "refund") ||
      transaction.type === "withdrawal";

    return (
      <TouchableOpacity
        key={transaction.id}
        style={styles.transactionItem}
        onPress={() =>
          navigation.navigate(Routes.TransactionDetailScreen, {
            transactionId: transaction.id,
          })
        }
      >
        <View
          style={[
            styles.transactionIconContainer,
            {
              backgroundColor:
                transaction.status === "failed"
                  ? Colors.error + "20"
                  : Colors.primary + "20",
            },
          ]}
        >
          {renderTransactionIcon(transaction.type, transaction.status)}
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{transaction.description}</Text>
          <Text style={styles.transactionDate}>{transaction.date}</Text>
        </View>

        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.transactionAmountText,
              isIncoming
                ? styles.amountPositive
                : isOutgoing
                ? styles.amountNegative
                : {},
            ]}
          >
            {isIncoming ? "+" : isOutgoing ? "-" : ""}
            {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(transaction.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(transaction.status) },
              ]}
            >
              {getStatusText(transaction.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentMethodItem = (method: any) => {
    const isSelected = selectedMethod === method.id;
    const cardTypeIcon = () => {
      switch (method.type) {
        case "visa":
          return <CreditCardIcon size={24} color={Colors.primary as string} />;
        case "mastercard":
          return <CreditCardIcon size={24} color={Colors.primary} />;
        case "bank":
          return <BanknoteIcon size={24} color={Colors.primary} />;
        default:
          return <CreditCard size={24} color={Colors.primary} />;
      }
    };

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodItem,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => setSelectedMethod(isSelected ? null : method.id)}
      >
        <View style={styles.paymentMethodIconContainer}>{cardTypeIcon()}</View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {method.type === "bank"
              ? "Bank Account"
              : `${method.brand} ****${method.last4}`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {method.type === "bank"
              ? `${method.bankName} - ${method.accountType}`
              : `Expires ${method.expMonth}/${method.expYear}`}
          </Text>
        </View>

        {method.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}

        {isSelected ? (
          <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(method.id)}
              disabled={method.isDefault}
            >
              <Check
                size={20}
                color={method.isDefault ? Colors.textSecondary : Colors.success}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRemoveMethod(method.id)}
              disabled={method.isDefault}
            >
              <Trash2
                size={20}
                color={method.isDefault ? Colors.textSecondary : Colors.error}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <ChevronRight size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderDriverProfile = (profile: DriverProfile) => (
    <>
      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>
            {" "}
            {t("profile.balance.available")}
          </Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, "USD")}
          </Text>
        </View>

        {pendingBalance > 0 && (
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>
              {" "}
              {t("profile.balance.pending")}
            </Text>
            <Text style={styles.pendingValue}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}

        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.WithdrawScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.withdraw")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Truck size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.truckType")}</Text>
            <Text style={styles.infoValue}>{profile?.trucks?.[0]?.truckType?.name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Star size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.rating")}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingValue}>
                {profile?.rating?.toFixed(1)}
              </Text>
              <Text style={styles.ratingIcon}>★</Text>
              <Text style={styles.ratingCount}>
                ({profile.completedJobs} jobs)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {t("profile.info.currentLocation")}
            </Text>
            <Text style={styles.infoValue}>
              {profile.currentLocation
                ? `Lat: ${profile?.currentLocation?.latitude?.toFixed(
                    6
                  )}, Lng: ${profile?.currentLocation?.longitude?.toFixed(6)}`
                : "Not available"}
            </Text>
          </View>
        </View>
      </View>

      {/* Documents Section */}
      <View style={styles.documentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("profile.documents.title")}</Text>
          <TouchableOpacity
            style={styles.manageDocsButton}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Edit size={16} color={Colors.white} />
            <Text style={styles.manageDocsText}>Manage Docs</Text>
          </TouchableOpacity>
        </View>

        {/* Render actual uploaded documents */}
        {renderUploadedDocuments()}

        {/* Show more documents indicator if there are more than 3 */}
        {documentTypes && documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length > 3 && (
          <TouchableOpacity
            style={styles.seeMoreDocuments}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Text style={styles.seeMoreText}>
              View all {documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length} documents
            </Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderMerchantProfile = (profile: MerchantProfile) => (
    <>
      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>
            {" "}
            {t("profile.balance.available")}
          </Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, "USD")}
          </Text>
        </View>

        {pendingBalance > 0 && (
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>
              {" "}
              {t("profile.balance.pending")}
            </Text>
            <Text style={styles.pendingValue}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}

        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.DepositScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.addFunds")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Building2 size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.company")}</Text>
            <Text style={styles.infoValue}>
              {(() => {
                const company = profile.company as any;
                return typeof company === 'string' 
                  ? company 
                  : company?.companyName || 'N/A';
              })()}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Star size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.rating")}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingValue}>
                {profile?.rating?.toFixed(1)}
              </Text>
              <Text style={styles.ratingIcon}>★</Text>
              <Text style={styles.ratingCount}>
                ({profile.completedJobs} jobs)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.address")}</Text>
            <Text style={styles.infoValue}>{profile.address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.documentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("profile.documents.title")}</Text>
          <TouchableOpacity
            style={styles.manageDocsButton}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Edit size={16} color={Colors.white} />
            <Text style={styles.manageDocsText}>Manage Docs</Text>
          </TouchableOpacity>
        </View>

        {/* Render actual uploaded documents */}
        {renderUploadedDocuments()}

        {/* Show more documents indicator if there are more than 3 */}
        {documentTypes && documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length > 3 && (
          <TouchableOpacity
            style={styles.seeMoreDocuments}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Text style={styles.seeMoreText}>
              View all {documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length} documents
            </Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
  const renderCarrierProfile = (profile: DriverProfile & MerchantProfile) => (
    <>
      {/* Balance Section */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>
            {t("profile.balance.available")}
          </Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, "USD")}
          </Text>
        </View>

        {pendingBalance > 0 && (
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>
              {t("profile.balance.pending")}
            </Text>
            <Text style={styles.pendingValue}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}

        <View
          style={{ ...styles.balanceActions, justifyContent: "space-around" }}
        >
          {/* Carrier can both withdraw and add funds */}
          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.WithdrawScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.withdraw")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.DepositScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.addFunds")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        {/* Truck Type (Driver-specific) */}
        {/* <View style={styles.infoRow}>
          <Truck size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.truckType")}</Text>
            <Text style={styles.infoValue}>{profile.truckType}</Text>
          </View>
        </View> */}

        {/* Company (Merchant-specific) */}
        <View style={styles.infoRow}>
          <Building2 size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.company")}</Text>
            <Text style={styles.infoValue}>{profile.company?.companyName || profile.company || 'N/A'}</Text>
          </View>
        </View>

        {/* Rating (Shared) */}
        <View style={styles.infoRow}>
          <Star size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.rating")}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingValue}>
                {profile?.rating?.toFixed(1)}
              </Text>
              <Text style={styles.ratingIcon}>★</Text>
              <Text style={styles.ratingCount}>
                ({profile.completedJobs} jobs)
              </Text>
            </View>
          </View>
        </View>

        {/* Location (Driver) */}
        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {t("profile.info.currentLocation")}
            </Text>
            <Text style={styles.infoValue}>
              {profile.currentLocation
                ? `Lat: ${profile.currentLocation.latitude.toFixed(
                    6
                  )}, Lng: ${profile.currentLocation.longitude.toFixed(6)}`
                : "Not available"}
            </Text>
          </View>
        </View>

        {/* Address (Merchant) */}
        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.address")}</Text>
            <Text style={styles.infoValue}>{companyProfile?.address }, {companyProfile?.city}, {companyProfile?.state}, {companyProfile?.zipCode}  </Text>
          </View>
        </View>
      </View>

      {/* Documents Section */}
      <View style={styles.documentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("profile.documents.title")}</Text>
          <TouchableOpacity
            style={styles.manageDocsButton}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Edit size={16} color={Colors.white} />
            <Text style={styles.manageDocsText}>Manage Docs</Text>
          </TouchableOpacity>
        </View>

        {/* Render actual uploaded documents */}
        {renderUploadedDocuments()}

        {/* Show more documents indicator if there are more than 3 */}
        {documentTypes && documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length > 3 && (
          <TouchableOpacity
            style={styles.seeMoreDocuments}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Text style={styles.seeMoreText}>
              View all {documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length} documents
            </Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderTransactionsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceCardLabel}>
            {t("profile.balance.available")}
          </Text>
        </View>

        <Text style={styles.balanceCardAmount}>
          {formatCurrency(balance, "USD")}
        </Text>

        {pendingBalance > 0 && (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingLabel}>
              {t("profile.balance.available")}:{" "}
            </Text>
            <Text style={styles.pendingAmount}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t("profile.transactions.recent")}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate(Routes.PaymentHistoryScreen)}
        >
          <Text style={styles.seeAllText}>{t("common.seeAll")}l</Text>
        </TouchableOpacity>
      </View>

      {transactions.length > 0 ? (
        transactions
          .slice(0, 5)
          .map((transaction) => renderTransactionItem(transaction))
      ) : (
        <View style={styles.emptyState}>
          <DollarSign size={40} color={Colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>
            {t("profile.transactions.noTransactions")}
          </Text>
          <Text style={styles.emptyStateDescription}>
            {userRole === "driver"
              ? t("profile.transactions.noTransactionsDriver")
              : t("profile.transactions.noTransactionsMerchant")}
          </Text>
        </View>
      )}
    </View>
  );

  const renderPaymentMethodsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t("profile.paymentMethods.title")}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate(Routes.AddPaymentMethodScreen)}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addButtonText}>
            {t("profile.paymentMethods.addNew")}
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMethods.length > 0 ? (
        paymentMethods.map((method) => renderPaymentMethodItem(method))
      ) : (
        <View style={styles.emptyState}>
          <CreditCard size={40} color={Colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>
            {t("profile.paymentMethods.noMethods")}
          </Text>
          <Text style={styles.emptyStateDescription}>
            Add a payment method to{" "}
            {userRole === "driver" ? "receive payments" : "pay for jobs"}.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate(Routes.AddPaymentMethodScreen)}
          >
            <Text style={styles.emptyStateButtonText}>
              {t("profile.paymentMethods.addPaymentMethod")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!userProfile)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          padding: 100,
        }}
      >
        <Button
          title={t("buttons.signIn")}
          variant="primary"
          fullWidth
          // loading={loading}
          onPress={handleLogout}
          style={styles.loginButton}
        />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate(Routes.LanguageSettingsScreen)}
        >
          <Settings size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userProfile.profileImage ? (
              // <Image
              //   source={{ uri: userProfile.profileImage }}
              //   style={styles.avatar}
              // />
              <Image
              source={
                error || !userProfile?.profileImage
                  ? require("../../../assets/dummyImage.png") // fallback local image
                  : { uri: userProfile.profileImage }
              }
              style={styles.avatar}
              onError={() => setError(true)}
            />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {userProfile?.userName?.charAt(0) || 'U'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate(Routes.EditProfileScreen)}
            >
              <Edit size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{userProfile?.userName || 'User'}</Text>
          <Text style={styles.userRole}>
          {userProfile?.roles?.[0]?.role?.name?.toUpperCase()}

            {/* {userRole === "driver"
              ? t("home.truckDriver")
              : (userProfile as MerchantProfile).merchantType} */}
          </Text>

          <View style={styles.verificationBadge}>
            <Text style={styles.verificationText}>
              {userProfile.isEmailVerified
                ? t("profile.verifiedAccount")
                : t("profile.verificationPending")}
            </Text>
          </View>

          <Button
            title={t("profile.editProfile")}
            variant="outline"
            onPress={() => navigation.navigate(Routes.EditProfileScreen)}
            style={styles.editButton}
          />
          
   
        </View>

        <View style={styles.contactSection}>
          <View style={styles.contactItem}>
            <Phone
              size={20}
              color={Colors.primary}
              style={styles.contactIcon}
            />
            <Text style={styles.contactText}>{userProfile.phoneCountryCode}-{userProfile.phoneNumber}</Text>
          </View>

          <View style={styles.contactItem}>
            <Mail size={20} color={Colors.primary} style={styles.contactIcon} />
            <Text style={styles.contactText}>{userProfile.email}</Text>
          </View>
        </View>

        {/* Notification Permission Section
        <View style={styles.notificationSection}>
          <View style={styles.notificationHeader}>
            <Bell size={20} color={Colors.primary} style={styles.notificationIcon} />
            <Text style={styles.notificationTitle}>{t("profile.notifications")}</Text>
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              {t("profile.notificationDescription")}
            </Text>
            <Button
              title={t("profile.requestNotificationPermission")}
              variant="outline"
              onPress={handleRequestNotificationPermission}
              style={styles.notificationButton}
            />
          </View>
        </View> */}

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "profile" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("profile")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "profile" && styles.activeTabButtonText,
              ]}
            >
              {t("profile.tabs.profile")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "transactions" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("transactions")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "transactions" && styles.activeTabButtonText,
              ]}
            >
              {t("profile.tabs.transactions")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "payment" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("payment")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "payment" && styles.activeTabButtonText,
              ]}
            >
              {t("profile.tabs.paymentMethods")}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "profile" &&
          (userRole === "carrier" || userRole === "broker" || userRole === "shipper") &&
          renderCarrierProfile(userProfile as MerchantProfile)}

        {activeTab === "profile" &&
          userRole === "driver" &&
          renderDriverProfile(userProfile as DriverProfile)}
        {activeTab === "profile" &&
          userRole === "merchant" &&
          renderMerchantProfile(userProfile as MerchantProfile)}

        {activeTab === "transactions" && renderTransactionsTab()}

        {activeTab === "payment" && renderPaymentMethodsTab()}

        {/* <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => navigation.navigate(Routes.SocketDebugScreen)}
        >
          <Activity size={20} color={Colors.info} style={styles.debugIcon} />
          <Text style={styles.debugText}>Socket Debug</Text>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export { ProfileScreen };
