import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error("Unhandled error", err);

  res.status(500).json({
    error: {
      message: "Internal server error",
      details:
        env.NODE_ENV === "development"
          ? String((err as Error)?.message ?? err)
          : undefined
    }
  });
}
