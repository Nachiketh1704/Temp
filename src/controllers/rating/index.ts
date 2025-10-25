import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { RatingService } from "../../services/rating";
import { HttpException } from "../../utils/httpException";

export class RatingController {
  private service = new RatingService();

  rate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const contractId = parseInt(req.params.contractId);
      const { rateeUserId, stars, comment } = req.body;
      const rating = await this.service.createOrUpdate(contractId, userId, Number(rateeUserId), Number(stars), comment);
      res.json({ success: true, data: rating });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };

  userRatings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const data = await this.service.getUserRatings(userId);
      res.json({ success: true, data });
    } catch (err: any) {
      const status = err instanceof HttpException ? err.status : 500;
      res.status(status).json({ success: false, message: err?.message || "Internal error" });
    }
  };
}


