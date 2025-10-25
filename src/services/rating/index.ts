import { transaction } from "objection";
import { Contract, ContractParticipant, User, UserRating } from "../../models";
import { HttpException } from "../../utils/httpException";

export class RatingService {
  private async canRate(contractId: number, raterUserId: number, rateeUserId: number, trx?: any) {
    const contract = await Contract.query(trx).findById(contractId);
    if (!contract) throw new HttpException("Contract not found", 404);
    if (contract.status !== "completed") throw new HttpException("Can rate only after completion", 400);
    const rater = await ContractParticipant.query(trx).where({ contractId, userId: raterUserId, status: "active" }).first();
    const ratee = await ContractParticipant.query(trx).where({ contractId, userId: rateeUserId }).first();
    if (!rater || !ratee) throw new HttpException("Both users must be part of the contract", 403);
    if (raterUserId === rateeUserId) throw new HttpException("Cannot rate yourself", 400);
  }

  async createOrUpdate(contractId: number, raterUserId: number, rateeUserId: number, stars: number, comment?: string) {
    return await transaction(UserRating.knex(), async (trx) => {
      await this.canRate(contractId, raterUserId, rateeUserId, trx);
      const existing = await UserRating.query(trx)
        .where({ contractId, raterUserId, rateeUserId })
        .first();
      const now = new Date().toISOString();
      if (existing) {
        return await UserRating.query(trx).patchAndFetchById(existing.id, { stars, comment, updatedAt: now });
      }
      return await UserRating.query(trx).insertAndFetch({ contractId, raterUserId, rateeUserId, stars, comment, createdAt: now, updatedAt: now });
    });
  }

  async getUserRatings(userId: number) {
    // Use CTE pipeline to return summary + recent reviews in one roundtrip
    const knex = UserRating.knex();
    const row = await knex
      .with("agg", (qb) =>
        qb
          .from("userRatings")
          .where({ rateeUserId: userId })
          .select(knex.raw("avg(stars)::float as average"), knex.raw("count(id)::int as count"))
      )
      .with("rev", (qb) =>
        qb
          .from("userRatings")
          .where({ rateeUserId: userId })
          .orderBy("createdAt", "desc")
          .limit(50)
          .select("id", "contractId", "raterUserId", "rateeUserId", "stars", "comment", "createdAt")
      )
      .select(
        knex.raw("(select average from agg) as average"),
        knex.raw("(select count from agg) as count"),
        knex.raw("(select coalesce(json_agg(rev.*), '[]'::json) from rev) as reviews")
      )
      .first();

    return {
      summary: { average: Number(row?.average) || 0, count: Number(row?.count) || 0 },
      reviews: row?.reviews || [],
    } as any;
  }
}


