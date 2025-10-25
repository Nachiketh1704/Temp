/**
 * Notification Screen
 * @format
 */

import * as React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import {
  Bell,
  CheckCircle,
  Info,
  Truck,
  DollarSign,
  ArrowLeft,
} from "lucide-react-native";

//Screens
import { Colors } from "@app/styles";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Mock notification data
const mockNotifications = [
  {
    id: "n1",
    type: "job_assigned",
    title: "Job Assigned",
    message:
      "You have been assigned to transport refrigerated goods from Los Angeles to San Diego.",
    jobId: "j1",
    read: false,
    timestamp: "2025-06-07T10:30:00Z",
  },
  {
    id: "n2",
    type: "payment_received",
    title: "Payment Received",
    message: "You have received a payment of $1,200 for job #J-12345.",
    read: true,
    timestamp: "2025-06-06T15:45:00Z",
  },
  {
    id: "n3",
    type: "document_verified",
    title: "Document Verified",
    message: "Your commercial driver license has been verified.",
    read: true,
    timestamp: "2025-06-05T09:15:00Z",
  },
  {
    id: "n4",
    type: "job_completed",
    title: "Job Completed",
    message:
      "Job #J-12346 has been marked as completed. Thank you for your service!",
    read: false,
    timestamp: "2025-06-04T17:20:00Z",
  },
  {
    id: "n5",
    type: "new_job",
    title: "New Job Available",
    message: "A new job matching your preferences is available in your area.",
    read: false,
    timestamp: "2025-06-03T11:10:00Z",
  },
  {
    id: "n6",
    type: "system",
    title: "System Maintenance",
    message:
      "TruckConnect will be undergoing maintenance on June 10th from 2:00 AM to 4:00 AM EST.",
    read: true,
    timestamp: "2025-06-02T08:00:00Z",
  },
];

function NotificationsScreen() {
  const { t } = useTranslation();

  const styles = useThemedStyle(getStyles);
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const navigation = useNavigation();

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_assigned":
      case "job_completed":
      case "new_job":
        return <Truck size={24} stroke={Colors.primary} />;
      case "payment_received":
        return <DollarSign size={24} stroke={Colors.success} />;
      case "document_verified":
        return <CheckCircle size={24} stroke={Colors.success} />;
      case "system":
        return <Info size={24} stroke={Colors.warning} />;
      default:
        return <Bell size={24} stroke={Colors.primary} />;
    }
  };

  const renderNotificationItem = ({
    item,
  }: {
    item: (typeof mockNotifications)[0];
  }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.read ? styles.notificationRead : styles.notificationUnread,
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(item.type)}
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Bell size={40} stroke={Colors.gray400} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{t("common.noNotifications")}</Text>
      <Text style={styles.emptyText}>
        You don't have any notifications yet. We'll notify you about job
        updates, payments, and important announcements.
      </Text>
    </View>
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerBack}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t("navigation.notification")}</Text>
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[styles.filterButton]}></TouchableOpacity>
      </View>
      {/* {unreadCount > 0 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )} */}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

export { NotificationsScreen };
