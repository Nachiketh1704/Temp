import { transaction } from "objection";
import bcrypt from "bcryptjs";
import {
  User,
  OtpVerification,
  Company,
  CompanyType,
  UserRole,
} from "../../models";
import { generateOtp, hashOtp, compareOtp } from "../../utils/otp";
import { HttpException } from "../../utils/httpException";
import { OtpPurpose, OtpPurposeType } from "../../constants/otp";
import { generateToken } from "../../utils/jwt";
import emailService from "../email";
import { Logger } from "../../utils/logger";
import { randomUUID } from "crypto";
import moment from "moment";
import { Role } from "../../models/roles";
import { UserService } from "../user";

export class AuthService {
  async signup(
    userName: string,
    email: string,
    password: string,
    callbackUrl?: string,
    companyTypeId?: number,
    companyName?: string,
    profileImage?: string | null,
    phoneNumber?:string,
    phoneCountryCode?:string
  ) {
    const existing = await User.query().findOne({ email });
    if (existing) throw new HttpException("Email already in use.", 409);

    const trx = await transaction.start(User.knex());

    try {
      const hashed = await bcrypt.hash(password, 10);
      const token = randomUUID();
      const tokenExpiresAt = moment().add(1, "day").toISOString();

      const user = await User.query(trx).insert({
        userName,
        firstName: "",
        middleName: "",
        lastName: "",
        email,
        password: hashed,
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: tokenExpiresAt,
        verificationStatus: "pending", // Set initial verification status
        phoneNumber,
        phoneCountryCode,
        ...(profileImage ? { profileImage } : {}),
      });

      if (companyTypeId) {
        // If companyTypeId is provided → must exist
        const company = await CompanyType.query(trx)
          .where({ id: companyTypeId })
          .first();

        if (!company) {
          throw new HttpException("Invalid company type ID provided.", 400);
        }

        const role = await Role.query(trx)
          .where({ name: company.name })
          .first();

        if (!role) {
          throw new HttpException(
            "Role not found for the given company type.",
            400
          );
        }

        await UserRole.query(trx).insert({
          userId: user.id,
          roleId: role.id,
        });

        if (companyName) {
          await Company.query(trx).insert({
            userId: user.id,
            companyName,
            companyTypeId,
          } as any);
        }
      } else {
        // No companyTypeId → default to "driver"
        const role = await Role.query(trx).where({ name: "driver" }).first();

        if (!role) {
          throw new HttpException("Default driver role not found.", 500);
        }

        await UserRole.query(trx).insert({
          userId: user.id,
          roleId: role.id,
        });
      }

      if (companyTypeId && companyName) {
        await Company.query(trx).insert({
          userId: user.id,
          companyName,
          companyTypeId,
        } as any);
      }

      await this._createOtpRecord(
        user.id,
        email,
        OtpPurpose.EMAIL_VERIFICATION,
        trx,
        callbackUrl,
        token
      );

      await trx.commit();
      Logger.info(`👤 New user registered: ${email}`);
      return {
        success: true,
        message: `Verification email sent to ${email}. Please check your inbox.`,
      };
    } catch (err: any) {
      await trx.rollback();
      Logger.warn(`❌ Signup failed for ${email}`);
      throw new HttpException(err.message, 500);
    }
  }

  async login(email: string, password: string) {
    const user = await User.query().findOne({ email });
    if (!user) throw new HttpException("Invalid credentials", 401);
    const { password: userPassword, ...userDetails } = user;
    const isMatch = await bcrypt.compare(password, userPassword);
    if (!isMatch) throw new HttpException("Invalid credentials", 401);

    const userProfile = await UserService.getProfileById(user.id);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    });

    Logger.info(`🔓 Login successful: ${email}`);
    return { token, user: userProfile };
  }

  async sendOtp(
    userId: number,
    email: string,
    purpose: OtpPurposeType,
    callbackUrl?: string
  ) {
    const token = randomUUID();
    const tokenExpiresAt = moment().add(1, "day").toISOString();

    await User.query()
      .patch({
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: tokenExpiresAt,
      })
      .where({ id: userId });

    await this._createOtpRecord(
      userId,
      email,
      purpose,
      undefined,
      callbackUrl,
      token
    );
  }

  private async _createOtpRecord(
    userId: number,
    email: string,
    purpose: OtpPurposeType,
    trx?: any,
    callbackUrl?: string,
    token?: string
  ) {
    const otp = await generateOtp();
    const hashedOtp = await hashOtp(otp);
    const expiresAt = moment().add(10, "minutes").toISOString();

    await OtpVerification.query(trx || User.knex()).insert({
      userId,
      otpCode: hashedOtp,
      type: "email",
      purpose,
      expiresAt,
    });

    const linkSection =
      callbackUrl && token
        ? `<p style="margin: 16px 0;">Or <a href="${callbackUrl}?verificationToken=${token}" style="color:#0d6efd;">Click here to verify your account</a></p>`
        : "";

    const isPasswordReset = purpose === OtpPurpose.PASSWORD_RESET;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #0d6efd;">${isPasswordReset ? "Reset Your Password" : "Welcome to LoadRider! 🚛"}</h2>
        <p>${isPasswordReset ? "Use the OTP below to reset your password." : "Thanks for creating your account — we're excited to have you on board."}</p>
        <p>Your OTP for <strong>${purpose}</strong> is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0;">${otp}</div>
        <p>This OTP will expire in 10 minutes.</p>
        ${linkSection}
        <p style="color: #888; font-size: 12px;">If you didn’t request this, please ignore this email.</p>
      </div>
    `;

    const subject = isPasswordReset
      ? "LoadRider – Password Reset"
      : "Welcome to LoadRider – Verify Your Email";
    await emailService.send({ to: email, subject, html });

    Logger.info(
      `📧 OTP email sent to ${email} via ${emailService["provider"]?.constructor.name} for ${purpose}`
    );
  }

  async verifyOtp(userId: number, inputOtp: string, purpose: OtpPurposeType) {
    const record = await OtpVerification.query()
      .where({ userId, isUsed: false, purpose })
      .where("expiresAt", ">", new Date().toISOString())
      .orderBy("createdAt", "desc")
      .first();

    if (!record) throw new HttpException("Invalid or expired OTP", 400);

    const match = await compareOtp(inputOtp, record.otpCode);
    if (!match) throw new HttpException("Incorrect OTP", 400);

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await User.query()
        .patch({
          isEmailVerified: true,
          emailVerifiedAt: new Date().toLocaleString(),
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        })
        .where({ id: userId });
    }
    let responsePayload: Record<string, unknown> = { success: true };
    if (purpose === OtpPurpose.PASSWORD_RESET) {
      const resetToken = randomUUID();
      const resetExpiresAt = moment().add(30, "minutes").toISOString();
      await User.query()
        .patch({
          passwordResetToken: resetToken,
          passwordResetTokenExpiresAt: resetExpiresAt,
        })
        .where({ id: userId });
      responsePayload = {
        success: true,
        resetToken,
        expiresAt: resetExpiresAt,
      };
    }
    await OtpVerification.query().patchAndFetchById(record.id, {
      isUsed: true,
    });

    Logger.info(`✅ OTP verified for userId: ${userId}`);
    return responsePayload;
  }

  async verifyEmailToken(token: string) {
    const user = await User.query()
      .where({ emailVerificationToken: token })
      .where("emailVerificationTokenExpiresAt", ">", new Date().toISOString())
      .first();

    if (!user) throw new HttpException("Invalid or expired token", 400);

    await User.query()
      .patch({
        isEmailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      })
      .where({ id: user.id });

    Logger.info(`🔗 Email verified using token for userId: ${user.id}`);
    return { success: true };
  }

  async forgotPassword(email: string, callbackUrl?: string) {
    const user = await User.query().findOne({ email });
    if (!user)
      throw new HttpException("No account found with that email.", 404);

    // Generate reset token for link flow and send OTP as well
    const token = randomUUID();
    const tokenExpiresAt = moment().add(1, "hour").toISOString();

    await User.query()
      .patch({
        passwordResetToken: token,
        passwordResetTokenExpiresAt: tokenExpiresAt,
      })
      .where({ id: user.id });

    await this._createOtpRecord(
      user.id,
      user.email,
      OtpPurpose.PASSWORD_RESET,
      undefined,
      callbackUrl,
      token
    );

    Logger.info(`🔐 Password reset OTP and link sent to ${email}`);
    return {
      success: true,
      message: "Password reset instructions sent. Check your email for OTP and link.",
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await User.query()
      .where({ passwordResetToken: token })
      .where("passwordResetTokenExpiresAt", ">", new Date().toISOString())
      .first();

    if (!user) throw new HttpException("Invalid or expired reset token.", 400);

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.query()
      .patch({
        password: hashed,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      })
      .where({ id: user.id });

    Logger.info(`🔐 Password successfully reset for userId: ${user.id}`);
    return { success: true, message: "Password has been reset successfully." };
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await User.query().findById(userId);
    if (!user) throw new HttpException("User not found", 404);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new HttpException("Old password is incorrect", 400);

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.query().patch({ password: hashed }).where({ id: userId });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #0d6efd;">Your Password Has Been Changed</h2>
        <p>This is a confirmation that your password was successfully updated.</p>
        <p>If you didn’t perform this action, please <a href="mailto:support@loadrider.com" style="color:#0d6efd;">contact our support team</a> immediately.</p>
      </div>
    `;
    const subject = "LoadRider – Your Password Was Changed";
    await emailService.send({ to: user.email, subject, html });

    Logger.info(`🔁 Password changed for userId: ${userId}`);
    Logger.info(`📩 Password change confirmation email sent to ${user.email}`);
    return { success: true, message: "Password updated successfully." };
  }
}
