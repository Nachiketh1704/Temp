import { JSONSchemaType } from "ajv";

export interface DocumentUploadRequest {
  documentTypeId: number;
  fileUrl: string;
  expiryDate?: string;
}

export interface DocumentVerificationRequest {
  verified: boolean;
}

export const documentUploadSchema: JSONSchemaType<DocumentUploadRequest> = {
  type: "object",
  required: ["documentTypeId", "fileUrl"],
  properties: {
    documentTypeId: {
      type: "integer",
      minimum: 1,
      description: "ID of the document type",
    },
    fileUrl: {
      type: "string",
      minLength: 1,
      format: "uri",
      description: "URL of the uploaded file",
    },
    expiryDate: {
      type: "string",
      format: "date",
      nullable: true,
      description: "Expiry date (optional)",
    },
  },
  additionalProperties: false,
};

export const documentVerificationSchema: JSONSchemaType<DocumentVerificationRequest> = {
  type: "object",
  required: ["verified"],
  properties: {
    verified: {
      type: "boolean",
      description: "Whether to verify the document",
    },
  },
  additionalProperties: false,
};
