import { AuthController } from "../../controllers/auth";
import { useValidator } from "../../middlewares/validate";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../../validators/auth.schema";
import { authenticateToken } from "../../middlewares/authentication";
import type { RouteDefinition } from "../types";

const controller = new AuthController();

const passwordRoutes: RouteDefinition[] = [
  {
    path: "/forgot-password",
    controller: { post: controller.forgotPassword },
    validators: { post: useValidator(forgotPasswordSchema) },
    docs: {
      post: {
        summary: "Request password reset (OTP + link)",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: forgotPasswordSchema,
            },
          },
        },
        responses: {
          200: { description: "OTP and reset link sent to email" },
          404: { description: "Email not found" },
        },
      },
    },
  },
  {
    path: "/reset-password",
    controller: { post: controller.resetPassword },
    validators: { post: useValidator(resetPasswordSchema) },
    docs: {
      post: {
        summary: "Reset password using token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: resetPasswordSchema,
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully" },
          400: { description: "Invalid or expired token" },
        },
      },
    },
  },
  {
    path: "/change-password",
    controller: { post: controller.changePassword },
    validators: { post: useValidator(changePasswordSchema) },
    middlewares: { post: authenticateToken },
    docs: {
      post: {
        summary: "Change password using old password",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: changePasswordSchema,
            },
          },
        },
        responses: {
          200: { description: "Password changed successfully" },
        },
      },
    },
  },
];

export default passwordRoutes;
