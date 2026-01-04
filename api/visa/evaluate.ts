// api/visa/evaluate.ts

import { AiClient } from "../../src/services/AiClient";
import { VisaEvaluationInput } from "../../src/types/visa";
import { validateEvaluationResult } from "../../src/utils/responseValidator";
import { sendErrorResponse } from "../../src/utils/errorHandler";
import { ApiError } from "../../src/types/errors";
import { validateCountryName, redactPayloadForLogging } from "../../src/utils/validation";
import { z } from "zod";
import { randomUUID } from "crypto";

const isDev = process.env.NODE_ENV !== "production";

const travelPurposeEnum = z.enum([
  "tourism",
  "family_visit",
  "business",
  "study",
  "work",
  "transit",
  "other"
]);

const schema = z.object({
  nationality: z.string().min(2),
  destinationCountry: z.string().min(2),
  travelPurpose: travelPurposeEnum,
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  additionalContext: z.string().optional()
});

export default async function handler(req: any, res: any) {
  // Generate request ID for tracking
  const requestId = randomUUID();
  
  try {
    // Method validation
    if (req.method !== "POST") {
      throw new ApiError(
        405,
        "E_METHOD_NOT_ALLOWED",
        "Method not allowed. Use POST."
      );
    }

    // DEV-only: Log incoming request with redacted payload
    if (isDev) {
      console.log(`[Request] requestId="${requestId}", endpoint="/api/visa/evaluate"`);
      console.log("[Payload]", JSON.stringify(redactPayloadForLogging(req.body), null, 2));
    }

    // Input validation with Zod schema
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      throw new ApiError(
        400,
        "E_VALIDATION",
        "Invalid input. Please check nationality, destinationCountry, and travelPurpose fields.",
        parse.error.flatten()
      );
    }

    const input = parse.data;

    // Additional validation: Reject ISO codes
    try {
      validateCountryName(input.nationality, "nationality");
      validateCountryName(input.destinationCountry, "destinationCountry");
    } catch (validationError: any) {
      throw new ApiError(
        400,
        "E_VALIDATION",
        validationError.message,
        { field: validationError.message.includes("nationality") ? "nationality" : "destinationCountry" }
      );
    }

    // Validate travelPurpose enum (already validated by Zod, but explicit check for clarity)
    const validPurposes = ["tourism", "family_visit", "business", "study", "work", "transit", "other"];
    if (!validPurposes.includes(input.travelPurpose)) {
      throw new ApiError(
        400,
        "E_VALIDATION",
        `Invalid travelPurpose. Must be one of: ${validPurposes.join(", ")}.`,
        { received: input.travelPurpose, expected: validPurposes }
      );
    }

    // Evaluate visa requirements
    const ai = new AiClient();
    const visaInput = input as VisaEvaluationInput;
    let result;
    
    try {
      result = await ai.evaluateVisa(visaInput);
    } catch (aiError: any) {
      throw new ApiError(
        503,
        "E_AI_UPSTREAM",
        "Unable to process visa evaluation at this time. Please try again.",
        { originalError: aiError?.message }
      );
    }

    // Validate and sanitize the AI response before returning
    // This prevents breaking the frontend if AI output is malformed
    let validated;
    try {
      validated = validateEvaluationResult(result);
    } catch (validationError: any) {
      throw new ApiError(
        500,
        "E_AI_PARSE",
        "Unable to parse visa evaluation results. Please try again.",
        { originalError: validationError?.message }
      );
    }

    const caseId = randomUUID();

    // Set request ID header
    res.setHeader("x-request-id", requestId);

    // Success response
    return res.status(200).json({
      caseId,
      summary: validated.summary,
      recommendedRoute: validated.recommendedRoute,
      caveats: validated.caveats,
      verdict: validated.verdict,
      stats: validated.stats,
      requestId
    });
  } catch (err: any) {
    // All errors are handled with structured responses
    return sendErrorResponse(res, err, requestId, {
      endpoint: "/api/visa/evaluate",
      method: req.method,
      hasBody: !!req.body
    });
  }
}

