import { Model, RelationMappings } from "objection";
import { JobContract } from "./jobContract";
import { StripePayment } from "./stripePayment";

export class Escrow extends Model {
  id!: number;
  contractId!: number;
  amount!: number;
  status!: "pending" | "released" | "refunded" | "held";
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  contract?: JobContract;
  stripePayments?: StripePayment[];

  static get tableName(): string {
    return "escrows";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["contractId", "amount"],
      properties: {
        id: { type: "integer" },
        contractId: { type: "integer" },
        amount: { type: "number", minimum: 0 },
        status: { 
          type: "string", 
          enum: ["pending", "released", "refunded"],
          default: "pending"
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      }
    };
  }

  static get relationMappings(): RelationMappings {
    return {
      contract: {
        relation: Model.BelongsToOneRelation,
        modelClass: JobContract,
        join: {
          from: "escrows.contractId",
          to: "contracts.id"
        }
      },
      stripePayments: {
        relation: Model.HasManyRelation,
        modelClass: StripePayment,
        join: {
          from: "escrows.id",
          to: "stripePayments.escrowId"
        }
      }
    };
  }
}
