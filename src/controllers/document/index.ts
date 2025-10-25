import { Request, Response } from "express";
import { DocumentService } from "../../services/document";
import { HttpException } from "../../utils/httpException";
import { Logger } from "../../utils/logger";

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Upload a document
   * POST /documents/upload
   */
  uploadDocument = async (req: Request, res: Response) => {
    try {
      const { documentTypeId, fileUrl, expiryDate } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!documentTypeId || !fileUrl) {
        throw new HttpException("documentTypeId and fileUrl are required", 400);
      }

      const document = await this.documentService.uploadDocument({
        userId,
        documentTypeId,
        fileUrl,
        expiryDate,
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error: any) {
      Logger.error(`Error in uploadDocument controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get required documents for the authenticated user
   * GET /documents/required
   */
  getRequiredDocuments = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      const requirements = await this.documentService.getRequiredDocuments(userId);

      res.json({
        success: true,
        data: requirements,
      });
    } catch (error: any) {
      Logger.error(`Error in getRequiredDocuments controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get user's uploaded documents
   * GET /documents/my
   */
  getUserDocuments = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      const documents = await this.documentService.getUserDocuments(userId);

      res.json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      Logger.error(`Error in getUserDocuments controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Delete a document
   * DELETE /documents/:id
   */
  deleteDocument = async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!documentId || isNaN(documentId)) {
        throw new HttpException("Valid document ID is required", 400);
      }

      await this.documentService.deleteDocument(documentId, userId);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error: any) {
      Logger.error(`Error in deleteDocument controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Verify a document (admin function)
   * PATCH /documents/:id/verify
   */
  verifyDocument = async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const { verified } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException("User not authenticated", 401);
      }

      if (!documentId || isNaN(documentId)) {
        throw new HttpException("Valid document ID is required", 400);
      }

      if (typeof verified !== "boolean") {
        throw new HttpException("verified field must be a boolean", 400);
      }

      const document = await this.documentService.verifyDocument(documentId, verified);

      res.json({
        success: true,
        message: `Document ${verified ? "verified" : "unverified"} successfully`,
        data: document,
      });
    } catch (error: any) {
      Logger.error(`Error in verifyDocument controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Get all document types
   * GET /documents/types
   */
  getDocumentTypes = async (req: Request, res: Response) => {
    try {
      const documentTypes = await this.documentService.getAllDocumentTypes();

      res.json({
        success: true,
        data: documentTypes,
      });
    } catch (error: any) {
      Logger.error(`Error in getDocumentTypes controller:: ${error?.message || 'Unknown error'}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  /**
   * Create a new document type (admin function)
   * POST /documents/types
   */
  createDocumentType = async (req: Request, res: Response) => {
    try {
      const { name, description, requiresExpiry } = req.body;

      if (!name) {
        throw new HttpException("Document type name is required", 400);
      }

      const documentType = await this.documentService.createDocumentType({
        name,
        description,
        requiresExpiry: requiresExpiry ?? true,
      });

      res.status(201).json({
        success: true,
        message: "Document type created successfully",
        data: documentType,
      });
    } catch (error: any) {
      Logger.error(`Error in createDocumentType controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Assign document type requirement to a role (admin function)
   * POST /documents/types/:documentTypeId/roles/:roleId
   */
  assignDocumentTypeToRole = async (req: Request, res: Response) => {
    try {
      const documentTypeId = parseInt(req.params.documentTypeId);
      const roleId = parseInt(req.params.roleId);
      const { sortOrder = 0 } = req.body;

      if (!documentTypeId || isNaN(documentTypeId)) {
        throw new HttpException("Valid document type ID is required", 400);
      }

      if (!roleId || isNaN(roleId)) {
        throw new HttpException("Valid role ID is required", 400);
      }

      const requirement = await this.documentService.assignDocumentTypeToRole(
        documentTypeId,
        roleId,
        sortOrder
      );

      res.status(201).json({
        success: true,
        message: "Document type requirement assigned to role successfully",
        data: requirement,
      });
    } catch (error: any) {
      Logger.error(`Error in assignDocumentTypeToRole controller:: ${error?.message || 'Unknown error'}`);
      if (error instanceof HttpException) {
        res.status(error.status).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  };
}
