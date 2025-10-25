import { Request } from "express";

export interface AuthPayload {
  userId: number;
  email: string;
  isEmailVerified: boolean;
  id: number;
  [key: string]: any;
}

export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: AuthPayload;
}
