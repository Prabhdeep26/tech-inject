import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "./errorHandler.js";

/**
 * Express middleware to validate request body against a Zod schema.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return next(new AppError(`Validation failed: ${messages}`, 400));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Express middleware to validate request query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const messages = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return next(new AppError(`Query validation failed: ${messages}`, 400));
    }
    req.query = result.data as Request["query"];
    next();
  };
}
