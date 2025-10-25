import { UserController } from "../../controllers/user";
import { buildValidator, validate } from "../../middlewares/validate";
import { createUserSchema } from "../../validators/user.schema";
import { authenticateToken } from "../../middlewares/authentication";
import { uploadSingle } from "../../middlewares/upload";
import { requireUploadInput } from "../../middlewares/requireUploadInput";
import uploadController from "../../controllers/upload";
import type { RouteDefinition } from "../types";
import { getProfileDoc, updateProfileDoc } from "./swagger/profile.swagger";

const controller = new UserController();

const userRoutes: RouteDefinition[] = [
  {
    path: "/",
    controller: {
      get: controller.get,
      post: controller.post,
    },
    validators: {
      post: validate(buildValidator(createUserSchema)), // ✅ wrap it properly
    },
    docs: {
      get: {
        summary: "Get all users",
        tags: ["User"],
        parameters: [
          {
            name: "userName",
            in: "query",
            description: "Filter by username",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "role",
            in: "query",
            description: "Filter by role name",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            description: "Page number",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of users per page",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: {
            description: "Paginated list of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          fullName: { type: "string" },
                          userName: { type: "string" },
                          email: { type: "string", format: "email" },
                          roles: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                roleId: { type: "integer" },
                                roleName: { type: "string" },
                              },
                            },
                          },
                          company: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "integer" },
                              name: { type: "string" },
                            },
                          },
                          driver: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "integer" },
                              licenseNumber: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalUsers: { type: "integer" },
                    totalPages: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new user",
        tags: ["User"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created successfully",
          },
          400: {
            description: "Invalid input",
          },
        },
      },
    },
  },
  {
    path: "/:id/profile",
    controller: {
      get: controller.getProfileById,
    },
    docs: {
      get: {
        summary: "Get user profile by ID",
        tags: ["User"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
      },
    },
  },
  {
    path: "/:id",
    controller: {
      put: controller.put,
      delete: controller.delete,
    },
    docs: {
      put: {
        summary: "Update user by ID",
        tags: ["User"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User updated successfully",
          },
          404: {
            description: "User not found",
          },
        },
      },
      delete: {
        summary: "Delete user by ID",
        tags: ["User"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          204: {
            description: "User deleted successfully",
          },
          404: {
            description: "User not found",
          },
        },
      },
    },
  },
];

export default userRoutes;
