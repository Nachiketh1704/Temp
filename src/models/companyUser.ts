import { Model, RelationMappings } from "objection";
import { User } from "./users";
import { Company } from "./companies";

export class CompanyUser extends Model {
  id!: number;
  companyId!: number;
  userId!: number;
  isPrimary!: boolean;
  roleInCompany!: string;
  
  // Relations
  company?: Company;

  static tableName = "companyUsers";

  static jsonSchema = {
    type: "object",
    required: ["companyId", "userId"],
    properties: {
      id: { type: "integer" },
      companyId: { type: "integer" },
      userId: { type: "integer" },
      isPrimary: { type: "boolean" },
      roleInCompany: { type: "string" }
    }
  };

  static relationMappings = (): RelationMappings => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "companyUsers.userId",
        to: "users.id"
      }
    },
    company: {
      relation: Model.BelongsToOneRelation,
      modelClass: Company,
      join: {
        from: "companyUsers.companyId",
        to: "companies.id"
      }
    }
  });
}
