import type { NextFunction, RequestHandler } from "express";
import type { JSONSchemaType } from "ajv";

export type HTTPMethod = "get" | "post" | "put" | "delete" | "patch";

export type RouteDefinition = {
  path: string;
  controller: Partial<Record<HTTPMethod,  RequestHandler | NextFunction>>;
  validators?: Partial<Record<HTTPMethod, JSONSchemaType<any> | object>>;
  middlewares?: Partial<Record<HTTPMethod, RequestHandler | RequestHandler[]>>;
  docs?: Partial<Record<HTTPMethod, any>>; // 👈 Swagger path spec
  version?: string;
};
