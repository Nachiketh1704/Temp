import { JobController } from "../../controllers/job";
import { ContractController } from "../../controllers/contract";
import { RatingController } from "../../controllers/rating";
import { authenticateToken } from "../../middlewares/authentication";
import { requireRole } from "../../middlewares/requireRole";

const controller = new JobController();
const contracts = new ContractController();
const rating = new RatingController();

export default [
  // List contracts
  {
    path: "/",
    controller: { get: contracts.list },
    middlewares: { get: [authenticateToken, requireRole(["shipper", "broker", "carrier", "admin"]) ] },
    docs: {
      get: {
        summary: "List contracts (isMine shows only posted by me)",
        tags: ["Contracts"],
        parameters: [
          { name: "isMine", in: "query", schema: { type: "boolean" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active","pending","completed","cancelled","onHold"] } },
          { name: "participantStatus", in: "query", description: "Filter my participation status (csv)", schema: { type: "string", example: "active,invited" } },
          { name: "participantRole", in: "query", description: "Filter my role in contracts (csv)", schema: { type: "string", example: "driver,carrier" } },
          { name: "includeRemovedParticipants", in: "query", description: "Include removed participants in related data", schema: { type: "boolean" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
        ],
        responses: { 200: { description: "Contracts listed with pagination" } },
      },
    },
  },
  // Rate a participant after completion
  {
    path: "/:contractId/rate",
    controller: { post: rating.rate },
    middlewares: { post: [authenticateToken, requireRole(["shipper", "broker", "carrier", "admin"])] },
    docs: {
      post: {
        summary: "Rate another user in the contract (1-5 stars)",
        tags: ["Contracts", "Ratings"],
        parameters: [ { name: "contractId", in: "path", required: true, schema: { type: "integer" } } ],
        requestBody: { content: { "application/json": { schema: { type: "object", required: ["rateeUserId","stars"], properties: { rateeUserId: { type: "integer" }, stars: { type: "integer", minimum: 1, maximum: 5 }, comment: { type: "string" } } } } } },
        responses: { 200: { description: "Rating saved" } },
      },
    },
  },
  // Start contract and hold escrow
  {
    path: "/:id/start",
    controller: { post: controller.startContract },
    middlewares: { post: [authenticateToken, requireRole(["shipper", "broker", "carrier", "admin"])] },
    docs: {
      post: {
        summary: "Start a contract and hold escrow",
        tags: ["Contracts", "Escrow"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Contract ID",
          },
        ],
        responses: {
          200: { description: "Contract started and escrow held successfully" },
          400: { description: "Bad request - contract cannot be started" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Contract not found" },
        },
      },
    },
  },

  // Complete job and release escrow
  {
    path: "/:id/complete",
    controller: { post: controller.completeJob },
    middlewares: { post: [authenticateToken, requireRole(["shipper", "broker", "carrier", "admin"])] },
    docs: {
      post: {
        summary: "Complete a job and release escrow to driver",
        tags: ["Contracts", "Escrow"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Contract ID",
          },
        ],
        responses: {
          200: { description: "Job completed and escrow released successfully" },
          400: { description: "Bad request - contract is not active" },
          401: { description: "Unauthorized - missing or invalid token" },
          403: { description: "Forbidden - insufficient role/permissions" },
          404: { description: "Contract not found" },
        },
      },
    },
  },
];
