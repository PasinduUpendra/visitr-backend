// src/utils/errorHandler.ts

import { ApiError, ApiErrorResponse, ErrorCode } from "../types/errors";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Builds a structured error response that's safe for client consumption.
 */
export function buildErrorResponse(
  error: any,
  requestId: string,
  defaultStatus: number = 500,
  defaultErrorCode: ErrorCode = "E_INTERNAL"
): ApiErrorResponse {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    const response: ApiErrorResponse = {
      status: error.status,
      errorCode: error.errorCode,
      message: error.message,
      requestId
    };

    if (isDev && error.details) {
      response.details = error.details;
    }

    return response;
  }

  // Handle generic errors
  const response: ApiErrorResponse = {
    status: defaultStatus,
    errorCode: defaultErrorCode,
    message: error?.message || "An unexpected error occurred",
    requestId
  };

  // Include stack trace in development
  if (isDev) {
    response.details = {
      stack: error?.stack,
      name: error?.name,
      originalError: error?.toString()
    };
  }

  return response;
}

/**
 * Logs an error with structured information.
 */
export function logError(
  error: any,
  requestId: string,
  context?: Record<string, any>
) {
  const errorCode = error instanceof ApiError ? error.errorCode : "E_INTERNAL";
  const message = error?.message || "Unknown error";

  const logData = {
    requestId,
    errorCode,
    message,
    ...context
  };

  if (isDev) {
    console.error("[Error]", JSON.stringify(logData, null, 2));
    if (error?.stack) {
      console.error(error.stack);
    }
  } else {
    // Production: structured logging without stack traces
    console.error("[Error]", JSON.stringify(logData));
  }
}

/**
 * Sends a structured error response.
 */
export function sendErrorResponse(
  res: any,
  error: any,
  requestId: string,
  context?: Record<string, any>
) {
  // Log the error
  logError(error, requestId, context);

  // Build and send response
  const errorResponse = buildErrorResponse(error, requestId);
  
  // Set request ID header
  res.setHeader("x-request-id", requestId);
  
  return res.status(errorResponse.status).json(errorResponse);
}
