import {
  Document,
  DocumentType,
  DocumentTypeRoleRequirement,
  UserRole,
} from "../../models";
import { CommonDocumentTypes, DocumentStatus } from "../../constants/enum";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";

export interface DocumentUploadData {
  userId: number;
  documentTypeId: number;
  fileUrl: string;
  expiryDate?: string;
}

export interface DocumentRequirement {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  requiresExpiry: boolean;
  isUploaded: boolean;
  documentId?: number;
  fileUrl?: string;
  expiryDate?: string;
  verified: boolean;
  status: string;
}

export class DocumentService {
  /**
   * Upload a document for a user
   */
  async uploadDocument(data: DocumentUploadData): Promise<Document> {
    try {
      // Check if document type exists
      const documentType = await DocumentType.query().findById(
        data.documentTypeId
      );
      if (!documentType) {
        throw new HttpException("Invalid document type", 400);
      }

      // Check if user already has this document type
      const existingDocument = await Document.query()
        .where({ userId: data.userId, documentTypeId: data.documentTypeId })
        .first();

      if (existingDocument) {
        // Update existing document
        return await Document.query().patchAndFetchById(existingDocument.id, {
          fileUrl: data.fileUrl,
          expiryDate: data.expiryDate,
          verified: false, // Reset verification status
          updatedAt: new Date().toISOString(),
        });
      }

      // Create new document
      return await Document.query().insert({
        userId: data.userId,
        documentTypeId: data.documentTypeId,
        fileUrl: data.fileUrl,
        expiryDate: data.expiryDate,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      Logger.error(
        `Error uploading document: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get required documents for a user based on their roles
   */
  async getRequiredDocuments(userId: number): Promise<DocumentRequirement[]> {
    try {
      // Get user's roles
      const userRoles = await UserRole.query()
        .where({ userId })
        .withGraphFetched("role");

      if (!userRoles.length) {
        throw new HttpException("User has no roles assigned", 400);
      }

      const roleIds = userRoles.map((ur) => ur.roleId);

      // Get required document types for user's roles
      const requirements = await DocumentTypeRoleRequirement.query()
        .whereIn("roleId", roleIds)
        .withGraphFetched("[documentType, role]")
        .orderBy("sortOrder");

      // Get user's existing documents
      const userDocuments = await Document.query()
        .where({ userId })
        .withGraphFetched("documentType");

      // Create document requirements map
      const requirementsMap = new Map<number, DocumentRequirement>();

      for (const req of requirements) {
        const docType = req.documentType!;
        const userDoc = userDocuments.find(
          (doc) => doc.documentTypeId === docType.id
        );

        requirementsMap.set(docType.id, {
          id: docType.id,
          name: docType.name,
          displayName: docType?.displayName,
          description: docType.description || undefined,
          requiresExpiry: docType.requiresExpiry,
          isUploaded: !!userDoc,
          documentId: userDoc?.id,
          fileUrl: userDoc?.fileUrl,
          expiryDate: userDoc?.expiryDate,
          verified: userDoc?.verified || false,
          status: this.getDocumentStatus(userDoc),
        });
      }

      return Array.from(requirementsMap.values());
    } catch (error: any) {
      Logger.error(
        `Error getting required documents: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get user's uploaded documents
   */
  async getUserDocuments(userId: number): Promise<Document[]> {
    try {
      return await Document.query()
        .where({ userId })
        .withGraphFetched("documentType")
        .orderBy("createdAt", "desc");
    } catch (error: any) {
      Logger.error(
        `Error getting user documents: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: number, userId: number): Promise<void> {
    try {
      const document = await Document.query()
        .where({ id: documentId, userId })
        .first();

      if (!document) {
        throw new HttpException("Document not found", 404);
      }

      await Document.query().where({ id: documentId }).delete();
      // .patch({
      //   deletedAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      // });
    } catch (error: any) {
      Logger.error(
        `Error deleting document: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Verify a document (admin function)
   */
  async verifyDocument(
    documentId: number,
    verified: boolean
  ): Promise<Document> {
    try {
      const document = await Document.query().findById(documentId);
      if (!document) {
        throw new HttpException("Document not found", 404);
      }

      return await Document.query().patchAndFetchById(documentId, {
        verified,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      Logger.error(
        `Error verifying document: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Get document status based on verification and expiry
   */
  private getDocumentStatus(document?: Document): string {
    if (!document) {
      return DocumentStatus.PENDING;
    }

    if (!document.verified) {
      return DocumentStatus.PENDING;
    }

    if (document.expiryDate && new Date(document.expiryDate) < new Date()) {
      return DocumentStatus.EXPIRED;
    }

    return DocumentStatus.VERIFIED;
  }

  /**
   * Get all document types
   */
  async getAllDocumentTypes(): Promise<DocumentType[]> {
    try {
      return await DocumentType.query().orderBy("name");
    } catch (error: any) {
      Logger.error(
        `Error getting document types: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Create a new document type
   */
  async createDocumentType(data: {
    name: string;
    description?: string;
    requiresExpiry: boolean;
  }): Promise<DocumentType> {
    try {
      return await DocumentType.query().insert({
        ...data,
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      Logger.error(
        `Error creating document type: ${error?.message || "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Assign document type requirement to a role
   */
  async assignDocumentTypeToRole(
    documentTypeId: number,
    roleId: number,
    sortOrder: number = 0
  ): Promise<DocumentTypeRoleRequirement> {
    try {
      return await DocumentTypeRoleRequirement.query().insert({
        documentTypeId,
        roleId,
        sortOrder,
      });
    } catch (error: any) {
      Logger.error(
        `Error assigning document type to role: ${
          error?.message || "Unknown error"
        }`
      );
      throw error;
    }
  }
}
