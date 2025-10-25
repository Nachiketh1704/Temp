import { Model } from "objection";
import { Role } from "./roles";

export class RoleCommission extends Model {
  id!: number;
  roleId!: number;
  billingCycle!: "hourly" | "weekly" | "monthly";
  platformCommissionPercent!: number;
  createdAt?: string;

  static tableName = "roleCommissions";

  static jsonSchema = {
    type: "object",
    required: ["roleId", "billingCycle", "platformCommissionPercent"],
    properties: {
      id: { type: "integer" },
      roleId: { type: "integer" },
      billingCycle: { type: "string", enum: ["hourly", "weekly", "monthly"] },
      platformCommissionPercent: { type: "number" },
      createdAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = {
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: { from: "roleCommissions.roleId", to: "roles.id" },
    },
  };
}
