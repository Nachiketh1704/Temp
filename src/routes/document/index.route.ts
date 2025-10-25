import { DocumentController } from "../../controllers/document";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";
import { useValidator } from "../../middlewares/validate";
import { documentUploadSchema, documentVerificationSchema } from "../../validators/document.schema";

const controller = new DocumentController();

export default [
  // Upload document (authenticated users)
  {
    path: "/upload",
    controller: { post: controller.uploadDocument },
    validators: { post: useValidator(documentUploadSchema) },
    middlewares: { post: [authenticateToken] },
    docs: {
      post: {
        summary: "Upload a document",
        tags: ["Documents"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["documentTypeId", "fileUrl"],
                properties: {
                  documentTypeId: { type: "integer", description: "ID of the document type" },
                  fileUrl: { type: "string", description: "URL of the uploaded file" },
                  expiryDate: { type: "string", format: "date", description: "Expiry date (optional)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document uploaded successfully" },
          400: { description: "Bad request - missing required fields" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Get required documents for user (authenticated users)
  {
    path: "/required",
    controller: { get: controller.getRequiredDocuments },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get required documents for the authenticated user",
        tags: ["Documents"],
        responses: {
          200: { description: "Required documents retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Get user's uploaded documents (authenticated users)
  {
    path: "/my",
    controller: { get: controller.getUserDocuments },
    middlewares: { get: [authenticateToken] },
    docs: {
      get: {
        summary: "Get user's uploaded documents",
        tags: ["Documents"],
        responses: {
          200: { description: "User documents retrieved successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
        },
      },
    },
  },

  // Delete document (authenticated users)
  {
    path: "/:id",
    controller: { delete: controller.deleteDocument },
    middlewares: { delete: [authenticateToken] },
    docs: {
      delete: {
        summary: "Delete a document",
        tags: ["Documents"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document ID",
          },
        ],
        responses: {
          200: { description: "Document deleted successfully" },
          401: { description: "Unauthorized - missing or invalid token" },
          404: { description: "Document not found" },
        },
      },
    },
  },

  // Verify document (admin function)
  {
    path: "/:id/verify",
    controller: { patch: controller.verifyDocument },
    validators: { patch: useValidator(documentVerificationSchema) },
    middlewares: { patch: [authenticateToken, requireRole(["admin", "moderator"])] },
    docs: {
      patch: {
        summary: "Verify or unverify a document (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["verified"],
                properties: {
                  verified: { type: "boolean", description: "Whether to verify the document" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Document verification status updated" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Document not found" },
        },
      },
    },
  },

  // Get all document types (public)
  {
    path: "/types",
    controller: { get: controller.getDocumentTypes },
    docs: {
      get: {
        summary: "Get all document types",
        tags: ["Documents"],
        responses: {
          200: { description: "Document types retrieved successfully" },
        },
      },
    },
  },

  // Create document type (admin function)
  {
    path: "/types",
    controller: { post: controller.createDocumentType },
    middlewares: { post: [authenticateToken, requireRole(["admin"])] },
    docs: {
      post: {
        summary: "Create a new document type (admin only)",
        tags: ["Documents", "Admin"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", description: "Name of the document type" },
                  description: { type: "string", description: "Description (optional)" },
                  requiresExpiry: { type: "boolean", description: "Whether expiry date is required (default: true)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document type created successfully" },
          400: { description: "Bad request - missing required fields" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },

  // Assign document type to role (admin function)
  {
    path: "/types/:documentTypeId/roles/:roleId",
    controller: { post: controller.assignDocumentTypeToRole },
    middlewares: { post: [authenticateToken, requireRole(["admin"])] },
    docs: {
      post: {
        summary: "Assign document type requirement to a role (admin only)",
        tags: ["Documents", "Admin"],
        parameters: [
          {
            name: "documentTypeId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Document type ID",
          },
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Role ID",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  sortOrder: { type: "integer", description: "Sort order (default: 0)" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document type requirement assigned to role successfully" },
          400: { description: "Bad request - invalid IDs" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
        },
      },
    },
  },
];
