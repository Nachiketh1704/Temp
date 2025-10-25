/**
 * JobDetails Screen
 * @format
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
} from "react-native";
import {
  MapPin,
  Calendar,
  Truck,
  Package,
  Info,
  ArrowRight,
  User,
  Star,
  Phone,
  MessageCircle,
  Camera,
  CreditCard,
  X,
  Gavel,
  SquareCheck,
  Share,
} from "lucide-react-native";

//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { useJobStore } from "@app/store/jobStore";
import { useChatStore } from "@app/store/chatStore";
import { usePaymentStore } from "@app/store/paymentStore";
import { Button } from "@app/components/Button";
import { formatCurrency } from "@app/utils/formatters";
import { getStyles } from "./jobDetailsStyles";
import { Routes } from "@app/navigator";
import { useTranslation } from "react-i18next";
import Header from "@app/components/Header";
import { useDispatch, useSelector } from "react-redux";
import {
  selectProfile,
  selectCurrentJob,
  selectLoader,
} from "@app/module/common";
import {
  applyjob,
  fetchJobById,
  startInspection,
  completeInspection,
  getMyInspections,
} from "@app/module/jobs/slice";
import { useFocusEffect } from "@react-navigation/native";

function JobDetailScreen({ navigation, route }) {
  const styles = useThemedStyle(getStyles);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const profileData = useSelector(selectProfile);
  const { jobId } = route.params || {};
  const job = useSelector(selectCurrentJob);
  console.log('job in  job details ', job)
  const currentUserRoleId = profileData?.roles?.[0]?.role?.id;
  const isEligiblePickJob = job?.visibilityRoles?.some(
    (role) => role.roleId === currentUserRoleId
  );
  const hasDriverAssigned =
    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.some(
      (participant) => participant.status === "active"
    );

  // Example: Get the participants array
  const participants =
    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants || [];
  const hasAcceptedDriver = participants.some(
    (p) => p.role === "driver" && p.status === "accepted"
  );
  // Extract unique roles
  const roles = Array.from(new Set(participants.map((p) => p.role)));
  const hasCarrierAssigned = roles.includes("carrier");
  const existsCarrier = job?.jobApplications?.[0]?.contracts?.some(
    (contract) => contract.hiredUserId === profileData.id
  );
  console.log(roles, "rolesss in job");
  // ["driver", "manager", "admin"] (example output)
  const exists = job?.jobApplications?.some(
    (job) => job.applicantUserId === profileData.id
  );

  console.log("JobDetailScreen - Route params:", job?.visibilityRoles);
  console.log("isEligiblePickJob", isEligiblePickJob, exists);
  console.log(job, "jobId from route params");

  const userRole = profileData?.roles?.[0]?.role?.name;
  const { userProfile } = useAuthStore();
  const { updateJobStatus } = useJobStore();
  const { getOrCreateConversation, initiateCall } = useChatStore();
  const { processPayment, balance } = usePaymentStore();

  const [loading, setLoading] = useState(false);
  const isLoading = useSelector(selectLoader);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(
    null
  );
  const [inspections, setInspections] = useState<any[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
console.log("inspectionsinspectionsinspections", inspections)
  // Bid related state
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  // Fetch job by ID when component mounts or jobId changes
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchJobById({ id: jobId }));
    }, [dispatch])
  );

  // Fetch inspections when job is loaded
  useEffect(() => {
    if (job?.jobApplications?.[0]?.contracts?.[0]?.id) {
      fetchInspections();
    }
  }, [job]);

  const fetchInspections = () => {
    if (!job?.jobApplications?.[0]?.contracts?.[0]?.id) return;

    const contractId = job.jobApplications?.[0]?.contracts?.[0]?.id;
    setLoadingInspections(true);

    dispatch(
      getMyInspections({
        contractId: contractId.toString(),
        onSuccess: (response) => {
          console.log("Inspections fetched successfully:", response);
          setInspections(response?.data || []);
          setLoadingInspections(false);
        },
        onError: (error) => {
          console.error("Failed to fetch inspections:", error);
          setLoadingInspections(false);
        },
      })
    );
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };


  const handleApplyForJob = async () => {
    if (!job) {
      Alert.alert("Error", "Job information not available");
      return;
    }

    setLoading(true);
console.log("job.payAmount:", typeof(job.payAmount));
    try {
      const applicationData = {
        jobId: parseInt(jobId),
        coverLetter: message,
        proposedRate: Number(job?.payAmount),
        estimatedDuration: "",
        notes: bidMessage,
      };

      console.log("applicationData:", applicationData);

      // Dispatch the action (Redux saga will handle the API call)
      dispatch(applyjob(applicationData) as any);

      // Show success message and navigate back
      Alert.alert(
        "Application Submitted",
        "Your job application has been submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error applying for job:", error);
      Alert.alert(
        "Error",
        "An error occurred while submitting your application."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleCancelJob = () => {
    if (!job) return;

    Alert.alert(t("errors.cancelJobTitle"), t("errors.cancelJobMessage"), [
      { text: t("common.no"), style: "cancel" },
      {
        text: t("common.yesCancel"),
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            updateJobStatus(job.id, "cancelled");
            Alert.alert(
              t("errors.cancelJobSuccessTitle"),
              t("errors.cancelJobSuccessMessage")
            );
          } catch (error) {
            console.error("Error cancelling job:", error);
            Alert.alert(
              t("errors.cancelJobErrorTitle"),
              t("errors.cancelJobErrorMessage")
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
  const handleStartChat = () => {
    if (!job || !userProfile) return;

    const otherParticipantId =
      userRole === "driver" ? job.merchantId : job.assignedDriverId;

    if (!otherParticipantId) {
      Alert.alert(
        t("errors.cancelJobErrorTitle"),
        t("errors.chatStartErrorMessage")
      );
      return;
    }

    const conversationId = getOrCreateConversation(
      [userProfile.id, otherParticipantId],
      job.id
    );

    navigation.navigate(Routes.ChatScreen, { id: conversationId } as never);
  };

  const handleStartCall = () => {
    if (!job || !userProfile) return;

    const otherParticipantId =
      userRole === "driver" ? job.merchantId : job.assignedDriverId;
    const otherParticipantName =
      userRole === "driver" ? job.merchantName : "Driver";

    if (!otherParticipantId) {
      Alert.alert(
        t("errors.cancelJobErrorTitle"),
        t("errors.chatStartErrorMessage")
      );
      return;
    }

    const call = initiateCall(
      userProfile.id,
      userProfile.name,
      otherParticipantId,
      otherParticipantName,
      job.id
    );

    navigation.navigate(Routes.CallScreen, { id: call.id } as never);
  };

  const handleVerification = (
    verificationType: "pre_trip" | "pod1" | "post_trip" | "pod2"
  ) => {
    if (!job) return;

    const contractId = job?.jobApplications?.[0]?.contracts?.[0]?.id;

    if (!contractId) {
      Alert.alert("Error", "Contract ID not found");
      return;
    }

    console.log("handleVerification - starting inspection:", {
      contractId,
      verificationType,
    });

    // Navigate to camera screen for all verification types
    navigation.navigate(Routes.VerificationCameraScreen, {
      jobId: job.id,
      type: verificationType,
      contractId: contractId.toString(),
      existingInspections: inspections, // Pass existing inspection data
      onComplete: (inspectionData: any) => {
        // This callback will be called from the camera screen with captured data
        handleStartInspection(inspectionData, verificationType);
      },
    } as never);
  };

  const handleStartInspection = (
    inspectionData: any,
    inspectionType: "pre_trip" | "pod1" | "post_trip" | "pod2"
  ) => {
    if (!job) return;

    const contractId = job?.jobApplications?.[0]?.contracts?.[0]?.id;

    if (!contractId) {
      Alert.alert("Error", "Contract ID not found");
      return;
    }

    console.log(
      "handleStartInspection - starting inspection with data:",
      inspectionData,
      "type:",
      inspectionType
    );

    // Map inspection types to API types
    const apiType =
      inspectionType === "pre_trip" || inspectionType === "pod1"
        ? "pre"
        : "post";

    dispatch(
      startInspection({
        contractId: contractId.toString(),
        type: apiType, // Map to API expected types
        data: inspectionData.data || {
          odometer: inspectionData.odometer || 12345,
        },
        defects: {
          lights: inspectionData.defects?.lights || "ok",
          ...inspectionData.defects,
        },
        photos: inspectionData.photos || [],
        onSuccess: (response) => {
          console.log("Inspection started successfully:", response);
          // Store the inspection ID for later use in complete inspection
          if (response?.data?.id) {
            setCurrentInspectionId(response.data.id.toString());

            // After starting inspection, immediately complete it with the captured data
            handleCompleteInspection(
              inspectionData,
              response.data.id.toString()
            );
          }
        },
        onError: (error) => {
          console.error("Failed to start inspection:", error);
          Alert.alert("Error", error);
        },
      })
    );
  };

  const handleCompleteInspection = (
    inspectionData: any,
    inspectionId?: string
  ) => {
    if (!job) return;

    const contractId = job?.jobApplications?.[0]?.contracts?.[0]?.id;

    if (!contractId) {
      Alert.alert("Error", "Contract ID not found");
      return;
    }

    console.log(
      "handleCompleteInspection - completing inspection with data:",
      inspectionData,
      "inspectionId:",
      inspectionId
    );

    // Use the provided inspection ID or the stored one
    const finalInspectionId =
      inspectionId || currentInspectionId || inspectionData.inspectionId;

    if (!finalInspectionId) {
      Alert.alert(
        "Error",
        "Inspection ID not found. Please start inspection first."
      );
      return;
    }

    dispatch(
      completeInspection({
        inspectionId: finalInspectionId,
        data: inspectionData.data || {
          odometer: inspectionData.odometer || 12345,
        },
        defects: {
          lights: inspectionData.defects?.lights || "ok",
          ...inspectionData.defects,
        },
        photos: inspectionData.photos || [],
        podPhoto: inspectionData.podPhoto || {
          photos: [],
        },
        onSuccess: (response) => {
          console.log("Inspection completed successfully:", response);
          // Refresh inspections to show the new data
          fetchInspections();
          // Navigate back or show success message
          Alert.alert("Success", "Inspection completed successfully!");
        },
        onError: (error) => {
          console.error("Failed to complete inspection:", error);
          Alert.alert("Error", error);
        },
      })
    );
  };

  const handlePayDriver = () => {
    if (!job) return;

    if (
      balance < parseFloat(job.payAmount || job.compensation?.toString() || "0")
    ) {
      Alert.alert(
        t("errors.insufficientBalanceTitle"),
        t("errors.insufficientBalanceMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("profile.balance.addFunds"),
            onPress: () => navigation.navigate(Routes.DepositScreen as never),
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Pay Driver",
      `Are you sure you want to pay ${formatCurrency(
        parseFloat(job.payAmount || job.compensation?.toString() || "0"),
        job.currency || "USD"
      )} to the driver?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: async () => {
            setPaymentLoading(true);

            try {
              // In a real app, we would call an API to process the payment
              // For now, we'll just update the local state

              // Simulate network delay
              await new Promise((resolve) => setTimeout(resolve, 1500));

              // Process the payment
              const paymentResult = processPayment({
                amount: parseFloat(
                  job.payAmount || job.compensation?.toString() || "0"
                ),
                currency: job.currency || "USD",
                jobId: job.id,
                payerId: userProfile?.id || "",
                payeeId: job.assignedDriverId || "",
                description: `Payment for job: ${job.title}`,
                jobReference: job.title,
              });

              if (paymentResult) {
                // Update job status to completed
                updateJobStatus(job.id, "completed");

                // Job status will be updated by the store

                Alert.alert(
                  "Payment Successful",
                  "Your payment has been processed successfully.",
                  [
                    {
                      text: "View Receipt",
                      onPress: () =>
                        navigation.navigate(
                          Routes.TransactionDetailScreen as never,
                          {
                            id: paymentResult.id,
                          } as never
                        ),
                    },
                    { text: "OK" },
                  ]
                );
              } else {
                throw new Error("Payment failed");
              }
            } catch (error) {
              console.error("Error processing payment:", error);
              Alert.alert(
                "Error",
                "Failed to process payment. Please try again."
              );
            } finally {
              setPaymentLoading(false);
            }
          },
        },
      ]
    );
  };

  // Bid handling functions
  const handleOpenBidModal = () => {
    setShowBidModal(true);
    setBidAmount("");
    setBidMessage("");
  };

  const handleCloseBidModal = () => {
    setShowBidModal(false);
    setBidAmount("");
    setBidMessage("");
  };

  const handleSubmitBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid bid amount");
      return;
    }

    if (!job) {
      Alert.alert("Error", "Job information not available");
      return;
    }

    try {
      setLoading(true);

      const applicationData = {
        jobId: parseInt(jobId),
        coverLetter: message,
        proposedRate: parseFloat(bidAmount),
        estimatedDuration: "",
        notes: bidMessage,
      };

      console.log("Bid application data:", applicationData);

      // Dispatch the action (Redux saga will handle the API call)
      dispatch(applyjob(applicationData) as any);

      Alert.alert(
        "Bid Submitted",
        `Your bid of ${formatCurrency(
          parseFloat(bidAmount),
          job.currency || "USD"
        )} has been submitted successfully!`,
        [
          {
            text: "OK",
            onPress: () => {
              handleCloseBidModal();
              // Optionally refresh job data or navigate back
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting bid:", error);
      Alert.alert("Error", "Failed to submit bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDriverManagement = () => {
    if (!job) return;

    // Check if there are any assigned drivers
    const assignedDrivers =
      job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
        (p) => p.role === "driver"
      ) || [];

    if (assignedDrivers.length === 0) {
      // No drivers assigned - navigate to driver listing
      navigation.navigate(Routes.DriverListingScreen, {
        jobId: jobId,
        jobTitle: job?.title || "Job Assignment",
        contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      });
    } else {
      // Drivers assigned - navigate to driver assignment
      navigation.navigate(Routes.DriverAssignmentScreen, {
        jobId: jobId,
        jobTitle: job?.title || "Job Assignment",
        contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      });
    }
  };
  const handleCarrierManagement = () => {
    console.log("handleCarrierManagement");
    if (!job) return;

    // Check if there are any assigned drivers
    const assignedDrivers =
      job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
        (p) => p.role === "driver"
      ) || [];

    if (assignedDrivers.length === 0) {
      // No drivers assigned - navigate to driver listing
      navigation.navigate(Routes.CarrierListingScreen, {
        jobId: jobId,
        jobTitle: job?.title || "Job Assignment",
        contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      });
    } else {
      // Drivers assigned - navigate to driver assignment
      // navigation.navigate(Routes.DriverAssignmentScreen, {
      //   jobId: jobId,
      //   jobTitle: job?.title || "Job Assignment",
      //   contractId: job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
      // });
    }
  };
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
      case "draft":
        return Colors.primary;
      case "active":
        return Colors.primary;
      case "assigned":
        return Colors.warning;
      case "in_progress":
      case "arrived_pickup":
      case "loaded":
      case "in_transit":
      case "arrived_delivery":
        return Colors.secondary;
      case "delivered":
      case "completed":
        return Colors.success;
      case "cancelled":
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const renderInspectionImages = () => {
    if (!inspections || inspections.length === 0) return null;

    // Helper function to render a consistent inspection tile
    const renderInspectionTile = (
      title: string,
      date: string,
      photos: any[],
      comment: string,
      commentLabel: string,
      borderColor: string
    ) => {
      if (!photos || photos.length === 0) return null;

      return (
        <View
          key={title}
          style={[styles.inspectionTile, { borderLeftColor: borderColor }]}
        >
          <Text style={styles.inspectionTileTitle}>{title}</Text>
          <Text style={styles.inspectionTileDate}>{date}</Text>

          <View style={styles.photosContainer}>
            <View style={styles.photosGrid}>
              {photos.slice(0, 2).map((photo: any, photoIndex: number) => (
                <TouchableOpacity
                  key={photoIndex}
                  style={styles.photoItem}
                  onPress={() => handleImagePress(photo.url)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.inspectionPhoto}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}

              {photos.length > 2 && (
                <TouchableOpacity
                  style={styles.morePhotosButton}
                  onPress={() => handleImagePress(photos[2].url)}
                  activeOpacity={0.8}
                >
                  <View style={styles.morePhotosOverlay}>
                    <Text style={styles.morePhotosText}>
                      +{photos.length - 2}
                    </Text>
                    <Text style={styles.morePhotosSubtext}>more</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {comment && (
            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>{commentLabel}</Text>
              <Text style={styles.commentText}>{comment}</Text>
            </View>
          )}
        </View>
      );
    };

    return (
      <View style={styles.inspectionContainer}>
        {loadingInspections ? (
          <Text style={styles.loadingText}>Loading inspection photos...</Text>
        ) : (
          <View style={styles.inspectionList}>
            {(() => {
              // Find inspections by type
              const preTripInspection = inspections.find(
                (inspection) =>
                  inspection.type === "pre_trip" || inspection.type === "pre"
              );
              const pod1Inspection = inspections.find(
                (inspection) =>
                  inspection.type === "pod1" ||
                  (inspection.type === "pre" && inspection.podPhoto?.pod1)
              );
              const pod2Inspection = inspections.find(
                (inspection) =>
                  inspection.type === "pod2" ||
                  (inspection.type === "post" && inspection.podPhoto?.pod2)
              );
              const postTripInspection = inspections.find(
                (inspection) =>
                  inspection.type === "post_trip" || inspection.type === "post"
              );

              // Render in the specified sequence
              return (
                <>
                  {preTripInspection &&
                    renderInspectionTile(
                      "Pre-Trip Inspection",
                      new Date(
                        preTripInspection.createdAt
                      ).toLocaleDateString(),
                      preTripInspection.photos || [],
                      preTripInspection.data?.preInspectionComment ||
                        preTripInspection.preInspectionComment ||
                        "",
                      "Pre-Trip Comment:",
                      Colors.primary
                    )}

                  {pod1Inspection &&
                    renderInspectionTile(
                      "Proof of Document (POD 1)",
                      new Date(pod1Inspection.createdAt).toLocaleDateString(),
                      pod1Inspection.podPhoto?.pod1 || [],
                      pod1Inspection.data?.pod1Comment ||
                        pod1Inspection.pod1Comment ||
                        "",
                      "POD 1 Comment:",
                      Colors.success
                    )}

                  {pod2Inspection &&
                    renderInspectionTile(
                      "Proof of Document (POD 2)",
                      new Date(pod2Inspection.createdAt).toLocaleDateString(),
                      pod2Inspection.podPhoto?.pod2 || [],
                      pod2Inspection.data?.pod2Comment ||
                        pod2Inspection.pod2Comment ||
                        "",
                      "POD 2 Comment:",
                      Colors.success
                    )}

                  {postTripInspection &&
                    renderInspectionTile(
                      "Post-Trip Inspection",
                      new Date(
                        postTripInspection.createdAt
                      ).toLocaleDateString(),
                      postTripInspection.photos || [],
                      postTripInspection.data?.postInspectionComment ||
                        postTripInspection.postInspectionComment ||
                        "",
                      "Post-Trip Comment:",
                      Colors.warning
                    )}
                </>
              );
            })()}
          </View>
        )}
      </View>
    );
  };
   // Check if inspections already exist for each type - handle both old and new formats
   const hasPreTrip = inspections.some(
    (inspection) =>
      inspection.type === "pre_trip" || inspection.type === "pre" && inspection.photos?.length > 0
  );
  const hasPod1 = inspections.some(
    (inspection) =>
      inspection.type === "pod1" ||
      (inspection.type === "pre" && inspection.podPhoto?.pod1)
  );
  const hasPostTrip = inspections.some(
    (inspection) =>
        inspection.type === "post" && inspection.photos?.length > 0
  );
  const hasPod2 = inspections.some(
    (inspection) =>
      inspection.type === "pod2" ||
      (inspection.type === "post" && inspection.podPhoto?.pod2)
  );
  const renderVerificationButtons = () => {
    if (
      !job ||
      userRole !== "driver" ||
      job.assignedDriverId !== userProfile?.id
    )
      return null;

 

    // Remove old verification logic - now using 4 separate buttons

    return (
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>{t("jobs.jobDetails")}</Text>

        <View style={styles.verificationButtons}>
          {/* Pre-Trip Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPreTrip && styles.verificationButtonCompleted,
            ]}
            onPress={() => handleVerification("pre_trip")}
            disabled={hasPreTrip}
          >
               {!hasPreTrip && (
              <Camera
                size={20}
                color={Colors.primary}
                style={styles.verificationIcon}
              />
            )}
            {hasPreTrip && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPreTrip && styles.verificationButtonTextCompleted,
              ]}
            >
              {t("jobs.verification.preTrip")}
            </Text>
          </TouchableOpacity>

          {/* POD 1 Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPod1 && styles.verificationButtonCompleted,
            ]}
            onPress={() => handleVerification("pod1")}
            disabled={hasPod1}
          >
            {!hasPod1 && (
              <Camera
                size={20}
                color={Colors.primary}
                style={styles.verificationIcon}
              />
            )}
            {hasPod1 && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPod1 && styles.verificationButtonTextCompleted,
              ]}
            >
              {t("jobs.verification.proofOfDocument_1")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verificationButtons}>
          {/* POD 2 Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPod2 && styles.verificationButtonCompleted,
            ]}
            onPress={() => handleVerification("pod2")}
            disabled={hasPod2}
          >
             {!hasPod2 && (
              <Camera
                size={20}
                color={Colors.primary}
                style={styles.verificationIcon}
              />
            )}
            {hasPod2 && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPod2 && styles.verificationButtonTextCompleted,
              ]}
            >
              {t("jobs.verification.proofOfDocument_2")} 
            </Text>
          </TouchableOpacity>

          {/* Post-Trip Button */}
          <TouchableOpacity
            style={[
              styles.verificationButton,
              hasPostTrip && styles.verificationButtonCompleted,
            ]}
            onPress={() => handleVerification("post_trip")}
            disabled={hasPostTrip}
          >
            {!hasPostTrip && (
              <Camera
                size={20}
                color={Colors.primary}
                style={styles.verificationIcon}
              />
            )}
            {hasPostTrip && (
              <SquareCheck
                color={Colors.gray100}
                size={22}
                style={styles.verificationIcon}
              />
            )}
            <Text
              style={[
                styles.verificationButtonText,
                hasPostTrip && styles.verificationButtonTextCompleted,
              ]}
            >
              {t("jobs.verification.postTrip")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Show completion status if all are done */}
        {hasPreTrip && hasPod1 && hasPostTrip && hasPod2 && (
          <View style={styles.inspectionStatusContainer}>
            <Text style={styles.inspectionStatusText}>
              ✅ All inspections completed
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCommunicationButtons = () => {
    if (!job) return null;

    // Only show communication buttons if the job is assigned and the user is either
    // the merchant who posted the job or the driver assigned to it
    const canCommunicate =
      job.status !== "posted" &&
      job.status !== "cancelled" &&
      job.status !== "completed" &&
      job.status !== "delivered" &&
      ((userRole === "driver" && job.assignedDriverId === userProfile?.id) ||
        (userRole === "merchant" && job.merchantId === userProfile?.id));

    if (!hasDriverAssigned) return null;

    return (
      <View style={styles.communicationContainer}>
        <TouchableOpacity
          style={styles.communicationButton}
          onPress={handleStartChat}
        >
          <MessageCircle size={20} color={Colors.primary} />
          <Text style={styles.communicationButtonText}>
            {t("common.message")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.communicationButton}
          onPress={handleStartCall}
        >
          <Phone size={20} color={Colors.primary} />
          <Text style={styles.communicationButtonText}>{t("common.call")}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPaymentSection = () => {
    if (!job) return null;

    // Only show payment section for merchants when job is delivered
    if (userRole !== "merchant" || job.status !== "delivered") return null;

    return (
      <View style={styles.paymentContainer}>
        <View style={styles.paymentHeader}>
          <CreditCard
            size={20}
            color={Colors.success}
            style={styles.paymentIcon}
          />
          <Text style={styles.paymentTitle}>
            {t("profile.paymentMethods.paymentRequired")}
          </Text>
        </View>

        <Text style={styles.paymentDescription}>
          The driver has completed this job. Please process the payment to
          finalize the job.
        </Text>

        <View style={styles.paymentDetails}>
          <Text style={styles.paymentLabel}>Amount Due:</Text>
          <Text style={styles.paymentAmount}>
            {formatCurrency(
              parseFloat(job.payAmount || job.compensation?.toString() || "0"),
              job.currency || "USD"
            )}
          </Text>
        </View>

        <Button
          title={`Pay ${formatCurrency(
            parseFloat(job.payAmount || job.compensation?.toString() || "0"),
            job.currency || "USD"
          )}`}
          variant="primary"
          fullWidth
          loading={paymentLoading}
          onPress={handlePayDriver}
        />
      </View>
    );
  };

  const renderDriverReshareSection = () => {
    if (!job) return null;

    if (!existsCarrier) return null;

    return (
      <View style={styles.reshareContainer}>
        <View style={styles.reshareHeader}>
          <View style={styles.reshareIcon}>
            <Share
              size={20}
              color={Colors.white}
            />
            {/* <Text style={styles.reshareIconText}>📤</Text> */}
          </View>
          <Text style={styles.reshareTitle}>Can't Find a Driver/Carrier?</Text>
        </View>
        
        <Text style={styles.reshareDescription}>
          Reshare this job to expand your reach and find available drivers/carriers in your network.
        </Text>
        
        <TouchableOpacity 
          style={styles.reshareButton}
          onPress={handleReshareJob}
        >
          <Text style={styles.reshareButtonText}>Reshare Job</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleReshareJob = () => {
    if (!job) return;
    
    // Navigate to reshare screen with job data
    navigation.navigate(Routes.ReshareJobScreen, { job } as never);
  };

  const renderBidModal = () => {
    if (!job) return null;

    return (
      <Modal
        visible={showBidModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseBidModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bidModalContainer}>
            <View style={styles.bidModalHeader}>
              <Text style={styles.bidModalTitle}>Submit Bid</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseBidModal}
              >
                <X size={24} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.bidModalContent}>
              <Text style={styles.bidJobTitle}>{job.title}</Text>
              <Text style={styles.jobId}>Job ID-{job.id}</Text>

              <Text style={styles.bidJobDescription}>{job.description}</Text>

              <View style={styles.bidForm}>
                <Text style={styles.bidLabel}>Your Bid Amount</Text>
                <View style={styles.bidAmountContainer}>
                  <Text style={styles.currencySymbol}>
                    {job.currency === "USD" ? "$" : job.currency || "$"}
                  </Text>
                  <TextInput
                    style={styles.bidAmountInput}
                    placeholderTextColor={Colors.gray500}
                    placeholder="0.00"
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>

                <Text style={styles.bidLabel}>Message (Optional)</Text>
                <TextInput
                  style={styles.bidMessageInput}
                  placeholderTextColor={Colors.gray500}
                  placeholder="Add a message to your bid..."
                  value={bidMessage}
                  onChangeText={setBidMessage}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.bidModalActions}>
                <TouchableOpacity
                  style={styles.cancelBidButton}
                  onPress={handleCloseBidModal}
                >
                  <Text style={styles.cancelBidButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBidButton}
                  onPress={handleSubmitBid}
                  disabled={loading || !bidAmount}
                >
                  <Gavel
                    size={20}
                    color={Colors.white}
                    style={styles.bidIcon}
                  />
                  <Text style={styles.submitBidButtonText}>
                    {loading ? "Submitting..." : "Submit Bid"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!job) {
    return (
      <View style={styles.container}>
        <Header title={t("jobs.jobDetails")} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isLoading ? "Loading job details..." : "Job not found"}
          </Text>
          {!isLoading && (
            <Button
              title="Go Back"
              variant="outline"
              onPress={() => navigation.goBack()}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t("jobs.jobDetails")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(job.status) },
              ]}
            >
              <Text style={styles.statusText}>{formatStatus(job.status)}</Text>
            </View>
{  hasPreTrip && hasPod1 && hasPostTrip && hasPod2 &&          <TouchableOpacity
              style={styles.tripTrackingButton}
              onPress={() =>
                navigation.navigate(Routes.TripTrackingScreen, {
                  job: job,
                  jobId: job.id,
                })
              }
            >
              <Truck size={16} color={Colors.white} />
              <Text style={styles.tripTrackingButtonText}>Trip Tracking</Text>
            </TouchableOpacity>}
          </View>
        </View>

        <Text style={styles.jobId}>Job ID-{job.id}</Text>

        <Text style={styles.description}>{job.description}</Text>

        {renderCommunicationButtons()}

        {renderVerificationButtons()}

        {renderInspectionImages()}

        {renderPaymentSection()}

        {/* Can't Find a Driver Section */}
        {userRole === "carrier" || userRole === "broker" || userRole === "shipper" &&  renderDriverReshareSection()}

        <View style={styles.compensationContainer}>
          {/* <DollarSign
            size={20}
            color={Colors.success}
            style={styles.compensationIcon}
          /> */}
          <Text style={styles.compensationText}>
            {formatCurrency(
              parseFloat(job.payAmount || job.compensation?.toString() || "0"),
              job.currency || "USD"
            )}
          </Text>
          <Text style={styles.compensationText}>
            {job?.pricePerMile.toFixed(2)}/{t("jobs.miles")}
          </Text>
        </View>

        {/* Bids Information Section */}
        {job.userId == profileData.id &&
          job?.jobApplications &&
          job?.jobApplications.length > 0 && (
            <View style={styles.bidsContainer}>
              <View style={styles.bidsHeader}>
                <Text style={styles.bidsSectionTitle}>
                  Job Bids ({job.jobApplications.length})
                </Text>
                <TouchableOpacity
                  style={styles.viewAllBidsButton}
                  onPress={() =>
                    navigation.navigate(Routes.JobBidsScreen, { jobId: jobId })
                  }
                >
                  <Text style={styles.viewAllBidsText}>View All</Text>
                </TouchableOpacity>
              </View>
              {job?.jobApplications?.slice(0, 2).map((application, index) => (
                <View key={application.id || index} style={styles.bidItem}>
                  <View style={styles.bidHeader}>
                    <Text style={styles.bidTitle}>Bid #{index + 1}</Text>
                    <Text style={styles.bidStatus}>{application.status}</Text>
                  </View>
                  <Text style={styles.bidAmount}>
                    {formatCurrency(
                      parseFloat(application.proposedRate?.toString() || "0"),
                      job?.currency || "USD"
                    )}
                  </Text>
                  {application.coverLetter && (
                    <Text style={styles.bidMessage}>
                      "{application.coverLetter}"
                    </Text>
                  )}
                  {application.notes && (
                    <Text style={styles.bidNotes}>
                      Notes: {application.notes}
                    </Text>
                  )}
                  <Text style={styles.bidDate}>
                    Applied:{" "}
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
              {job.jobApplications.length > 2 && (
                <TouchableOpacity
                  style={styles.showMoreBidsButton}
                  onPress={() =>
                    navigation.navigate(Routes.JobBidsScreen, { jobId: jobId })
                  }
                >
                  <Text style={styles.showMoreBidsText}>
                    +{job.jobApplications.length - 2} more bids
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={[styles.routeMarker, styles.pickupMarker]}>
              <MapPin size={16} color={Colors.white} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>{t("jobs.pickup")}</Text>
              <Text style={styles.routeAddress}>
                {job.pickupLocation?.address || "Address not available"}
              </Text>
              <Text style={styles.routeCity}>
                {job.pickupLocation?.city || "City"},{" "}
                {job.pickupLocation?.state || "State"}{" "}
                {job.pickupLocation?.zipCode || ""}
              </Text>
              <Text style={styles.routeTime}>
                {job.pickupLocation?.date || "Date"} •{" "}
                {job.pickupLocation?.time || "Time"}
              </Text>
            </View>
          </View>

          <View style={styles.routeConnector} />

          <View style={styles.routePoint}>
            <View style={[styles.routeMarker, styles.deliveryMarker]}>
              <MapPin size={16} color={Colors.white} />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>{t("jobs.delivery")}</Text>
              <Text style={styles.routeAddress}>
                {job.dropoffLocation?.address || "Address not available"}
              </Text>
              <Text style={styles.routeCity}>
                {job.dropoffLocation?.city || "City"},{" "}
                {job.dropoffLocation?.state || "State"}{" "}
                {job.dropoffLocation?.zipCode || ""}
              </Text>
              <Text style={styles.routeTime}>
                {job.dropoffLocation?.date || "Date"} •{" "}
                {job.dropoffLocation?.time || "Time"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Calendar
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.pickupDate")}</Text>
                <Text style={styles.detailValue}>
                  {job.pickupLocation?.date || "Date not available"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <ArrowRight size={16} color={Colors.gray400} />
            </View>

            <View style={styles.detailItem}>
              <Calendar
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.deliveryDate")}</Text>
                <Text style={styles.detailValue}>
                  {job.dropoffLocation?.date || "Date not available"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Truck
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>
                  {t("jobs.filters.truckType")}
                </Text>
                <Text style={styles.detailValue}>
                  {job.requiredTruckType || "Any truck type"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Package
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.cargoWeight")}</Text>
                <Text style={styles.detailValue}>
                  {job?.cargo?.cargoWeight}{" "}
                  {job?.cargo?.cargoWeightUnit || "kg"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Package
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.cargoType")}</Text>
                <Text style={styles.detailValue}>
                  {job?.cargo?.cargoType || "Type not specified"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MapPin
                size={16}
                color={Colors.gray600}
                style={styles.detailIcon}
              />
              <View>
                <Text style={styles.detailLabel}>{t("jobs.distance")}</Text>
                <Text style={styles.detailValue}>
                  {(job?.cargo?.distance || 0).toFixed(1)} {t("jobs.miles")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {job.specialRequirements && (
          <View style={styles.requirementsContainer}>
            <View style={styles.requirementsHeader}>
              <Info
                size={16}
                color={Colors.warning}
                style={styles.requirementsIcon}
              />
              <Text style={styles.requirementsTitle}>
                {t("jobs.specialRequirements")}
              </Text>
            </View>
            <Text style={styles.requirementsText}>
              {job.specialRequirements}
            </Text>
          </View>
        )}

        <View style={styles.merchantContainer}>
          <Text style={styles.sectionTitle}>{t("jobs.postedBy")}</Text>

          <View style={styles.merchantCard}>
            <View style={styles.merchantHeader}>
              <View style={styles.merchantAvatar}>
                <User size={24} color={Colors.white} />
              </View>

              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName}>
                  {job.company?.companyName ||
                    job.merchantName ||
                    "Company Name"}
                </Text>
                <View style={styles.merchantRating}>
                  <Star size={14} color={Colors.warning} />
                  <Text style={styles.merchantRatingText}>
                    {(job.merchantRating || 0).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.merchantContact}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleStartCall}
              >
                <Phone size={16} color={Colors.primary} />
                <Text style={styles.contactButtonText}>{t("common.call")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleStartChat}
              >
                <MessageCircle size={16} color={Colors.primary} />
                <Text style={styles.contactButtonText}>
                  {t("common.message")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.messageLabel}>
            Cover Letter / Message (Optional)
          </Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Tell the employer why you're interested in this job..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.gray400}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {(userRole === "carrier" || userRole === "broker") &&
        job.status === "assigned" &&
        job.userId !== profileData.id && (
          <View
            style={{
              ...styles.footer,
              flexDirection: "row",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            {(!hasAcceptedDriver || !hasDriverAssigned) && (
              <Button
                title={(() => {
                  const assignedDrivers =
                    job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
                      (p) => p.role === "driver"
                    ) || [];
                  return assignedDrivers.length === 0
                    ? "Assign Driver"
                    : "Manage Drivers";
                })()}
                variant="primary"
                fullWidth={hasCarrierAssigned || existsCarrier ? true : false}
                loading={loading}
                onPress={handleDriverManagement}
              />
            )}
            {!hasCarrierAssigned ||
              (!existsCarrier && (
                <Button
                  title={(() => {
                    const assignedDrivers =
                      job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
                        (p) => p.role === "driver"
                      ) || [];
                    return assignedDrivers.length === 0
                      ? "Assign Carrier"
                      : "Manage Carriers";
                  })()}
                  variant="primary"
                  // fullWidth
                  loading={loading}
                  onPress={() =>
                    navigation.navigate(Routes.CarrierListingScreen, {
                      jobId: jobId,
                      jobTitle: job?.title || "Job Assignment",
                      contractId:
                        job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
                    })
                  }
                />
              ))}
          </View>
        )}
      {/* {(userRole === "carrier" || userRole === "broker") &&
        job.status === "active" &&
        job.userId !== profileData.id && (
          <View style={styles.footer}>
            <Button
              title={(() => {
                const assignedDrivers =
                  job?.jobApplications?.[0]?.contracts?.[0]?.contractParticipants?.filter(
                    (p) => p.role === "driver"
                  ) || [];
                return assignedDrivers.length === 0
                  ? "Assign Carrier"
                  : "Manage Carriers";
              })()}
              variant="primary"
              fullWidth
              loading={loading}
              onPress={() =>
                navigation.navigate(Routes.CarrierListingScreen, {
                  jobId: jobId,
                  jobTitle: job?.title || "Job Assignment",
                  contractId:
                    job?.jobApplications?.[0]?.contracts?.[0]?.id || "",
                })
              }
            />
          </View>
        )} */}
      {isEligiblePickJob && job.status === "active" && !exists && (
        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <Button
              title={t("buttons.pickjob")}
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleApplyForJob}
              style={styles.pickJobButton}
            />
            {(userRole === "carrier" || userRole === "broker") && (
              <Button
                title={"Bid"}
                variant="primary"
                fullWidth
                loading={loading}
                onPress={handleOpenBidModal}
                style={styles.pickJobButton}
              />
            )}
          </View>
        </View>
      )}

      {/* {((userRole === "driver" && job.assignedDriverId === userProfile?.id) ||
        (userRole === "merchant" && job.merchantId === userProfile?.id)) &&
        job.status !== "cancelled" &&
        job.status !== "completed" &&
        job.status !== "delivered" && (
          <View style={styles.footer}>
            <Button
              title={t("buttons.cancelJob")}
              variant="danger"
              fullWidth
              loading={loading}
              onPress={handleCancelJob}
            />
          </View>
        )} */}

      {renderBidModal()}

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={closeImageModal}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullSizeImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

export { JobDetailScreen };
