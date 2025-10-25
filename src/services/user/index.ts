import { User } from "../../models";
import { HttpException } from "../../utils/httpException";
import { UserVerificationService } from "./verification.service";

export class UserService {
  static async getByEmail(email: string) {
    const user = await User.query().findOne({ email });
    return user;
  }

  static async getById(id: number) {
    const user = await User.query().findById(id);
    return user;
  }

  static async requireByEmail(email: string) {
    const user = await User.query().findOne({ email });
    if (!user) {
      throw new HttpException("User not found", 404);
    }
    return user;
  }

  static async requireById(id: number) {
    const user = await User.query().findById(id);
    if (!user) {
      throw new HttpException("User not found", 404);
    }
    return user;
  }

  static async getProfileById(id: number) {
    const verificationService = new UserVerificationService();

    // Fetch user with all related data
    const user = await User.query()
      .findById(id)
      .withGraphFetched(
        "[roles.role, company, companyMemberships, driver, verifiedByUser]"
      );

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    // Get verification summary
    const verificationSummary =
      await verificationService.getVerificationSummary(id);

    // Prepare comprehensive profile data
    const profileData = {
      // Basic user info
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneCountryCode: user.phoneCountryCode,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Email verification
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,

      // Verification status
      verification: verificationSummary,

      // Roles and permissions
      roles:
        user.roles?.map((userRole) => ({
          id: userRole.roleId,
          role: userRole.role
            ? {
                id: userRole.role.id,
                name: userRole.role.name,
                description: userRole.role.description,
                isCompanyRole: userRole.role.isCompanyRole,
                jobPostFee: userRole.role.jobPostFee,
                sortOrder: userRole.role.sortOrder,
              }
            : null,
          sortOrder: userRole.sortOrder,
          assignedAt: userRole.assignedAt,
        })) || [],

      // Documents
      documents:
        user.documents?.map((doc) => ({
          id: doc.id,
          documentType: {
            id: doc.documentType?.id,
            name: doc.documentType?.name,
            description: doc.documentType?.description,
            requiresExpiry: doc.documentType?.requiresExpiry,
          },
          fileUrl: doc.fileUrl,
          expiryDate: doc.expiryDate,
          verified: doc.verified,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })) || [],

      // Company information
      company: user.company
        ? {
            id: user.company.id,
            companyName: user.company.companyName,
            industryType: user.company.industryType,
            contactNumber: user.company.contactNumber,
            phoneNumber: user.company.phoneNumber,
            address: user.company.address,
            country: user.company.country,
            state: user.company.state,
            city: user.company.city,
            zipCode: user.company.zipCode,
            createdAt: user.company.createdAt,
            updatedAt: user.company.updatedAt,
          }
        : null,

      // Company memberships (if user is part of other companies)
      companyMemberships:
        user.companyMemberships?.map((membership) => ({
          id: membership.id,
          company: {
            id: membership.company?.id,
            companyName: membership.company?.companyName,
            industryType: membership.company?.industryType,
            contactNumber: membership.company?.contactNumber,
            phoneNumber: membership.company?.phoneNumber,
            address: membership.company?.address,
            country: membership.company?.country,
            state: membership.company?.state,
            city: membership.company?.city,
            zipCode: membership.company?.zipCode,
          },
          roleInCompany: membership.roleInCompany,
          isPrimary: membership.isPrimary,
        })) || [],

      // Driver information (if applicable)
      driver: user.driver
        ? {
            id: user.driver.id,
            licenseNumber: user.driver.licenseNumber,
            twicNumber: user.driver.twicNumber,
            medicalCertificate: user.driver.medicalCertificate,
            drugTestResult: user.driver.drugTestResult,
            verified: user.driver.verified,
            workRadius: user.driver.workRadius,
            createdAt: user.driver.createdAt,
            updatedAt: user.driver.updatedAt,
          }
        : null,

      // Verification metadata
      verifiedBy: user.verifiedByUser
        ? {
            id: user.verifiedByUser.id,
            fullName: user.verifiedByUser.fullName,
            email: user.verifiedByUser.email,
          }
        : null,
    };

    const { password, ...safe } = user as any;
    return safe;
  }

  // Add more reusable methods as needed
}

export default new UserService();
