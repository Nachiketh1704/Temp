import { User } from "../../models/users";
import { UserVerificationStatus, UserVerificationStatusType } from "../../constants/enum";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";

export class UserVerificationService {
  /**
   * Update user verification status
   */
  async updateVerificationStatus(
    userId: number,
    status: UserVerificationStatusType,
    verifiedByUserId?: number,
    notes?: string
  ) {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const updateData: any = {
      verificationStatus: status,
      verificationStatusUpdatedAt: new Date().toISOString(),
      lastVerificationAttemptAt: new Date().toISOString(),
    };

    if (verifiedByUserId) {
      updateData.verifiedByUserId = verifiedByUserId;
    }

    if (notes) {
      updateData.verificationNotes = notes;
    }

    await User.query().patchAndFetchById(userId, updateData);

    Logger.info(`✅ User ${userId} verification status updated to: ${status}`);
    return { success: true, status };
  }

  /**
   * Check if user meets verification requirements for a specific action
   */
  async checkVerificationRequirements(
    userId: number,
    requiredStatus: UserVerificationStatusType
  ) {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const currentStatus = user.verificationStatus as UserVerificationStatusType;
    
    // Define status hierarchy (higher = more verified)
    const statusHierarchy = {
      [UserVerificationStatus.PENDING]: 0,
      [UserVerificationStatus.PROFILE_COMPLETE]: 1,
      [UserVerificationStatus.DOCUMENTS_VERIFIED]: 2,
      [UserVerificationStatus.ADMIN_VERIFIED]: 3,
      [UserVerificationStatus.FULLY_VERIFIED]: 4,
      [UserVerificationStatus.SUSPENDED]: -1,
      [UserVerificationStatus.REJECTED]: -1,
    };

    const currentLevel = statusHierarchy[currentStatus] || 0;
    const requiredLevel = statusHierarchy[requiredStatus] || 0;

    if (currentLevel < requiredLevel) {
      throw new HttpException(
        `Verification required. Current status: ${currentStatus}, Required: ${requiredStatus}`,
        403
      );
    }

    return { 
      isVerified: currentLevel >= requiredLevel,
      currentStatus,
      requiredStatus 
    };
  }

  /**
   * Get user verification summary
   */
  async getVerificationSummary(userId: number) {
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('verifiedByUser');

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const verificationSteps = [
      {
        step: "Email Verification",
        status: user.isEmailVerified ? "completed" : "pending",
        completedAt: user.emailVerifiedAt,
      },
      {
        step: "Profile Completion",
        status: this.isProfileComplete(user) ? "completed" : "pending",
        completedAt: null, // Could be tracked separately
      },
      {
        step: "Document Verification",
        status: user.verificationStatus === UserVerificationStatus.DOCUMENTS_VERIFIED || 
                user.verificationStatus === UserVerificationStatus.ADMIN_VERIFIED ||
                user.verificationStatus === UserVerificationStatus.FULLY_VERIFIED 
                ? "completed" : "pending",
        completedAt: user.verificationStatusUpdatedAt,
      },
      {
        step: "Admin Verification",
        status: user.verificationStatus === UserVerificationStatus.ADMIN_VERIFIED ||
                user.verificationStatus === UserVerificationStatus.FULLY_VERIFIED
                ? "completed" : "pending",
        completedAt: user.verificationStatusUpdatedAt,
        verifiedBy: user.verifiedByUser ? {
          id: user.verifiedByUser.id,
          name: user.verifiedByUser.fullName,
        } : null,
      },
    ];

    return {
      userId: user.id,
      currentStatus: user.verificationStatus,
      lastUpdated: user.verificationStatusUpdatedAt,
      verificationNotes: user.verificationNotes,
      steps: verificationSteps,
      isFullyVerified: user.verificationStatus === UserVerificationStatus.FULLY_VERIFIED,
    };
  }

  /**
   * Check if user profile is complete
   */
  private isProfileComplete(user: User): boolean {
    // Basic profile completion check
    const hasBasicInfo = user.firstName && user.lastName && user.email;
    const hasProfileImage = !!user.profileImage;
    
    // You can add more profile completion criteria here
    return !!hasBasicInfo && hasProfileImage;
  }

  /**
   * Auto-update verification status based on user actions
   */
  async autoUpdateVerificationStatus(userId: number) {
    const user = await User.query().findById(userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const currentStatus = user.verificationStatus as UserVerificationStatusType;
    
    // Auto-update to profile_complete if basic profile is complete
    if (currentStatus === UserVerificationStatus.PENDING && this.isProfileComplete(user)) {
      await this.updateVerificationStatus(userId, UserVerificationStatus.PROFILE_COMPLETE);
      return { updated: true, newStatus: UserVerificationStatus.PROFILE_COMPLETE };
    }

    return { updated: false, currentStatus };
  }

  /**
   * Get users pending verification (for admin dashboard)
   */
  async getPendingVerifications(limit = 50, offset = 0) {
    const users = await User.query()
      .whereIn('verificationStatus', [
        UserVerificationStatus.PROFILE_COMPLETE,
        UserVerificationStatus.DOCUMENTS_VERIFIED
      ])
      .orderBy('verificationStatusUpdatedAt', 'desc')
      .limit(limit)
      .offset(offset);

    return users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      verificationStatus: user.verificationStatus,
      lastUpdated: user.verificationStatusUpdatedAt,
      verificationNotes: user.verificationNotes,
    }));
  }
}
