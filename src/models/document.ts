import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { DocumentType } from "./documentType";

/** ---------- DOCUMENTS ---------- */
export class Document extends Model {
  id!: number;
  userId!: number;
  documentTypeId!: number;
  fileUrl!: string;
  expiryDate?: string;
  verified!: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  user?: User;
  documentType?: DocumentType;

  static tableName = "documents";

  static jsonSchema = {
    type: "object",
    required: ["userId", "documentTypeId", "fileUrl"],
    properties: {
      id: { type: "integer" },
      userId: { type: "integer" },
      documentTypeId: { type: "integer" },
      fileUrl: { type: "string" },
      expiryDate: { type: ["string", "null"] },
      verified: { type: "boolean" },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
      deletedAt: { type: ["string", "null"] },
    },
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: "documents.userId", to: "users.id" },
    },
    documentType: {
      relation: Model.BelongsToOneRelation,
      modelClass: DocumentType,
      join: { from: "documents.documentTypeId", to: "documentTypes.id" },
    },
  });
}
