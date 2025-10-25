import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../types";
import {
  User,
  UserRole,
  Document,
  DocumentType,
  Company,
  CompanyType,
  Driver,
  UserTruck,
} from "../../models";
import { TruckType } from "../../models/truckTypes";
import { Role } from "../../models/roles";
import { UserVerificationService } from "../../services/user/verification.service";
import userService from "../../services/user/user.service";
import { HttpException } from "../../utils/httpException";
import { transaction } from "objection";

export class UserController {
  private userService = userService;

  get = async (req: Request, res: Response) => {
    try {
      const response = await this.userService.getUsers({
        ...req.query,
      });

      res.json({ success: true, ...response });
    } catch (error) {
      res
        .status(500)
        .json({ message: (error as Error).message, success: false });
    }
  };

  async post(req: Request, res: Response) {
    res.json({ message: "POST /user" });
  }

  async put(req: Request, res: Response) {
    res.json({ message: "PUT /user/:id" });
  }

  async delete(req: Request, res: Response) {
    res.json({ message: "DELETE /user/:id" });
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id!;
      const verificationService = new UserVerificationService();

      // Fetch user with all related data
      const user = await User.query()
        .findById(userId)
        .withGraphFetched("[roles.role, company, companyMemberships, driver, verifiedByUser, trucks.truckType]");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Get verification summary
      const verificationSummary =
        await verificationService.getVerificationSummary(userId);

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
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        phoneNumber: user.phoneNumber,
        phoneCountryCode: user.phoneCountryCode,
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
              drivingLicenseExpiresAt: (user.driver as any).drivingLicenseExpiresAt,
              twicNumber: user.driver.twicNumber,
              medicalCertificate: user.driver.medicalCertificate,
              drugTestResult: user.driver.drugTestResult,
              verified: user.driver.verified,
              workRadius: user.driver.workRadius,
              createdAt: user.driver.createdAt,
              updatedAt: user.driver.updatedAt,
            }
          : null,

        // Trucks owned/used by user (multi-truck support)
        trucks: (user as any).trucks || [],

        // Verification metadata
        verifiedBy: user.verifiedByUser
          ? {
              id: user.verifiedByUser.id,
              fullName: user.verifiedByUser.fullName,
              email: user.verifiedByUser.email,
            }
          : null,
      };

      res.json({
        success: true,
        data: profileData,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch profile data",
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const trx = await transaction.start(User.knex()); // Start trx on base model
    try {
      const userId = req.user?.id!;
      const { userName, phoneNumber, phoneCountryCode, profileImage, company, driver, trucks } =
        req.body;
  
      // Prepare user update data
      const userUpdateData: any = { updatedAt: new Date().toISOString() };
      if (userName !== undefined) userUpdateData.userName = userName;
      if (phoneNumber !== undefined) userUpdateData.phoneNumber = phoneNumber;
      if (phoneCountryCode !== undefined) userUpdateData.phoneCountryCode = phoneCountryCode;
      if (profileImage !== undefined) userUpdateData.profileImage = profileImage;
  
      const updatedUser = await User.query(trx).patchAndFetchById(userId, userUpdateData);
  
      // Company upsert
      let updatedCompany = null;
      if (company) {
        const existingCompany = await Company.query(trx).where("userId", userId).first();
        const timestamp = new Date().toISOString();
  
        if (existingCompany) {
          const companyUpdateData: any = { updatedAt: timestamp };
          if (company.companyName !== undefined) companyUpdateData.companyName = company.companyName;
          if (company.industryType !== undefined) companyUpdateData.industryType = company.industryType;
          if (company.contactNumber !== undefined) companyUpdateData.contactNumber = company.contactNumber;
          if (company.phoneNumber !== undefined) companyUpdateData.phoneNumber = company.phoneNumber;
          if (company.address !== undefined) companyUpdateData.address = company.address;
          if (company.country !== undefined) companyUpdateData.country = company.country;
          if (company.state !== undefined) companyUpdateData.state = company.state;
          if (company.city !== undefined) companyUpdateData.city = company.city;
          if (company.zipCode !== undefined) companyUpdateData.zipCode = company.zipCode;
  
          updatedCompany = await Company.query(trx).patchAndFetchById(existingCompany.id, companyUpdateData);
        } else {
          const companyInsertData: any = {
            userId,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          if (company.companyName !== undefined) companyInsertData.companyName = company.companyName;
          if (company.industryType !== undefined) companyInsertData.industryType = company.industryType;
          if (company.contactNumber !== undefined) companyInsertData.contactNumber = company.contactNumber;
          if (company.phoneNumber !== undefined) companyInsertData.phoneNumber = company.phoneNumber;
          if (company.address !== undefined) companyInsertData.address = company.address;
          if (company.country !== undefined) companyInsertData.country = company.country;
          if (company.state !== undefined) companyInsertData.state = company.state;
          if (company.city !== undefined) companyInsertData.city = company.city;
          if (company.zipCode !== undefined) companyInsertData.zipCode = company.zipCode;
  
          updatedCompany = await Company.query(trx).insertAndFetch(companyInsertData);
        }
      }
  
      // Driver upsert
      let updatedDriver = null as any;
      if (driver) {
        const existingDriver = await Driver.query(trx).where({ userId }).first();
        const driverUpdate: any = { updatedAt: new Date().toISOString() };
        if (driver.licenseNumber !== undefined) driverUpdate.licenseNumber = driver.licenseNumber;
        if (driver.drivingLicenseExpiresAt !== undefined) driverUpdate.drivingLicenseExpiresAt = driver.drivingLicenseExpiresAt;
        if (driver.workRadius !== undefined) driverUpdate.workRadius = driver.workRadius;
  
        if (existingDriver) {
          updatedDriver = await Driver.query(trx).patchAndFetchById(existingDriver.id, driverUpdate);
        } else {
          updatedDriver = await Driver.query(trx).insertAndFetch({ userId, licenseNumber: driver.licenseNumber, ...driverUpdate });
        }
      }
  
      // Trucks upsert (replace all)
      let updatedTrucks = null as any;
      if (Array.isArray(trucks)) {
        const typeIds = trucks.map((t: any) => t.truckTypeId).filter((v: any) => v != null);
        if (typeIds.length) {
          const validTypes = await TruckType.query(trx).whereIn("id", typeIds);
          if (validTypes.length !== typeIds.length) {
            throw new HttpException("Invalid truckTypeId detected", 400);
          }
        }
  
        await UserTruck.query(trx).delete().where({ userId });
        const now = new Date().toISOString();
        const inserts = trucks.map((t: any) => ({
          userId,
          truckTypeId: t.truckTypeId,
          capacity: String(t.capacity),
          capacityUnit: (t.capacityUnit || "ft").toString(),
          label: t.label ? String(t.label) : null,
          isPrimary: Boolean(t.isPrimary),
          createdAt: now,
          updatedAt: now,
        }));
        updatedTrucks = inserts.length ? await UserTruck.query(trx).insert(inserts) : [];
      }
  
      // Auto-update verification inside transaction
      const verificationService = new UserVerificationService();
      await verificationService.autoUpdateVerificationStatus(userId);
  
      await trx.commit();
  
      res.json({
        success: true,
        data: {
          user: updatedUser,
          company: updatedCompany,
          driver: updatedDriver,
          trucks: updatedTrucks,
        },
      });
    } catch (error) {
      await trx.rollback();
      console.error("Error updating profile:", error);
      res.status(500).json({ success: false, error: "Failed to update profile" });
    }
  }
  

  async getProfileById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const verificationService = new UserVerificationService();

    // Fetch user with all related data
    const user = await User.query()
      .findById(id)
      .withGraphFetched(
        "[roles.role, company, companyMemberships, driver, verifiedByUser]"
      );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
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

    res.json({
      success: true,
      data: profileData,
    });
    const { password, ...safe } = user as any;
    res.json(safe);
  }
}
