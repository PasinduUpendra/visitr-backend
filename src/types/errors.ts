// src/types/errors.ts

export type ErrorCode = 
  | "E_VALIDATION"
  | "E_AI_PARSE"
  | "E_AI_UPSTREAM"
  | "E_INTERNAL"
  | "E_METHOD_NOT_ALLOWED";

export interface ApiErrorResponse {
  status: number;
  errorCode: ErrorCode;
  message: string;
  requestId: string;
  details?: any; // DEV ONLY
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}
