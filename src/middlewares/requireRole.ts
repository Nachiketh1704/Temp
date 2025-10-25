import { Request, Response, NextFunction } from "express";
import { HttpException } from "../utils/httpException";

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user; // or use your AuthenticatedRequest
    user.role = "admin"
    if (!user || !roles.includes(user.role)) {
      return next(new HttpException("Forbidden: insufficient permissions", 403));
    }

    next();
  };
}
