import { Model, RelationMappings } from "objection";
import { Contract } from "./contracts";
import { Job } from "./job";

export class SubContract extends Model {
  id!: number;
  rootContractId!: number;       // New field
  parentContractId!: number;
  subContractId!: number;
  resharedJobId!: number;
  splitPercentage!: number;      // e.g., 70.00 for 70%
  splitAmount!: number;          // calculated split amount
  createdAt?: string;
  updatedAt?: string;

  parentContract?: Contract;
  subContract?: Contract;
  rootContract?: Contract;       // relation to root contract
  resharedJob?: Job;

  static tableName = "subContracts";

  static jsonSchema = {
    type: "object",
    required: ["rootContractId", "parentContractId", "subContractId", "resharedJobId", "splitPercentage", "splitAmount"],
    properties: {
      id: { type: "integer" },
      rootContractId: { type: "integer" },
      parentContractId: { type: "integer" },
      subContractId: { type: "integer" },
      resharedJobId: { type: "integer" },
      splitPercentage: { type: "number", minimum: 0, maximum: 100 },
      splitAmount: { type: "number", minimum: 0 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    rootContract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "subContracts.rootContractId", to: "contracts.id" },
    },
    parentContract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "subContracts.parentContractId", to: "contracts.id" },
    },
    subContract: {
      relation: Model.BelongsToOneRelation,
      modelClass: Contract,
      join: { from: "subContracts.subContractId", to: "contracts.id" },
    },
    resharedJob: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: "subContracts.resharedJobId", to: "jobs.id" },
    },
  });
}
