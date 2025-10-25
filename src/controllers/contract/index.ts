import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { Contract } from "../../models/contracts";
import { ContractParticipant } from "../../models/contractParticipants";
import { raw } from "objection";

export class ContractController {
  list = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const isMine = String(req.query.isMine || "false") === "true";
      const status = req.query.status as string | undefined;
      const participantStatusParam = (req.query.participantStatus as string | undefined) || undefined; // csv or single
      const participantRoleParam = (req.query.participantRole as string | undefined) || undefined; // csv or single
      const includeRemovedParticipants = String(req.query.includeRemovedParticipants || "false") === "true";
      const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "20")) || 20));

      const participantStatuses = participantStatusParam
        ? participantStatusParam.split(",").map((s) => s.trim()).filter(Boolean)
        : ["active", "invited"]; // default: show active+invited memberships for current user

      const participantRoles = participantRoleParam
        ? participantRoleParam.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;

      let query = Contract.query()
        .withGraphFetched("[job.[company,visibilityRoles.role], jobApplication, milestones, contractParticipants.user]")
        .modifyGraph("contractParticipants", (qb) => {
          if (!includeRemovedParticipants) qb.whereNot("status", "removed");
        })
        .orderBy("createdAt", "desc");

      if (status) {
        query = query.where("status", status);
      }

      if (isMine) {
        // Contracts for jobs posted by me (company's user)
        query = query.whereExists(
          Contract.relatedQuery("job").where("companyId", user.company?.id || -1)
        );
      } else {
        // Contracts where I'm poster OR I am participant (driver/carrier/broker)
        query = query.where((qb) => {
          qb.where("hiredUserId", user.id) // direct hiredId match
            .orWhereExists(
              Contract.relatedQuery("contractParticipants")
                .where("userId", user.id)
                .whereIn("status", participantStatuses)
                .modify((pqb) => {
                  if (participantRoles && participantRoles.length > 0) {
                    pqb.whereIn("role", participantRoles);
                  }
                })
            );
        });
      }

      const total = await query.clone().resultSize();
      const rows = await query.clone().limit(pageSize).offset((page - 1) * pageSize);
      res.json({ success: true, data: rows, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Internal error" });
    }
  };
}


