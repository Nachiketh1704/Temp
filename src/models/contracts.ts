import { Model, RelationMappings } from "objection";
import { Job } from "./job";
import { Milestone } from "./milestone";
import { JobApplication } from "./jobApplications";
import { ContractParticipant } from "./contractParticipants";

export class Contract extends Model {
  id!: number;
  jobId!: number;
  parentContractId?: number | null;
  jobApplicationId?: number | null;
  hiredByUserId?: number | null;
  hiredUserId?: number | null;
  amount!: number;
  billingCycle?: string | null;
  status!: "active" | "onHold" | "completed" | "cancelled";
  nextBillingDate?: string | null;
  retryCount?: number | null;
  lastAttemptedAt?: string | null;
  notes?: string | null;
  createdAt!: string;
  updatedAt!: string;
  deletedAt?: string | null;

  // Relations
  job?: Job;
  jobApplication?: JobApplication;
  milestones?: Milestone[];

  static tableName = "contracts";

  static jsonSchema = {
    type: "object",
    required: ["jobId", "status"],
    properties: {
      id: { type: "integer" },
      jobId: { type: "integer" },
      jobApplicationId: { type: ["integer", "null"] },
      hiredByUserId: { type: ["integer", "null"] },
      hiredUserId: { type: ["integer", "null"] },
      amount: { type: ["string", "null","number"] },
      billingCycle: { type: ["string", "null"] },
      status: {
        type: "string",
        enum: ["active", "onHold", "completed", "cancelled"],
      },
      nextBillingDate: { type: ["string", "null"], format: "date-time" },
      retryCount: { type: ["integer", "null"] },
      lastAttemptedAt: { type: ["string", "null"], format: "date-time" },
      notes: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      deletedAt: { type: ["string", "null"], format: "date-time" },
    },
  };

  static relationMappings = (): RelationMappings => ({
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: {
        from: "contracts.jobId",
        to: "jobs.id",
      },
    },
    jobApplication: {
      relation: Model.BelongsToOneRelation,
      modelClass: JobApplication,
      join: {
        from: "contracts.jobApplicationId",
        to: "jobApplications.id",
      },
    },
    milestones: {
      relation: Model.HasManyRelation,
      modelClass: Milestone,
      join: {
        from: "contracts.id",
        to: "milestones.contractId",
      },
    },
    contractParticipants: {
      relation: Model.HasManyRelation,
      modelClass: ContractParticipant,
      join: { from: "contracts.id", to: "contractParticipants.contractId" },
    },
  });
}
